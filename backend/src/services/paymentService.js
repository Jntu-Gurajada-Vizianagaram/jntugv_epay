const db = require("../models");
const Payment = db.Payment;
const { SBIEPayClient } = require("epay_nodejs_sdk");
const AES256 = require("../utils/encryptor");
const fs = require("fs/promises");
const path = require("path");
const aes = new AES256();

const verificationLogPath = path.resolve(__dirname, "../../sbiepay-integration-verification-log.txt");

const nowIst = () => new Date().toLocaleString("en-IN", {
  timeZone: "Asia/Kolkata",
  hour12: false
});

const toLogText = (value) => {
  if (value === undefined || value === null || value === "") return "N/A";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
};

async function appendVerificationLog(title, lines) {
  const body = [
    "",
    "===============================================================================",
    `LIVE LOG - ${title}`,
    "===============================================================================",
    `Timestamp: ${nowIst()} IST`,
    ...lines.map(([label, value]) => `${label}: ${toLogText(value)}`)
  ].join("\n");

  try {
    await fs.appendFile(verificationLogPath, `${body}\n`, "utf8");
  } catch (error) {
    console.warn("Unable to write SBIePay verification log:", error.message);
  }
}

const successStatuses = new Set(["SUCCESS", "PAID"]);
const failedStatuses = new Set(["FAIL", "FAILED", "ABORT", "ABORTED"]);

function mapBankStatus(status) {
  const normalized = String(status || "").toUpperCase();
  if (successStatuses.has(normalized)) return "SUCCESS";
  if (failedStatuses.has(normalized)) return "FAILED";
  if (normalized === "PENDING") return "PENDING";
  if (normalized === "REFUNDED") return "REFUNDED";
  return "PENDING";
}

function parseFeeGst(totalFeeGst) {
  const [serviceChargeRaw, gstRaw] = String(totalFeeGst || "").split("^");
  const serviceChargePaid = serviceChargeRaw && serviceChargeRaw !== "NA" ? serviceChargeRaw : "0.00";
  const gstPaid = gstRaw && gstRaw !== "NA" ? gstRaw : "0.00";
  const totalChargesPaid = (
    (Number.parseFloat(serviceChargePaid) || 0) +
    (Number.parseFloat(gstPaid) || 0)
  ).toFixed(2);

  return {
    serviceChargePaid,
    gstPaid,
    totalChargesPaid
  };
}

function parseSbiBrowserResponse(decrypted) {
  const parts = String(decrypted || "").split("|");
  const statusCandidates = ["SUCCESS", "PAID", "FAIL", "FAILED", "PENDING", "ABORT", "ABORTED", "REFUNDED"];
  const statusIndex = parts.findIndex((part) => statusCandidates.includes(String(part || "").toUpperCase()));

  if (statusIndex === 2) {
    return {
      format: "MERCHANT_ORDER_FIRST",
      merchantTxnId: parts[0],
      atrn: parts[1],
      status: parts[2],
      amount: parts[3],
      currency: parts[4],
      payMode: parts[5],
      customerName: parts[6],
      statusDescription: parts[7],
      bankCode: parts[8],
      bankReferenceNumber: parts[9],
      transactionDate: parts[10],
      country: parts[11],
      responseCode: parts[12],
      merchantId: parts[13],
      totalFeeGst: parts[14],
      ...parseFeeGst(parts[14]),
      rawParts: parts
    };
  }

  if (statusIndex === 0) {
    return {
      format: "STATUS_FIRST",
      status: parts[0],
      merchantId: parts[1],
      merchantTxnId: parts[2],
      sbiePayRefId: parts[3],
      amount: parts[4],
      currency: parts[5],
      customerName: parts[6],
      bankCode: parts[7],
      bankReferenceNumber: parts[8],
      transactionDate: parts[9],
      country: parts[10],
      responseCode: parts[11],
      totalFeeGst: parts[12],
      ...parseFeeGst(parts[12]),
      rawParts: parts
    };
  }

  return {
    format: "UNKNOWN",
    status: statusIndex >= 0 ? parts[statusIndex] : "PENDING",
    merchantTxnId: parts[0],
    amount: parts[3] || parts[4],
    rawParts: parts
  };
}

function normalizeGatewayPayload(payload = {}) {
  const charges = parseFeeGst(payload.totalFeeGst);
  const bankReferenceNumber =
    payload.bankReferenceNumber ||
    payload.bankTxnId ||
    payload.sbiePayRefId ||
    payload.atrn ||
    payload.paymentRefNumber ||
    "N/A";

  return {
    ...payload,
    status: String(payload.status || payload.orderStatus || "PENDING").toUpperCase(),
    amount: payload.amount || payload.orderAmount,
    bankTxnId: payload.bankTxnId || bankReferenceNumber,
    bankReferenceNumber,
    atrn: payload.atrn || payload.sbiePayRefId || payload.paymentRefNumber,
    transactionNumber: payload.transactionNumber || payload.merchantTxnId,
    paymentId: payload.paymentId || payload.transaction_id,
    serviceChargePaid: payload.serviceChargePaid || charges.serviceChargePaid,
    gstPaid: payload.gstPaid || charges.gstPaid,
    totalChargesPaid: payload.totalChargesPaid || charges.totalChargesPaid
  };
}

async function buildReturnPayload(decrypted, encryptedPayload) {
  const parsed = parseSbiBrowserResponse(decrypted);

  await appendVerificationLog("BROWSER RESPONSE", [
    ["Encrypted Browser Response", encryptedPayload],
    ["Decrypted Browser Response", decrypted],
    ["Detected Response Format", parsed.format],
    ["Transaction Status", parsed.status],
    ["Merchant ID", parsed.merchantId],
    ["Merchant Order Number", parsed.merchantTxnId],
    ["SBIePay Reference ID / ATRN", parsed.sbiePayRefId || parsed.atrn],
    ["Amount", parsed.amount],
    ["Currency", parsed.currency],
    ["Status Description", parsed.statusDescription],
    ["Bank Code", parsed.bankCode],
    ["Bank Reference Number", parsed.bankReferenceNumber],
    ["Transaction Date", parsed.transactionDate]
  ]);

  return {
    orderInfo: {
      orderStatus: parsed.status,
      orderRefNumber: parsed.merchantTxnId,
      orderAmount: parsed.amount
    },
    paymentInfo: {
      paymentRefNumber: parsed.bankReferenceNumber || parsed.sbiePayRefId || parsed.atrn,
      orderAmount: parsed.amount
    },
    parsed,
    rawDecrypted: decrypted
  };
}

exports.initiate = async (data) => {

  const merchantTxnId = "JNTUGV" + Date.now();

  /* Create Base Payment Record */
  const payment = await Payment.create({
    merchantTxnId,
    student_roll: data.student_roll,
    student_name: data.student_name,
    father_name: data.father_name,
    study_status: data.study_status,
    email: data.email,
    mobile: data.mobile,
    year: data.year,
    college_code: data.college_code,
    college_name: data.college_name,
    branch_code: data.branch_code,
    branch_name: data.branch_name,
    course: data.course,
    roll_number: data.roll_number,
    payment_type: data.payment_type,
    payment_category: data.payment_category,
    amount: data.amount,
    status: "INITIATED"
  });

  /* Create Specific Fee Details based on Category/Type */
  if (data.payment_category === "UNIVERSITY_EXAMINATION") {
    await db.ExamFeeDetail.create({
      paymentId: payment.transaction_id,
      semester: data.semester,
      year: data.year,
      exam_type: data.payment_subtype, // REGULAR, SUPPLEMENTARY etc
      description: data.remarks
    });
  } else if (data.payment_category === "PHD_FEE") {
    await db.PhdFeeDetail.create({
      paymentId: payment.transaction_id,
      department: data.department,
      fee_type: data.fee_type, // TUITION, ADMISSION etc
      description: data.remarks
    });
  } else if (data.payment_category === "CERTIFICATE") {
    await db.CertificateFeeDetail.create({
      paymentId: payment.transaction_id,
      certificate_type: data.payment_subtype,
      college_code: data.college_code,
      college_name: data.college_name,
      approval_letter_ref: data.approval_letter_ref,
      description: data.remarks
    });
  } else if (data.payment_category === "ADMISSION") {
    await db.AdmissionFeeDetail.create({
      paymentId: payment.transaction_id,
      admission_ref: data.student_roll, // "NEW_ADMISSION" or similar
      course: data.course,
      branch: data.branch,
      category: data.category,
      gender: data.gender,
      dob: data.dob,
      aadhar: data.aadhar,
      address: data.address,
      description: data.remarks
    });
  } else if (data.payment_category === "AFFILIATION") {
    await db.AffiliationFeeDetail.create({
      paymentId: payment.transaction_id,
      college_code: data.student_roll, // In affiliation form, 'student_roll' holds 'code'
      college_name: data.student_name, // 'student_name' holds 'collegeName'
      affiliation_type: data.payment_subtype,
      description: data.remarks
    });
  }

  const cleanUrl = (url) => (url ? url.replace(/\/$/, "") : "");
  const joinUrl = (base, pathSuffix) => `${cleanUrl(base)}${pathSuffix.startsWith("/") ? pathSuffix : `/${pathSuffix}`}`;
  const apiBaseFromEnv = cleanUrl(process.env.API_URL);
  const apiBaseUrl = apiBaseFromEnv
    ? (/\/api$/i.test(apiBaseFromEnv) ? apiBaseFromEnv : `${apiBaseFromEnv}/api`)
    : "https://localhost:4000/api";

  // SBI_PUSH_URL is the official term for the server-to-server callback.
  // API_URL may be either https://host or https://host/api; both are supported.
  const callbackUrl = cleanUrl(process.env.SBI_PUSH_URL) || cleanUrl(process.env.CALLBACK_URL) || joinUrl(apiBaseUrl, "/payment/callback");
  const returnUrl = cleanUrl(process.env.RETURN_URL) || joinUrl(apiBaseUrl, "/payment/return");
  const isBankHostedTestPage = (url) => /sbiuat\.bank\.in\/secure\/(?:sucess3|fail3)\.jsp/i.test(String(url || ""));

  try {
    // Using LIVE TESTKIT credentials and Hosted Form code as requested for Multi Account Settlement
    const sbiePayClient = new SBIEPayClient({
      apiKey: process.env.SBI_MERCHANT_ID,
      apiSecret: process.env.SBI_MERCHANT_KEY,
      encryptionKey: process.env.SBI_ENCRYPTION_KEY_BASE64
    }, 'SANDBOX', true);

    const merchantId = data.merchantId || process.env.SBI_MERCHANT_ID;
    const aggregatorId = data.aggregatorId || process.env.SBI_AGGREGATOR_ID || "SBIEPAY";

    const operatingMode = data.operatingMode || process.env.SBI_OPERATING_MODE || "DOM";
    const merchantCountry = data.merchantCountry || process.env.SBI_MERCHANT_COUNTRY || "IN";
    const merchantCurrency = data.merchantCurrency || process.env.SBI_MERCHANT_CURRENCY || "INR";
    const TotalDueAmount = String(data.amount);
    const Otherdetail = data.student_name || "NA";

    // SBI sends encrypted browser responses to these URLs. Route through the backend
    // first so we can decrypt, store, and then redirect to the correct client page.
    const successUrl = data.successUrl && !isBankHostedTestPage(data.successUrl) ? data.successUrl : returnUrl;
    const failUrl = data.failUrl && !isBankHostedTestPage(data.failUrl) ? data.failUrl : returnUrl;

    const merchantOrderNo = merchantTxnId;
    const merchantCustomerId = data.merchantCustomerId || process.env.SBI_MERCHANT_CUSTOMER_ID || "2";
    const paymode = data.paymode || process.env.SBI_PAYMODE || "NB";
    const accessMedium = data.accessMedium || process.env.SBI_ACCESS_MEDIUM || "ONLINE";
    const transactionSource = data.transactionSource || process.env.SBI_TRANSACTION_SOURCE || "ONLINE";

    // Build the pipe-separated singleRequest string as per Bank Shared Code
    const singleRequest = `${merchantId}|${operatingMode}|${merchantCountry}|${merchantCurrency}|${TotalDueAmount}|${Otherdetail}|${successUrl}|${failUrl}|${aggregatorId}|${merchantOrderNo}|${merchantCustomerId}|${paymode}|${accessMedium}|${transactionSource}`;
    console.log("========== UNENCRYPTED PAYLOADS ==========");
    console.log("SINGLE REQUEST:", singleRequest);

    // Handle the Multi-Account Splits (support both camelCase and snake_case naming)
    const multiAccountsStr = (
      data.multiAccountInstructionDtls ||
      data.multiAccountInstructionDetails ||
      process.env.SBI_MULTI_ACCOUNT_INSTRUCTION_DTLS ||
      "{AMOUNT}|INR|GRPT"
    ).replace(/{AMOUNT}/g, data.amount);
    console.log("MULTI ACCOUNT DETAILS:", multiAccountsStr);
    console.log("==========================================");

    console.log("ENCRYPTING HOSTED FORM PAYLOAD USING Encryptor.js (AES-256-CBC)");

    // Encrypt using Encryptor.js as requested
    const encryptionKey = data.encryptionKey || data.keyArray || process.env.SBI_ENCRYPTION_KEY_BASE64;
    const encryptTrans = aes.encrypt(singleRequest, encryptionKey);
    const encryptMAId = aes.encrypt(multiAccountsStr, encryptionKey);

    console.log("========== TRANSACTION ENCRYPTION LOGGING ==========");
    console.log("UNENCRYPTED SINGLE REQUEST:", singleRequest);
    console.log("ENCRYPTED SINGLE REQUEST (EncryptTrans):", encryptTrans);
    console.log("DECRYPTED VERIFICATION:", aes.decrypt(encryptTrans, encryptionKey));
    console.log("--------------------------------------------------");
    console.log("UNENCRYPTED MULTI ACCOUNT:", multiAccountsStr);
    console.log("ENCRYPTED MULTI ACCOUNT (MultiAccountInstructionDtls):", encryptMAId);
    console.log("DECRYPTED VERIFICATION:", aes.decrypt(encryptMAId, encryptionKey));
    console.log("====================================================");

    let actionUrl = "https://test.epay.sbiuat.bank.in/secure/AggregatorHostedListener";
    if (process.env.SBI_ENVIRONMENT === "LIVE") {
      actionUrl = "https://sbiepay.sbi.co.in/secure/AggregatorHostedListener";
    }

    await appendVerificationLog("TRANSACTION REQUEST", [
      ["Merchant Order Number", merchantOrderNo],
      ["Merchant ID", merchantId],
      ["Aggregator ID", aggregatorId],
      ["Amount", TotalDueAmount],
      ["Action URL", actionUrl],
      ["Plain Transaction Request", singleRequest],
      ["EncryptTrans", encryptTrans],
      ["Plain Multi Account Instruction", multiAccountsStr],
      ["MultiAccountInstructionDtls", encryptMAId],
      ["Form Field merchIdVal", merchantId],
      ["Success URL", successUrl],
      ["Failure URL", failUrl]
    ]);

    return {
      action: actionUrl,
      method: "POST",
      merchantTxnId,
      fields: {
        EncryptTrans: encryptTrans,
        MultiAccountInstructionDtls: encryptMAId,
        MultiAccountInstructionDetails: encryptMAId,
        multiAccountInstructionDetails: encryptMAId,
        merchIdVal: merchantId,
        // Individual fields for the form
        merchId: merchantId,
        operatingMode: operatingMode,
        merchantCountry: merchantCountry,
        merchantCurrency: merchantCurrency,
        amount: TotalDueAmount,
        otherDetail: Otherdetail,
        successUrl: successUrl,
        failUrl: failUrl,
        aggregatorId: aggregatorId,
        merchantOrderNo: merchantOrderNo,
        merchantCustomerId: merchantCustomerId,
        paymode: paymode,
        accessMedium: accessMedium,
        transactionSource: transactionSource
      }
    };

  } catch (error) {
    console.error("SBI ePay Crypto/Hosted Form Error:", error.message);
    throw error;
  }
};

exports.callback = async (body) => {
  let callbackBody = body || {};

  const encryptedFinalResponse =
    callbackBody.encryptedPaymentFinalResponse ||
    callbackBody.EncryptedData ||
    callbackBody.encryptedData ||
    callbackBody.encData ||
    callbackBody.EncData ||
    callbackBody.encryptedResponse;
  const plainFinalResponse =
    callbackBody.Response ||
    callbackBody.response ||
    callbackBody.paymentResponse ||
    callbackBody.PaymentResponse;

  if (!callbackBody.merchantTxnId && (encryptedFinalResponse || plainFinalResponse)) {
    const decodedPayload = encryptedFinalResponse
      ? await exports.decodeReturnPayload(encryptedFinalResponse)
      : await exports.parseReturnPayload(plainFinalResponse);

    if (decodedPayload && decodedPayload.orderInfo) {
      const parsed = decodedPayload.parsed || {};
      callbackBody = normalizeGatewayPayload({
        merchantTxnId: decodedPayload.orderInfo.orderRefNumber,
        amount: decodedPayload.orderInfo.orderAmount,
        status: decodedPayload.orderInfo.orderStatus,
        bankTxnId: decodedPayload.paymentInfo ? decodedPayload.paymentInfo.paymentRefNumber : undefined,
        merchantId: parsed.merchantId,
        atrn: parsed.atrn,
        sbiePayRefId: parsed.sbiePayRefId,
        currency: parsed.currency,
        payMode: parsed.payMode,
        customerName: parsed.customerName,
        statusDescription: parsed.statusDescription,
        bankCode: parsed.bankCode,
        bankReferenceNumber: parsed.bankReferenceNumber,
        transactionDate: parsed.transactionDate,
        country: parsed.country,
        responseCode: parsed.responseCode,
        totalFeeGst: parsed.totalFeeGst,
        rawResponse: decodedPayload.rawDecrypted
      });
    }
  }

  const normalizedBody = normalizeGatewayPayload(callbackBody);
  const txn = await Payment.findOne({
    where: { merchantTxnId: normalizedBody.merchantTxnId },
  });

  if (!txn) {
    await appendVerificationLog("CALLBACK RESPONSE - TRANSACTION NOT FOUND", [
      ["Raw Callback Body", callbackBody]
    ]);
    return;
  }

  normalizedBody.paymentId = txn.transaction_id;
  normalizedBody.transactionNumber = normalizedBody.merchantTxnId;

  txn.status = mapBankStatus(normalizedBody.status);
  txn.bankTxnId = normalizedBody.bankTxnId || normalizedBody.bankReferenceNumber || normalizedBody.sbiePayRefId || normalizedBody.atrn;
  txn.payment_mode = normalizedBody.paymentMode || normalizedBody.payMode || txn.payment_mode;
  txn.gateway_response = JSON.stringify(normalizedBody);

  await txn.save();

  await appendVerificationLog("CALLBACK RESPONSE", [
    ["Merchant Order Number", normalizedBody.merchantTxnId],
    ["Raw Callback Body", callbackBody],
    ["Incoming Bank Status", normalizedBody.status],
    ["Mapped Local Status", txn.status],
    ["Bank Transaction ID", txn.bankTxnId],
    ["Service Charges Paid", normalizedBody.serviceChargePaid],
    ["GST Paid", normalizedBody.gstPaid],
    ["Gateway Response Stored", txn.gateway_response]
  ]);
};

exports.getHistory = async (student_roll) => {
  return await Payment.findAll({
    where: { student_roll },
    order: [['createdAt', 'DESC']]
  });
};

exports.getStatus = async (merchantTxnId) => {
  const paymentInstance = await Payment.findOne({ where: { merchantTxnId } });
  if (!paymentInstance) return null;

  const txn = paymentInstance.toJSON();

  // Fetch category-specific details so the receipt has everything
  const exam = await db.ExamFeeDetail.findOne({ where: { paymentId: txn.transaction_id }, raw: true }) || {};
  const phd = await db.PhdFeeDetail.findOne({ where: { paymentId: txn.transaction_id }, raw: true }) || {};
  const cert = await db.CertificateFeeDetail.findOne({ where: { paymentId: txn.transaction_id }, raw: true }) || {};
  const admission = await db.AdmissionFeeDetail.findOne({ where: { paymentId: txn.transaction_id }, raw: true }) || {};
  const affiliation = await db.AffiliationFeeDetail.findOne({ where: { paymentId: txn.transaction_id }, raw: true }) || {};

  // Delete duplicate IDs to cleanly merge
  delete exam.id; delete exam.paymentId;
  delete phd.id; delete phd.paymentId;
  delete cert.id; delete cert.paymentId;
  delete admission.id; delete admission.paymentId;
  delete affiliation.id; delete affiliation.paymentId;

  let gatewayResponse = {};
  try {
    gatewayResponse = txn.gateway_response ? JSON.parse(txn.gateway_response) : {};
  } catch {
    gatewayResponse = {};
  }

  const normalizedGateway = normalizeGatewayPayload({
    ...gatewayResponse,
    merchantTxnId: txn.merchantTxnId,
    amount: gatewayResponse.amount || txn.amount,
    status: gatewayResponse.status || txn.status,
    bankTxnId: gatewayResponse.bankTxnId || txn.bankTxnId,
    paymentId: txn.transaction_id,
    transactionNumber: txn.merchantTxnId
  });

  return {
    ...txn,
    ...exam,
    ...phd,
    ...cert,
    ...admission,
    ...affiliation,
    ...normalizedGateway,
    gateway_response_details: normalizedGateway
  };
};

exports.verifyTransactionWithBank = async (merchantTxnId) => {
  const sbiePayClient = new SBIEPayClient({
    apiKey: process.env.SBI_MERCHANT_ID,
    apiSecret: process.env.SBI_MERCHANT_KEY,
    encryptionKey: process.env.SBI_ENCRYPTION_KEY_BASE64
  }, 'SANDBOX', true);

  try {
    const existingTxn = await Payment.findOne({ where: { merchantTxnId } });
    const merchantId = process.env.SBI_MERCHANT_ID;
    const aggregatorId = process.env.SBI_AGGREGATOR_ID || "SBIEPAY";
    const amount = existingTxn ? String(existingTxn.amount) : "N/A";
    const queryRequest = `|${merchantId}|${merchantTxnId}|${amount}`;

    const payload = {
      orderRefNumber: merchantTxnId
    };

    await appendVerificationLog("DOUBLE VERIFICATION REQUEST", [
      ["Merchant Order Number", merchantTxnId],
      ["queryRequest", queryRequest],
      ["aggregatorId", aggregatorId],
      ["merchantId", merchantId],
      ["SDK Payload", payload]
    ]);

    // Order inquiry API
    const apiResponse = await sbiePayClient.order.transactionOrders(payload);

    console.log("========== SBI INQUIRY RESPONSE LOGGING ==========");
    console.log("MERCHANT TXN ID:", merchantTxnId);
    console.log("RAW API RESPONSE:", JSON.stringify(apiResponse, null, 2));
    console.log("==================================================");

    // Check if valid bank response
    if (apiResponse && apiResponse.status === 1 && apiResponse.data && apiResponse.data.length > 0) {
      const bankData = apiResponse.data[0];

      // Update local BD if status changed from bank
      const txn = existingTxn || await Payment.findOne({ where: { merchantTxnId } });
      if (txn && bankData.orderStatus) {
        // Safe mapping of SBI status to DB status
        const mappedStatus = mapBankStatus(bankData.orderStatus);

        if (txn.status !== mappedStatus) {
          txn.status = mappedStatus;
          if (bankData.paymentInfo && bankData.paymentInfo.paymentRefNumber) {
            txn.bankTxnId = bankData.paymentInfo.paymentRefNumber;
          }
          await txn.save();
        }
      }

      await appendVerificationLog("DOUBLE VERIFICATION RESPONSE", [
        ["Merchant Order Number", merchantTxnId],
        ["Raw Bank API Response", apiResponse],
        ["Bank Status", bankData.orderStatus],
        ["Bank Transaction ID", bankData.paymentInfo ? bankData.paymentInfo.paymentRefNumber : null],
        ["Local DB Status", txn ? txn.status : null],
        ["Verification Conclusion", txn && bankData.orderStatus ? "BANK RESPONSE RECEIVED" : "BANK RESPONSE RECEIVED - LOCAL TRANSACTION NOT FOUND"]
      ]);

      return {
        merchantTxnId,
        isVerified: true,
        bankStatus: bankData.orderStatus,
        bankTxnId: bankData.paymentInfo ? bankData.paymentInfo.paymentRefNumber : null,
        localDbStatus: txn ? txn.status : null,
        fullBankResponse: bankData
      };
    } else {
      await appendVerificationLog("DOUBLE VERIFICATION RESPONSE - EMPTY OR INVALID", [
        ["Merchant Order Number", merchantTxnId],
        ["Raw Bank API Response", apiResponse],
        ["Verification Conclusion", "INVALID OR EMPTY RESPONSE FROM BANK"]
      ]);

      return {
        merchantTxnId,
        isVerified: false,
        error: "Invalid or empty response from bank.",
        details: apiResponse.errors
      };
    }
  } catch (error) {
    console.warn("verifyTransactionWithBank error:", error.message);
    await appendVerificationLog("DOUBLE VERIFICATION ERROR", [
      ["Merchant Order Number", merchantTxnId],
      ["Error", error.message],
      ["Verification Conclusion", "SDK CALL FAILED OR TRANSACTION NOT FOUND IN BANK"]
    ]);

    return {
      merchantTxnId,
      isVerified: false,
      error: "SDK call failed or transaction not found in bank."
    };
  }
};

exports.decodeReturnPayload = async (encryptedPayload) => {
  try {
    const encryptionKey = process.env.SBI_ENCRYPTION_KEY_BASE64;

    // Decrypt using Encryptor.js
    const decrypted = aes.decrypt(encryptedPayload, encryptionKey);

    console.log("========== SBI RESPONSE DECRYPTION LOGGING ==========");
    console.log("ENCRYPTED TRANSACTION FROM SBI:", encryptedPayload);
    console.log("DECRYPTED TRANSACTION FROM SBI:", decrypted);
    console.log("====================================================");

    return await buildReturnPayload(decrypted, encryptedPayload);
  } catch (error) {
    console.error("Failed to decode return payload using Encryptor.js:", error);
    return null;
  }
};

exports.parseReturnPayload = async (plainPayload) => {
  try {
    return await buildReturnPayload(plainPayload, null);
  } catch (error) {
    console.error("Failed to parse plain SBI return payload:", error);
    return null;
  }
};

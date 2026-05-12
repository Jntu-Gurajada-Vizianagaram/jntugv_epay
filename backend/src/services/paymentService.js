const db = require("../models");
const Payment = db.Payment;
const { SBIEPayClient } = require("epay_nodejs_sdk");

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

  // FIXED URL
  const cleanUrl = (url) => (url ? url.replace(/\/$/, "") : "");

  // SBI_PUSH_URL is the official term for the server-to-server callback
  const callbackUrl = cleanUrl(process.env.SBI_PUSH_URL) || cleanUrl(process.env.CALLBACK_URL) || `${process.env.API_URL}/api/payment/callback`;
  const returnUrl = cleanUrl(process.env.RETURN_URL) || `${process.env.API_URL}/api/payment/return`;

  try {
    // Using LIVE TESTKIT credentials and Hosted Form code as requested for Multi Account Settlement
    const sbiePayClient = new SBIEPayClient({
      apiKey: process.env.SBI_MERCHANT_ID,
      apiSecret: process.env.SBI_MERCHANT_KEY,
      encryptionKey: process.env.SBI_ENCRYPTION_KEY_BASE64
    }, 'SANDBOX', true);

    const merchantId = process.env.SBI_MERCHANT_ID;
    const aggregatorId = process.env.SBI_AGGREGATOR_ID || "SBIEPAY";

    const operatingMode = process.env.SBI_OPERATING_MODE || "DOM";
    const merchantCountry = process.env.SBI_MERCHANT_COUNTRY || "IN";
    const merchantCurrency = process.env.SBI_MERCHANT_CURRENCY || "INR";
    const TotalDueAmount = String(data.amount);
    const Otherdetail = data.student_name || "NA";

    // Front-end URLs for redirection
    const appBaseUrl = process.env.APP_BASE_URL || "http://localhost:5173";
    const successUrl = `${appBaseUrl}/payment/success`;
    const failUrl = `${appBaseUrl}/payment/failure`;

    const merchantOrderNo = merchantTxnId;
    const merchantCustomerId = process.env.SBI_MERCHANT_CUSTOMER_ID || "2";
    const paymode = process.env.SBI_PAYMODE || "NB";
    const accessMedium = process.env.SBI_ACCESS_MEDIUM || "ONLINE";
    const transactionSource = process.env.SBI_TRANSACTION_SOURCE || "ONLINE";

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

    console.log("ENCRYPTING HOSTED FORM PAYLOAD USING AES-256-ECB");

    // Encrypt using custom SBI crypto logic (AES-256-ECB)
    const sbiCrypto = require("../utils/sbiCrypto");
    const encryptionKey = process.env.SBI_ENCRYPTION_KEY_BASE64;
    const encryptTrans = sbiCrypto.encrypt(singleRequest, encryptionKey);
    const encryptMAId = sbiCrypto.encrypt(multiAccountsStr, encryptionKey);

    console.log("ENCRYPTED SINGLE REQUEST (EncryptTrans):", encryptTrans);
    console.log("ENCRYPTED MULTI ACCOUNT DETAILS (MultiAccountInstructionDtls):", encryptMAId);


    let actionUrl = "https://test.epay.sbiuat.bank.in/secure/AggregatorHostedListener";
    if (process.env.SBI_ENVIRONMENT === "LIVE") {
      actionUrl = "https://sbiepay.sbi.co.in/secure/AggregatorHostedListener";
    }

    return {
      action: actionUrl,
      method: "POST",
      merchantTxnId,
      fields: {
        EncryptTrans: encryptTrans,
        MultiAccountInstructionDtls: encryptMAId,
        merchIdVal: merchantId
      }
    };

  } catch (error) {
    console.error("SBI ePay Crypto/Hosted Form Error:", error.message);
    throw error;
  }
};

exports.callback = async (body) => {
  const txn = await Payment.findOne({
    where: { merchantTxnId: body.merchantTxnId },
  });

  if (!txn) return;

  const bankStatusMap = {
    'PAID': 'SUCCESS',
    'SUCCESS': 'SUCCESS',
    'FAIL': 'FAILED',
    'FAILED': 'FAILED',
    'PENDING': 'PENDING',
    'ABORTED': 'FAILED',
    'REFUNDED': 'REFUNDED'
  };

  const statusStr = (body.status || "").toUpperCase();
  txn.status = bankStatusMap[statusStr] || 'PENDING';
  txn.bankTxnId = body.bankTxnId;

  await txn.save();
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

  return { ...txn, ...exam, ...phd, ...cert, ...admission, ...affiliation };
};

exports.verifyTransactionWithBank = async (merchantTxnId) => {
  const sbiePayClient = new SBIEPayClient({
    apiKey: process.env.SBI_MERCHANT_ID,
    apiSecret: process.env.SBI_MERCHANT_KEY,
    encryptionKey: process.env.SBI_ENCRYPTION_KEY_BASE64
  }, 'SANDBOX', true);

  try {
    const payload = {
      orderRefNumber: merchantTxnId
    };

    // Order inquiry API
    const apiResponse = await sbiePayClient.order.transactionOrders(payload);

    // Check if valid bank response
    if (apiResponse && apiResponse.status === 1 && apiResponse.data && apiResponse.data.length > 0) {
      const bankData = apiResponse.data[0];

      // Update local BD if status changed from bank
      const txn = await Payment.findOne({ where: { merchantTxnId } });
      if (txn && bankData.orderStatus) {
        // Safe mapping of SBI status to DB status
        const bankStatusMap = {
          'PAID': 'SUCCESS',
          'SUCCESS': 'SUCCESS',
          'FAIL': 'FAILED',
          'FAILED': 'FAILED',
          'PENDING': 'PENDING',
          'ABORTED': 'FAILED',
          'REFUNDED': 'REFUNDED'
        };
        const mappedStatus = bankStatusMap[bankData.orderStatus.toUpperCase()] || txn.status;

        if (txn.status !== mappedStatus) {
          txn.status = mappedStatus;
          if (bankData.paymentInfo && bankData.paymentInfo.paymentRefNumber) {
            txn.bankTxnId = bankData.paymentInfo.paymentRefNumber;
          }
          await txn.save();
        }
      }

      return {
        merchantTxnId,
        isVerified: true,
        bankStatus: bankData.orderStatus,
        bankTxnId: bankData.paymentInfo ? bankData.paymentInfo.paymentRefNumber : null,
        localDbStatus: txn ? txn.status : null,
        fullBankResponse: bankData
      };
    } else {
      return {
        merchantTxnId,
        isVerified: false,
        error: "Invalid or empty response from bank.",
        details: apiResponse.errors
      };
    }
  } catch (error) {
    console.warn("verifyTransactionWithBank error:", error.message);
    return {
      merchantTxnId,
      isVerified: false,
      error: "SDK call failed or transaction not found in bank."
    };
  }
};

exports.decodeReturnPayload = async (encryptedPayload) => {
  try {
    const sbiePayClient = new SBIEPayClient({
      apiKey: process.env.SBI_MERCHANT_ID,
      apiSecret: process.env.SBI_MERCHANT_KEY,
      encryptionKey: process.env.SBI_ENCRYPTION_KEY_BASE64
    }, 'SANDBOX', true);

    const decoded = await sbiePayClient.crypto.decodeCallback(encryptedPayload);
    // decodeCallback returns an array, the first element has orderInfo and paymentInfo
    if (decoded && decoded.length > 0) {
      return decoded[0];
    }
    return null;
  } catch (error) {
    console.error("Failed to decode return payload:", error);
    return null;
  }
};

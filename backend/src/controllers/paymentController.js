// const { Transaction } = require('../models');
// const { encryptPayload, decryptPayload } = require('../utils/crypto');
// const { v4: uuidv4 } = require('uuid');
// const axios = require('axios');

// const SBI_PAYMENT_URL = process.env.SBI_PAYMENT_URL; // For testing points to /mock-bank/payment
// const MERCHANT_ID = process.env.SBI_MERCHANT_ID || 'TEST_MERCHANT';
// const APP_BASE = process.env.APP_BASE_URL || 'http://localhost:5173';

// async function createPayment(body) {
//   // create merchant txn id
//   const merchantTxnId = `JNTU-${Date.now()}-${Math.floor(Math.random()*9999)}`;

//   const tx = await Transaction.create({
//     merchant_txn_id: merchantTxnId,
//     student_roll: body.student_roll,
//     student_name: body.student_name || '',
//     amount: body.amount,
//     currency: 'INR',
//     status: 'INITIATED',
//     raw_request: JSON.stringify(body)
//   });

//   const payload = {
//     merchantId: MERCHANT_ID,
//     merchantTxnId,
//     amount: String(body.amount),
//     currency: 'INR',
//     returnUrl: `${APP_BASE}/payment/return`,
//     callbackUrl: `${APP_BASE.replace(/^http:/,'http:').replace(/^https:/,'http:')}/api/pay/callback`, // will be consumed by bank (for mock, same server)
//     customerDetail: {
//       name: body.student_name || '',
//       roll: body.student_roll,
//       email: body.email || '',
//       mobile: body.mobile || ''
//     },
//     txnDate: new Date().toISOString()
//   };

//   // For test: we will POST the payload directly to SBI_PAYMENT_URL (mock) as form data
//   // If encryption required, use encryptPayload() — bank docs decide.
//   let encRequest = null;
//   try {
//     encRequest = encryptPayload(payload);
//   } catch (e) {
//     // If keys not configured, fallback to JSON string so mock can still work
//     encRequest = JSON.stringify(payload);
//   }

//   tx.raw_request = encRequest;
//   await tx.save();

//   // Return the action and fields to auto-post from frontend
//   return {
//     action: SBI_PAYMENT_URL,
//     fields: {
//       merchantId: MERCHANT_ID,
//       encRequest,
//       amount: String(body.amount),
//       returnUrl: payload.returnUrl,
//       callbackUrl: payload.callbackUrl
//     }
//   };
// }

// async function clientReturn(req, res) {
//   // Browser return: show a friendly page or JSON
//   // Browser return is not authoritative; server callback is authoritative
//   return res.json({ message: 'Browser returned. Please wait for confirmation from bank (server callback).' , body: req.body || req.query });
// }

// async function serverCallback(req, res) {
//   // Bank server -> server callback (JSON). For test the mock bank sends plain JSON.
//   try {
//     const payload = req.body;
//     // payload may be encrypted string in production; handle decryption if needed
//     // Example: if payload.encResponse exists -> decrypt
//     let parsed = payload;
//     if (payload.encResponse) {
//       try {
//         const dec = decryptPayload(payload.encResponse);
//         parsed = JSON.parse(dec);
//       } catch (err) {
//         console.warn('decrypt failed', err.message);
//       }
//     }

//     const merchantTxnId = parsed.merchantTxnId || parsed.orderId || parsed.merchant_txn_id;
//     const bankTxnId = parsed.bankTxnId || parsed.txnId || parsed.transactionId;
//     const status = (parsed.status || parsed.txnStatus || '').toUpperCase();

//     const tx = await Transaction.findOne({ where: { merchant_txn_id: merchantTxnId }});
//     if (!tx) {
//       console.warn('Transaction not found for merchantTxnId', merchantTxnId);
//       // respond 200 so bank doesn't retry too often
//       return res.status(200).send('OK');
//     }

//     if (tx.status === 'SUCCESS') {
//       return res.status(200).send('OK');
//     }

//     if (status.includes('SUCCESS') || String(parsed.responseCode) === '0') {
//       tx.status = 'SUCCESS';
//       tx.bank_txn_id = bankTxnId || parsed.bankTxnId || parsed.transactionId;
//       tx.raw_response = JSON.stringify(parsed);
//       tx.settled_at = new Date();
//     } else {
//       tx.status = 'FAILED';
//       tx.bank_txn_id = bankTxnId;
//       tx.raw_response = JSON.stringify(parsed);
//     }
//     await tx.save();

//     return res.status(200).send('OK');
//   } catch (err) {
//     console.error('callback processing error', err);
//     return res.status(500).send('ERROR');
//   }
// }

// module.exports = { createPayment, clientReturn, serverCallback };


const paymentService = require("../services/paymentService");

const { PaymentInitiateSchema } = require("../validators/paymentValidator");

exports.initiatePayment = async (req, res) => {
  try {
    const validatedData = PaymentInitiateSchema.parse(req.body);
    console.log("INITIATE PAYLOAD:", validatedData);
    const data = await paymentService.initiate(validatedData);
    res.json(data);
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: "Validation Error", details: err.errors });
    }
    console.error("Initiate Payment Error", err);
    res.status(500).json({ error: "Failed to initiate payment" });
  }
};

exports.initiatePaymentView = async (req, res) => {
  try {
    console.log("INITIATE (GET) PAYLOAD:", req.query);
    // Treat GET params as the payload
    const validatedData = PaymentInitiateSchema.parse(req.query);
    const data = await paymentService.initiate(validatedData);
    res.json(data);
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: "Validation Error", details: err.errors });
    }
    console.error("Initiate Payment (GET) Error", err);
    res.status(500).json({ error: "Failed to initiate payment" });
  }
};

exports.callbackHandler = async (req, res) => {
  try {
    await paymentService.callback(req.body);
    res.json({ status: "OK" });
  } catch (err) {
    console.error("Callback Error", err);
    res.status(500).json({ error: "Callback failed" });
  }
};

exports.getPaymentStatus = async (req, res) => {
  try {
    const merchantTxnId = req.params.merchantTxnId;
    const status = await paymentService.getStatus(merchantTxnId);
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: "Unable to fetch status" });
  }
};

exports.getPaymentHistory = async (req, res) => {
  try {
    const roll = req.params.studentRoll;
    const history = await paymentService.getHistory(roll);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: "Unable to fetch history" });
  }
};

exports.verifyWithBank = async (req, res) => {
  try {
    const merchantTxnId = req.params.merchantTxnId;
    const result = await paymentService.verifyTransactionWithBank(merchantTxnId);
    res.json(result);
  } catch (err) {
    console.error("verifyWithBank Error", err);
    res.status(500).json({ error: "Failed to verify transaction with bank" });
  }
};

const { decryptData, encryptData } = require("../utils/secureUrl");

exports.decryptPaymentData = async (req, res) => {
  try {
    const { data } = req.body;
    if (!data) return res.status(400).json({ error: "Missing data" });
    const decrypted = decryptData(data);
    res.json(decrypted);
  } catch (err) {
    console.error("Decryption Error", err);
    res.status(400).json({ error: "Invalid data" });
  }
};

function cleanUrl(url) {
  return url ? String(url).replace(/\/$/, "") : "";
}

function isLocalUrl(url) {
  return /\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(?:\/|$)/i.test(String(url || ""));
}

function getFrontendBaseUrl(req) {
  const configuredAppBase = cleanUrl(process.env.APP_BASE_URL);
  if (configuredAppBase && !(process.env.NODE_ENV === "production" && isLocalUrl(configuredAppBase))) {
    return configuredAppBase;
  }

  const configuredApiBase = cleanUrl(process.env.API_URL);
  if (configuredApiBase && !(process.env.NODE_ENV === "production" && isLocalUrl(configuredApiBase))) {
    try {
      const apiUrl = new URL(configuredApiBase);
      return `${apiUrl.protocol}//${apiUrl.host}`;
    } catch {
      return configuredApiBase.replace(/\/api$/i, "");
    }
  }

  const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
  return `${protocol}://${req.get("host")}`;
}

exports.clientReturnHandler = async (req, res) => {
  const frontendBase = getFrontendBaseUrl(req);
  try {
    const returnPayload = { ...(req.query || {}), ...(req.body || {}) };
    const encryptedFinalResponse =
      returnPayload.encryptedPaymentFinalResponse ||
      returnPayload.EncryptedData ||
      returnPayload.encryptedData ||
      returnPayload.encData ||
      returnPayload.EncData ||
      returnPayload.encryptedResponse;
    const plainFinalResponse =
      returnPayload.Response ||
      returnPayload.response ||
      returnPayload.paymentResponse ||
      returnPayload.PaymentResponse;

    if (encryptedFinalResponse || plainFinalResponse) {
      const decodedPayload = encryptedFinalResponse
        ? await paymentService.decodeReturnPayload(encryptedFinalResponse)
        : await paymentService.parseReturnPayload(plainFinalResponse);
      if (decodedPayload && decodedPayload.orderInfo) {
        const { orderStatus, orderRefNumber, orderAmount } = decodedPayload.orderInfo;
        const paymentInfoAmount = decodedPayload.paymentInfo ? decodedPayload.paymentInfo.orderAmount : "N/A";
        const parsed = decodedPayload.parsed || {};

        const payloadData = {
          merchantTxnId: orderRefNumber,
          amount: orderAmount || paymentInfoAmount || "N/A",
          status: (orderStatus || "").toUpperCase(),
          bankTxnId: decodedPayload.paymentInfo ? decodedPayload.paymentInfo.paymentRefNumber : "N/A",
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
        };

        const encrypted = encryptData(payloadData);

        // Force local DB update just in case callback is delayed
        await paymentService.callback(payloadData);

        await paymentService.verifyTransactionWithBank(payloadData.merchantTxnId);

        if (payloadData.status === "SUCCESS" || payloadData.status === "PAID") {
          return res.redirect(`${frontendBase}/payment/success?data=${encrypted}`);
        } else {
          return res.redirect(`${frontendBase}/payment/failure?data=${encrypted}`);
        }
      }
    }

    const encrypted = encryptData(returnPayload);
    const statusStr = (returnPayload.status || "").toUpperCase();
    const isFailed = statusStr === "FAIL" || statusStr === "FAILED";

    // Force local DB update for mock bank flow
    if (returnPayload.merchantTxnId) {
      await paymentService.callback({
        merchantTxnId: returnPayload.merchantTxnId,
        status: isFailed ? "FAILED" : "SUCCESS",
        bankTxnId: returnPayload.bankTxnId || Math.floor(Math.random() * 10000000).toString()
      });
      await paymentService.verifyTransactionWithBank(returnPayload.merchantTxnId);
    }

    if (isFailed) {
      res.redirect(`${frontendBase}/payment/failure?data=${encrypted}`);
    } else {
      res.redirect(`${frontendBase}/payment/success?data=${encrypted}`);
    }
  } catch (err) {
    console.error("Client Return Error", err);
    res.redirect(`${frontendBase}/payment/failure?data=${encodeURIComponent(encryptData(req.query))}`);
  }
};

const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

const { encryptData } = require("../utils/secureUrl");

router.post("/initiate", paymentController.initiatePayment);
router.get("/initiate", paymentController.initiatePaymentView);
router.post("/callback", paymentController.callbackHandler);
router.post("/sbipush-response", paymentController.callbackHandler);
router.get("/status/:merchantTxnId", paymentController.getPaymentStatus);
router.get("/history/:studentRoll", paymentController.getPaymentHistory);
router.post("/decrypt", paymentController.decryptPaymentData);

router.get("/return", paymentController.clientReturnHandler);
router.post("/return", paymentController.clientReturnHandler);

router.get("/payment-response/:merchantTxnId", paymentController.getPaymentStatus);

// Double Verification with SBI
router.get("/verify-bank/:merchantTxnId", paymentController.verifyWithBank);

module.exports = router;

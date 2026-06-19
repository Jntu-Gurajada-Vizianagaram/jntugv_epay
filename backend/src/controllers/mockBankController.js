const axios = require("axios");
const https = require("https");
const AES256 = require("../utils/encryptor");

const aes = new AES256();

const htmlEscape = (value) => String(value || "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

exports.processMockPayment = async (req, res) => {
  try {
    let merchantId = req.body.merchantId;
    let merchantTxnId = req.body.merchantTxnId;
    let amount = req.body.amount;
    let customerName = req.body.customerName;
    let customerEmail = req.body.customerEmail;
    let customerMobile = req.body.customerMobile;
    let multiAccountInstructionDtls = req.body.multiAccountInstructionDtls;
    let returnUrl = req.body.returnUrl;
    let callbackUrl = req.body.callbackUrl;
    const simulatedStatus = String(req.body.mockStatus || req.query.mockStatus || process.env.MOCK_BANK_STATUS || "SUCCESS").toUpperCase() === "FAILED"
      ? "FAILED"
      : "SUCCESS";

    if (req.body.EncryptTrans) {
      const encryptionKey = process.env.SBI_ENCRYPTION_KEY_BASE64;
      try {
        const decrypted = aes.decrypt(req.body.EncryptTrans, encryptionKey);
        console.log("[MockBank] Decrypted EncryptTrans payload:", decrypted);
        const parts = decrypted.split("|");
        merchantId = parts[0];
        amount = parts[4];
        customerName = parts[5];
        returnUrl = parts[6];
        merchantTxnId = parts[9];
        callbackUrl = `${process.env.API_URL || "https://localhost:4000"}/api/payment/callback`;
      } catch (err) {
        console.error("[MockBank] Failed to decrypt EncryptTrans payload:", err.message);
      }
    }

    if (req.body.MultiAccountInstructionDtls) {
      const encryptionKey = process.env.SBI_ENCRYPTION_KEY_BASE64;
      try {
        multiAccountInstructionDtls = aes.decrypt(req.body.MultiAccountInstructionDtls, encryptionKey);
        console.log("[MockBank] Decrypted MultiAccountInstructionDtls payload:", multiAccountInstructionDtls);
      } catch (err) {
        console.error("[MockBank] Failed to decrypt MultiAccountInstructionDtls payload:", err.message);
      }
    }

    const effectiveTxnId = merchantTxnId || `MOCK-${Date.now()}`;

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Mock Bank Payment</title>
        <style>
          body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f0f2f5; }
          .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); width: 100%; max-width: 420px; }
          h2 { color: #333; margin-top: 0; }
          .row { margin-bottom: 1rem; }
          label { display: block; font-size: 0.85rem; color: #666; margin-bottom: 4px; }
          .value { font-weight: 500; font-size: 1.05rem; }
          .note { padding: 12px; border-radius: 4px; background: #eef6ff; color: #174ea6; font-size: 0.9rem; }
          button { width: 100%; padding: 12px; margin-top: 10px; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; background: #007bff; color: white; }
        </style>
        <script>
          window.addEventListener("DOMContentLoaded", function () {
            setTimeout(function () {
              document.getElementById("mockBankForm").submit();
            }, 800);
          });
        </script>
      </head>
      <body>
        <div class="card">
          <h2>Mock Bank Gateway</h2>
          <div class="row">
            <label>Customer</label>
            <div class="value">${htmlEscape(customerName || "N/A")}</div>
            <div style="font-size: 0.8rem; color: #666">${htmlEscape(customerEmail)} ${customerMobile ? `| ${htmlEscape(customerMobile)}` : ""}</div>
          </div>
          <div class="row">
            <label>Merchant</label>
            <div class="value">${htmlEscape(merchantId)}</div>
          </div>
          <div class="row">
            <label>Transaction ID</label>
            <div class="value" style="font-family: monospace">${htmlEscape(effectiveTxnId)}</div>
          </div>
          <div class="row">
            <label>Amount</label>
            <div class="value">INR ${htmlEscape(amount || "0.00")}</div>
          </div>
          ${multiAccountInstructionDtls ? `
          <div class="row">
            <label>Multi-Account Splits</label>
            <div class="value" style="font-size: 0.9rem; color: #0056b3;">${htmlEscape(multiAccountInstructionDtls)}</div>
          </div>` : ""}
          <div class="note">Processing transaction automatically as ${simulatedStatus}. The customer cannot choose the payment result.</div>
          <form id="mockBankForm" action="/api/mock-bank/confirm" method="POST">
            <input type="hidden" name="merchantId" value="${htmlEscape(merchantId)}" />
            <input type="hidden" name="merchantTxnId" value="${htmlEscape(effectiveTxnId)}" />
            <input type="hidden" name="amount" value="${htmlEscape(amount)}" />
            <input type="hidden" name="callbackUrl" value="${htmlEscape(callbackUrl)}" />
            <input type="hidden" name="returnUrl" value="${htmlEscape(returnUrl)}" />
            <input type="hidden" name="status" value="${simulatedStatus}" />
            <noscript><button type="submit">Continue</button></noscript>
          </form>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    console.error("Mock Bank UI Error:", err);
    res.status(500).send("Mock Bank Error");
  }
};

exports.confirmMockPayment = async (req, res) => {
  try {
    const { merchantTxnId, merchantId, amount, status, callbackUrl, returnUrl } = req.body;
    const normalizedStatus = String(status || "SUCCESS").toUpperCase() === "FAILED" ? "FAILED" : "SUCCESS";
    const bankTxnId = `BANK-${Math.floor(Math.random() * 1000000)}`;

    const payload = {
      merchantTxnId,
      bankTxnId,
      merchantId,
      status: normalizedStatus,
      amount: amount || "0.00",
      responseCode: normalizedStatus === "SUCCESS" ? "0" : "1",
      message: normalizedStatus === "SUCCESS" ? "Transaction Successful" : "Transaction Failed"
    };

    console.log(`[MockBank] Processing ${normalizedStatus} for ${merchantTxnId}`);

    try {
      const agent = new https.Agent({ rejectUnauthorized: false });
      await axios.post(callbackUrl, payload, { httpsAgent: agent });
      console.log("[MockBank] Callback sent successfully");
    } catch (e) {
      console.warn("[MockBank] Callback failed to reach backend:", e.message);
    }

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Transaction Finished</title>
        <style>
          body { font-family: sans-serif; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; background: #f0f2f5; text-align: center; }
          .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          button { background: #007bff; color: white; padding: 12px 24px; border: none; border-radius: 4px; font-size: 1rem; cursor: pointer; margin-top: 1rem; }
        </style>
        <script>
          window.addEventListener("DOMContentLoaded", function () {
            setTimeout(function () {
              document.getElementById("returnForm").submit();
            }, 800);
          });
        </script>
      </head>
      <body>
        <div class="card">
          <h2>${normalizedStatus === "SUCCESS" ? "Payment Approved" : "Transaction Rejected"}</h2>
          <p>Returning to the merchant site automatically...</p>
          <form id="returnForm" action="${htmlEscape(returnUrl)}" method="GET">
            <input type="hidden" name="merchantTxnId" value="${htmlEscape(merchantTxnId)}" />
            <input type="hidden" name="bankTxnId" value="${htmlEscape(bankTxnId)}" />
            <input type="hidden" name="status" value="${normalizedStatus}" />
            <input type="hidden" name="amount" value="${htmlEscape(payload.amount)}" />
            <input type="hidden" name="responseCode" value="${payload.responseCode}" />
            <noscript><button type="submit">Return to Merchant</button></noscript>
          </form>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    console.error("Mock Bank Confirm Error:", err);
    res.status(500).send("Confirmation Error");
  }
};

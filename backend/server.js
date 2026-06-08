require("dotenv").config({ path: __dirname + '/.env' });
const express = require("express");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const { sequelize } = require("./src/models");
const axios = require("axios");

const paymentRoutes = require("./src/routes/payments");
const systemRoutes = require("./src/routes/system");
const mockBankRoutes = require("./src/routes/mockBank");

const app = express();

// Security
app.use(helmet({
  referrerPolicy: { policy: "origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"], // Scripts are self-only (we removed inline)
      formAction: [
        "'self'",
        "http://localhost:5173",
        "https://pay.jntugv.edu.in",
        "https://sbiepay.sbi.co.in",
        "https://test.epay.sbiuat.bank.in",
        "https://test.sbiepay.sbi"
      ], // Allow POST to frontend and SBIePay domains
      connectSrc: ["'self'", "http://localhost:4000", "http://localhost:5173"],
      imgSrc: [
        "'self'",
        "data:",
        "https://www.test.sbiepay.com",
        "https://sbiepay.sbi.co.in",
        "https://test.epay.sbiuat.bank.in",
        "https://test.sbiepay.sbi",
        "https://*.sbi",
        "https://*.sbi.co.in",
        "https://*.sbiepay.sbi",
        "https://*.sbiepay.com",
        "https://*.sbiuat.bank.in"
      ],
      fontSrc: [
        "'self'",
        "https:",
        "data:"
      ]
    }
  }
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("dev"));

// API Routes
// API Routes
app.use("/api/payment", paymentRoutes);
app.use("/api/system", systemRoutes);
app.use("/api/mock-bank", mockBankRoutes);



// Root
app.get("/", (req, res) => {
  res.json({ ok: true, app: "jntugv-payments-backend" });
});

const https = require("https");
const fs = require("fs");
const path = require("path");

/* eslint-disable security/detect-non-literal-fs-filename */
async function getSslCredentials() {
  const certPath = path.resolve(__dirname, "certs");
  const keyFile = path.resolve(certPath, "key.pem");
  const certFile = path.resolve(certPath, "cert.pem");

  if (!fs.existsSync(certPath)) {
    fs.mkdirSync(certPath, { recursive: true });
  }

  if (fs.existsSync(keyFile) && fs.existsSync(certFile)) {
    return {
      key: fs.readFileSync(keyFile),
      cert: fs.readFileSync(certFile)
    };
  }

  console.log("Generating self-signed SSL certificate for backend...");
  const selfsigned = require("selfsigned");
  const attrs = [{ name: "commonName", value: "localhost" }];
  const pems = await selfsigned.generate(attrs, { days: 365 });

  fs.writeFileSync(keyFile, pems.private);
  fs.writeFileSync(certFile, pems.cert);

  return {
    key: pems.private,
    cert: pems.cert
  };
}
/* eslint-enable security/detect-non-literal-fs-filename */

// Start Server
const PORT = process.env.PORT || 4000;

(async () => {
  try {
    await sequelize.authenticate();
    console.log("MySQL connected");

    if (process.env.NODE_ENV !== "production") {
      await sequelize.sync({ alter: true });
      console.log("Database synced");
    }

    const sslOptions = await getSslCredentials();

    https.createServer(sslOptions, app).listen(PORT, () => {
      console.log("Secure Backend running on port", PORT);
    });
  } catch (err) {
    console.error("Startup error", err);
    process.exit(1);
  }
})();


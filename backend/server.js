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
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"], // Scripts are self-only (we removed inline)
      formAction: ["'self'", "http://localhost:5173", "https://pay.jntugv.edu.in"], // Allow POST to frontend
      connectSrc: ["'self'", "http://localhost:4000", "http://localhost:5173"],
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

    app.listen(PORT, () => {
      console.log("Backend running on port", PORT);
    });
  } catch (err) {
    console.error("Startup error", err);
    process.exit(1);
  }
})();


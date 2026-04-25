import express from "express";
import dotenv from "dotenv";
dotenv.config();
import sequelize from "./src/db/db.js";
// import ensureStaticQrPaymentSchema from "./db/ensureStaticQrPaymentSchema.js";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import buyerRoutes from './src/routes/buyerRoutes.js';
import locationRoutes from './src/routes/locationRoutes.js';
import landRoutes from './src/routes/landRoutes.js';
import employeeRoutes from './src/routes/employeeRoutes.js';
import documentRoutes from './src/routes/documentRoutes.js';
import fieldWorkRoutes from './src/routes/fieldWorkRoutes.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
// Capture raw body for Razorpay webhook signature verification
// app.use('/api/payments/razorpay/webhook', express.raw({ type: 'application/json' }), (req, res, next) => {
//     req.rawBody = req.body;
//     req.body = JSON.parse(req.body);
//     next();
// });
app.use(express.json());
app.use("/public", express.static(path.join(__dirname, "./src/public")));

import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./src/config/swagger.js";

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/", (req, res) => {
  res.send("welcome to garuda server");
});

app.use('/api', employeeRoutes);
app.use('/api', landRoutes);
app.use('/api', locationRoutes);
app.use('/api', buyerRoutes);
app.use('/api', documentRoutes);
app.use('/api', fieldWorkRoutes);
// app.use('/api', paymentRoutes)

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.sync({ alter: true });
    // await ensureStaticQrPaymentSchema();
    console.log("All tables synced with database");
  } catch (err) {
    console.error("Sync failed (continuing without DB):", err);
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
  });
};

startServer();

import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(
  process.env.PGDATABASE,
  process.env.PGUSER,
  process.env.PGPASSWORD,
  {
    host: process.env.PGHOST,
    port: process.env.PGPORT || 5432,
    dialect: "postgres",
    logging: false,
  }
);

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected via Sequelize");
  } catch (error) {
    console.error("DB connection failed:", error);
  }
};

testConnection();

export default sequelize;

import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

const Calendar = sequelize.define("Calendar", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    unique: true
  },
  type: {
    type: DataTypes.ENUM('WORKING', 'WEEKEND', 'HOLIDAY'),
    defaultValue: 'WORKING'
  },
  description: {
    type: DataTypes.STRING
  }
}, {
  tableName: "calendar",
  timestamps: false
});

export default Calendar;
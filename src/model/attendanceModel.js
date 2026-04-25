import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

const Attendance = sequelize.define("Attendance", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  employee_id: {
    type: DataTypes.INTEGER
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('PRESENT', 'ABSENT', 'LEAVE'),
    allowNull: false
  },
  marked_by: {
    type: DataTypes.ENUM('EMPLOYEE', 'ADMIN'),
    defaultValue: 'EMPLOYEE'
  },
  note: {
    type: DataTypes.STRING
  }
}, {
  tableName: "attendance",
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['employee_id', 'date']
    }
  ]
});

export default Attendance;
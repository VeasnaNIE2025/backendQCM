const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ExamResult = sequelize.define('ExamResult', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  examId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'examId'  // Specify exact column name
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'studentId'
  },
  totalScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'totalScore'
  },
  percentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    field: 'percentage'
  },
  startedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'startedAt'
  },
  submittedAt: {
    type: DataTypes.DATE,
    field: 'submittedAt'
  },
  status: {
    type: DataTypes.ENUM('in-progress', 'completed'),
    defaultValue: 'in-progress',
    field: 'status'
  }
}, {
  timestamps: true,
  tableName: 'exam_results',
  underscored: false  // Don't use underscored naming
});

module.exports = ExamResult;
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
    allowNull: false
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  totalScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  percentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  startedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  submittedAt: {
    type: DataTypes.DATE
  },
  status: {
    type: DataTypes.ENUM('in-progress', 'completed'),
    defaultValue: 'in-progress'
  },
  numberOfQuestions: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
    comment: 'Number of questions to randomly select from question bank'
  }

}, {
  timestamps: true,
  tableName: 'exam_results'
});

module.exports = ExamResult;
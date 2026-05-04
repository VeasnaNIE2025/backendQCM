const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const StudentAnswer = sequelize.define('StudentAnswer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  resultId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  questionId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  selectedOption: {
    type: DataTypes.ENUM('a', 'b', 'c', 'd'),
    allowNull: true
  },
  isCorrect: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  pointsEarned: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  timestamps: true,
  tableName: 'student_answers'
});

module.exports = StudentAnswer;
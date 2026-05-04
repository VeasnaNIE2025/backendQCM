const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Question = sequelize.define('Question', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  subjectId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  questionText: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  option_a: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  option_b: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  option_c: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  option_d: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  correctAnswer: {
    type: DataTypes.ENUM('a', 'b', 'c', 'd'),
    allowNull: false
  },
  explanation: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  difficulty: {
    type: DataTypes.ENUM('easy', 'medium', 'hard'),
    defaultValue: 'medium'
  },
  points: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  }
}, {
  timestamps: true,
  tableName: 'questions'
});

module.exports = Question;
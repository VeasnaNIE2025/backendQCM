const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ClassSubject = sequelize.define('ClassSubject', {
  classId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true
  },
  subjectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true
  }
}, {
  timestamps: true,
  tableName: 'class_subjects'
});

module.exports = ClassSubject;
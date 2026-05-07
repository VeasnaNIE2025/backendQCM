const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Class = sequelize.define('Class', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  description: { type: DataTypes.TEXT, allowNull: true }
}, { timestamps: true, tableName: 'classes' });

module.exports = Class;
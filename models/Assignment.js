const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Assignment = sequelize.define('Assignment', {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  title: { 
    type: DataTypes.STRING(200), 
    allowNull: false 
  },
  description: { 
    type: DataTypes.TEXT 
  },
  subjectId: { 
    type: DataTypes.INTEGER, 
    allowNull: false 
  },
  dueDate: { 
    type: DataTypes.DATE, 
    allowNull: false 
  },
  totalPoints: { 
    type: DataTypes.INTEGER, 
    defaultValue: 100 
  },
  createdBy: { 
    type: DataTypes.INTEGER, 
    allowNull: false 
  }
}, { 
  timestamps: true, 
  tableName: 'assignments' 
});

module.exports = Assignment;
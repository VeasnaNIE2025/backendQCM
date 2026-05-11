const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Submission = sequelize.define('Submission', {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  assignmentId: { 
    type: DataTypes.INTEGER, 
    allowNull: false 
  },
  studentId: { 
    type: DataTypes.INTEGER, 
    allowNull: false 
  },
  fileUrl: { 
    type: DataTypes.STRING(500), 
    allowNull: false 
  },
  fileName: { 
    type: DataTypes.STRING(255), 
    allowNull: false 
  },
  fileType: { 
    type: DataTypes.STRING(50) 
  },
  fileSize: { 
    type: DataTypes.INTEGER 
  },
  submittedAt: { 
    type: DataTypes.DATE, 
    defaultValue: DataTypes.NOW 
  },
  grade: { 
    type: DataTypes.INTEGER, 
    allowNull: true 
  },
  feedback: { 
    type: DataTypes.TEXT, 
    allowNull: true 
  },
  gradedAt: { 
    type: DataTypes.DATE, 
    allowNull: true 
  },
  status: { 
    type: DataTypes.ENUM('submitted', 'graded'), 
    defaultValue: 'submitted' 
  }
}, { 
  timestamps: true, 
  tableName: 'submissions' 
});

module.exports = Submission;
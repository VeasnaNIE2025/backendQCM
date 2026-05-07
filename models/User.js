// const { DataTypes } = require('sequelize');
// const { sequelize } = require('../config/db');
// const bcrypt = require('bcryptjs');

// const User = sequelize.define('User', {
//   id: {
//     type: DataTypes.INTEGER,
//     primaryKey: true,
//     autoIncrement: true
//   },
//   username: {
//     type: DataTypes.STRING(50),
//     allowNull: false,
//     unique: true
//   },
//   email: {
//     type: DataTypes.STRING(100),
//     allowNull: false,
//     unique: true,
//     validate: {
//       isEmail: true
//     }
//   },
//   password: {
//     type: DataTypes.STRING(255),
//     allowNull: false
//   },
//   fullName: {
//     type: DataTypes.STRING(100),
//     allowNull: false
//   },
//   role: {
//     type: DataTypes.ENUM('admin', 'teacher', 'student'),
//     defaultValue: 'student'
//   },
//   isActive: {
//     type: DataTypes.BOOLEAN,
//     defaultValue: true
//   }
// }, {
//   timestamps: true,
//   tableName: 'users'
// });

// // Hash password before save
// User.beforeCreate(async (user) => {
//   const salt = await bcrypt.genSalt(10);
//   user.password = await bcrypt.hash(user.password, salt);
// });

// User.beforeUpdate(async (user) => {
//   if (user.changed('password')) {
//     const salt = await bcrypt.genSalt(10);
//     user.password = await bcrypt.hash(user.password, salt);
//   }
// });

// // Compare password method
// User.prototype.matchPassword = async function(enteredPassword) {
//   return await bcrypt.compare(enteredPassword, this.password);
// };

// module.exports = User;

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  fullName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('admin', 'teacher', 'student'),
    defaultValue: 'student'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  // ✅ បន្ថែម classId (ភ្ជាប់ទៅតារាង classes)
  classId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'classes', key: 'id' }
  }
}, {
  timestamps: true,
  tableName: 'users'
});

// Hash password before save
User.beforeCreate(async (user) => {
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
});

User.beforeUpdate(async (user) => {
  if (user.changed('password')) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

// Compare password method
User.prototype.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = User;
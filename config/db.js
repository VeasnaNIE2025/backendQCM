// const { Sequelize } = require('sequelize');
// const dotenv = require('dotenv');

// dotenv.config();

// const sequelize = new Sequelize(
//   process.env.DB_NAME || 'qcm_exam_system',
//   process.env.DB_USER || 'root',
//   process.env.DB_PASSWORD || '',
//   {
//     host: process.env.DB_HOST || 'localhost',
//     dialect: 'mysql',
//     logging: false, // set to console.log to see SQL queries
//     pool: {
//       max: 5,
//       min: 0,
//       acquire: 30000,
//       idle: 10000
//     }
//   }
// );

// const connectDB = async () => {
//   try {
//     await sequelize.authenticate();
//     console.log('✅ MySQL Connected Successfully!');
    
//     // Sync all models (create tables if not exists)
//     await sequelize.sync({ alter: false });
//     console.log('✅ Database synced');
    
//   } catch (error) {
//     console.error('❌ MySQL Connection Error:', error.message);
//     process.exit(1);
//   }
// };

// module.exports = { sequelize, connectDB };

const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

// ✅ Enable SSL when connecting to remote host (Railway, etc.)
const needSSL = process.env.DB_HOST && process.env.DB_HOST !== 'localhost';

const sequelize = new Sequelize(
  process.env.DB_NAME || 'qcm_exam_system',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    ...(needSSL && {
      dialectOptions: {
        ssl: { rejectUnauthorized: false }
      }
    })
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL Connected Successfully!');

    await sequelize.sync({ alter: false });
    console.log('✅ Database synced');

  } catch (error) {
    console.error('❌ MySQL Connection Error:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
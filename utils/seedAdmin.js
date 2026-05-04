const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      await User.create({
        username: 'admin',
        email: 'admin@qcm.com',
        password: 'admin123',
        fullName: 'System Administrator',
        role: 'admin',
        isActive: true
      });
      console.log('✅ Admin user created!');
      console.log('📧 Email: admin@qcm.com');
      console.log('🔑 Password: admin123');
    } else {
      console.log('⚠️ Admin already exists');
    }
    
    process.exit();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createAdmin();
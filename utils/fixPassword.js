const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

const fixPasswords = async () => {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'qcm_exam_system'
  });

  // Hash password with bcryptjs (produces $2a$)
  const password = 'admin123';
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  
  console.log('New hash for admin123:', hashedPassword);
  
  // Update admin password
  await connection.execute(
    'UPDATE users SET password = ? WHERE email = ?',
    [hashedPassword, 'admin@qcm.com']
  );
  
  // Update test user password
  await connection.execute(
    'UPDATE users SET password = ? WHERE email = ?',
    [hashedPassword, 'test@test.com']
  );
  
  console.log('✅ Passwords updated successfully!');
  
  // Verify
  const [rows] = await connection.execute('SELECT email, LEFT(password, 20) as pwd_preview FROM users');
  console.log('\nUpdated users:');
  rows.forEach(row => {
    console.log(`${row.email} -> ${row.pwd_preview}...`);
  });
  
  await connection.end();
};

fixPasswords();
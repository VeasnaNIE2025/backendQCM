const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const setupAssociations = require('./models/associations');

// Set timezone to Cambodia
process.env.TZ = 'Asia/Phnom_Penh';

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Setup model associations
setupAssociations();

const app = express();

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://online-qcm.vercel.app', // ✅ Vercel domain
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== ROUTES ====================
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/student', require('./routes/studentRoutes'));
app.use('/api/teacher', require('./routes/teacherRoutes'));

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Home route
app.get('/', (req, res) => {
  res.json({ message: 'QCM Exam System API' });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}`);
  console.log(`📚 Subjects API: http://localhost:${PORT}/api/admin/subjects`);
  console.log(`❓ Questions API: http://localhost:${PORT}/api/admin/questions`);
  console.log(`👥 Users API: http://localhost:${PORT}/api/admin/users`);
});
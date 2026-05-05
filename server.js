const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const setupAssociations = require('./models/associations');

process.env.TZ = 'Asia/Phnom_Penh';
dotenv.config();

connectDB();
setupAssociations();

const app = express();

// CORS
app.use(cors({
  origin: ['https://online-qcm.vercel.app', 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/student', require('./routes/studentRoutes'));
app.use('/api/teacher', require('./routes/teacherRoutes'));

// Test Routes
app.get('/api/test', (req, res) => res.json({ message: 'API is working!' }));
app.get('/', (req, res) => res.json({ message: 'QCM Exam System API' }));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  // ... កូដខាងលើ

console.log("🚀 Loading routes...");

app.use('/api/auth', require('./routes/authRoutes'));
console.log("✅ Auth routes loaded successfully");

app.use('/api/admin', require('./routes/adminRoutes'));
console.log("✅ Admin routes loaded");

app.use('/api/student', require('./routes/studentRoutes'));
console.log("✅ Student routes loaded");

app.use('/api/teacher', require('./routes/teacherRoutes'));
console.log("✅ Teacher routes loaded");

// ... រក្សាទុក
});
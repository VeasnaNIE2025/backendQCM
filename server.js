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

// ====================== CORS CONFIGURATION ======================
const corsOptions = {
  origin: [
    'https://online-qcm.vercel.app',   // ← Your production frontend
    'http://localhost:5173',           // Vite (most common)
    'http://localhost:3000',           // React/Create React App
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length'],
  maxAge: 86400, // 24 hours preflight cache
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight (OPTIONS) requests explicitly - Very important for Railway + Vercel
app.options('*', cors(corsOptions));

// Additional security headers (helps in some edge cases)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (['https://online-qcm.vercel.app', 'http://localhost:5173', 'http://localhost:3000'].includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ====================== ROUTES ======================
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

// ====================== START SERVER ======================
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📡 API Base URL: http://localhost:${PORT}`);
  console.log(`🌐 Frontend allowed: https://online-qcm.vercel.app`);
});
// const express = require('express');
// const cors = require('cors');
// const dotenv = require('dotenv');
// const { connectDB } = require('./config/db');
// const setupAssociations = require('./models/associations');

// process.env.TZ = 'Asia/Phnom_Penh';
// dotenv.config();

// connectDB();
// setupAssociations();

// const app = express();

// // ── CORS ──────────────────────────────────────────────
// app.use(cors({
//   origin: [
//     'http://localhost:5173',
//     'http://localhost:3000',
//     'https://online-qcm.vercel.app',
//     'https://qcm.salacode.site',
//     /\.vercel\.app$/           // ✅ គ្រប់ Vercel preview URLs
//   ],
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // ── Routes ────────────────────────────────────────────
// app.use('/api/auth',    require('./routes/authRoutes'));
// app.use('/api/admin',   require('./routes/adminRoutes'));
// app.use('/api/student', require('./routes/studentRoutes'));
// app.use('/api/teacher', require('./routes/teacherRoutes'));
// app.use('/api/classes', require('./routes/classRoutes'));  // ✅ ត្រូវដាក់នៅទីនេះ

// // ── Test ──────────────────────────────────────────────
// app.get('/api/test', (req, res) => res.json({ message: 'API is working!' }));
// app.get('/',         (req, res) => res.json({ message: 'QCM Exam System API' }));

// // ── Start ─────────────────────────────────────────────
// const PORT = process.env.PORT || 8080;
// app.listen(PORT, () => {
//   console.log(`✅ Server running on port ${PORT}`);
// });

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

// ── CORS ──────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://online-qcm.vercel.app',
      'https://qcm.salacode.site',
    ];

    // ✅ Allow any Vercel URL (including deep subdomains like project-git-branch-user.vercel.app)
    const isVercel = /\.vercel\.app$/.test(origin);

    if (allowedOrigins.includes(origin) || isVercel) {
      callback(null, true);
    } else {
      console.warn('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────────────
app.use('/api/auth',    require('./routes/authRoutes'));
app.use('/api/admin',   require('./routes/adminRoutes'));
app.use('/api/student', require('./routes/studentRoutes'));
app.use('/api/teacher', require('./routes/teacherRoutes'));
app.use('/api/classes', require('./routes/classRoutes'));

// ── Test ──────────────────────────────────────────────
app.get('/api/test', (req, res) => res.json({ message: 'API is working!' }));
app.get('/',         (req, res) => res.json({ message: 'QCM Exam System API' }));

// ── Start ─────────────────────────────────────────────
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
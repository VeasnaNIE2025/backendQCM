// const User = require('../models/User');
// const Class = require('../models/Class');
// const { Op } = require('sequelize');

// // @desc    Get all users
// // @route   GET /api/admin/users
// const getUsers = async (req, res) => {
//   try {
//     const users = await User.findAll({
//       attributes: { exclude: ['password'] },
//       include: [{
//         model: Class,
//         attributes: ['id', 'name'],
//         required: false   // LEFT JOIN — user គ្មានថ្នាក់ក៏ return មក
//       }],
//       order: [['createdAt', 'DESC']]
//     });
//     res.json(users);
//   } catch (error) {
//     console.error('Error in getUsers:', error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // @desc    Get user by ID
// // @route   GET /api/admin/users/:id
// const getUserById = async (req, res) => {
//   try {
//     const user = await User.findByPk(req.params.id, {
//       attributes: { exclude: ['password'] },
//       include: [{ model: Class, attributes: ['id', 'name'], required: false }]
//     });
//     if (user) {
//       res.json(user);
//     } else {
//       res.status(404).json({ message: 'មិនឃើញអ្នកប្រើប្រាស់' });
//     }
//   } catch (error) {
//     console.error('Error in getUserById:', error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // @desc    Create user
// // @route   POST /api/admin/users
// const createUser = async (req, res) => {
//   try {
//     const { username, email, password, fullName, role, classId, isActive } = req.body;

//     const userExists = await User.findOne({
//       where: { [Op.or]: [{ email }, { username }] }
//     });
//     if (userExists) {
//       return res.status(400).json({ message: 'អ្នកប្រើប្រាស់មានរួចហើយ' });
//     }

//     const user = await User.create({
//       username,
//       email,
//       password,
//       fullName,
//       role:     role     || 'student',
//       classId:  role === 'student' ? (classId || null) : null,  // ✅ classId តែ student
//       isActive: isActive !== undefined ? isActive : true
//     });

//     const userWithoutPassword = user.toJSON();
//     delete userWithoutPassword.password;
//     res.status(201).json(userWithoutPassword);
//   } catch (error) {
//     console.error('Error in createUser:', error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // @desc    Update user
// // @route   PUT /api/admin/users/:id
// const updateUser = async (req, res) => {
//   try {
//     const user = await User.findByPk(req.params.id);
//     if (!user) {
//       return res.status(404).json({ message: 'មិនឃើញអ្នកប្រើប្រាស់' });
//     }

//     const { username, email, password, fullName, role, classId, isActive } = req.body;

//     if (username && username !== user.username) {
//       const existing = await User.findOne({ where: { username } });
//       if (existing) return res.status(400).json({ message: 'ឈ្មោះអ្នកប្រើប្រាស់មានរួចហើយ' });
//     }
//     if (email && email !== user.email) {
//       const existing = await User.findOne({ where: { email } });
//       if (existing) return res.status(400).json({ message: 'អ៊ីមែលមានរួចហើយ' });
//     }

//     if (username)            user.username  = username;
//     if (email)               user.email     = email;
//     if (fullName)            user.fullName  = fullName;
//     if (role)                user.role      = role;
//     if (isActive !== undefined) user.isActive = isActive;
//     if (password)            user.password  = password;

//     // ✅ update classId — student only
//     const effectiveRole = role || user.role;
//     user.classId = effectiveRole === 'student' ? (classId || null) : null;

//     await user.save();

//     const userWithoutPassword = user.toJSON();
//     delete userWithoutPassword.password;
//     res.json(userWithoutPassword);
//   } catch (error) {
//     console.error('Error in updateUser:', error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // @desc    Delete user
// // @route   DELETE /api/admin/users/:id
// const deleteUser = async (req, res) => {
//   try {
//     const user = await User.findByPk(req.params.id);
//     if (!user) {
//       return res.status(404).json({ message: 'មិនឃើញអ្នកប្រើប្រាស់' });
//     }
//     if (user.role === 'admin') {
//       return res.status(400).json({ message: 'មិនអាចលុបគណនី Admin បានទេ' });
//     }
//     await user.destroy();
//     res.json({ message: 'លុបអ្នកប្រើប្រាស់បានជោគជ័យ' });
//   } catch (error) {
//     console.error('Error in deleteUser:', error);
//     res.status(500).json({ message: error.message });
//   }
// };

// module.exports = { getUsers, getUserById, createUser, updateUser, deleteUser };


const User = require('../models/User');
const Class = require('../models/Class');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const XLSX = require('xlsx');
const multer = require('multer');

// សម្រាប់ import (memory storage)
const upload = multer({ storage: multer.memoryStorage() });

// ──────────────────────────────────────────────────────────
//  Existing functions (getUsers, getUserById, createUser, updateUser, deleteUser)
// ──────────────────────────────────────────────────────────

// @desc    Get all users
const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      include: [{ model: Class, attributes: ['id', 'name'], required: false }],
      order: [['createdAt', 'DESC']]
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [{ model: Class, attributes: ['id', 'name'], required: false }]
    });
    if (user) res.json(user);
    else res.status(404).json({ message: 'មិនឃើញអ្នកប្រើប្រាស់' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create user
const createUser = async (req, res) => {
  try {
    const { username, email, password, fullName, role, classId, isActive } = req.body;
    const userExists = await User.findOne({ where: { [Op.or]: [{ email }, { username }] } });
    if (userExists) return res.status(400).json({ message: 'អ្នកប្រើប្រាស់មានរួចហើយ' });

    const user = await User.create({
      username, email, password, fullName,
      role: role || 'student',
      classId: role === 'student' ? (classId || null) : null,
      isActive: isActive !== undefined ? isActive : true
    });
    const userWithoutPassword = user.toJSON();
    delete userWithoutPassword.password;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user
const updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'មិនឃើញអ្នកប្រើប្រាស់' });
    const { username, email, password, fullName, role, classId, isActive } = req.body;

    if (username && username !== user.username) {
      const existing = await User.findOne({ where: { username } });
      if (existing) return res.status(400).json({ message: 'ឈ្មោះអ្នកប្រើប្រាស់មានរួចហើយ' });
    }
    if (email && email !== user.email) {
      const existing = await User.findOne({ where: { email } });
      if (existing) return res.status(400).json({ message: 'អ៊ីមែលមានរួចហើយ' });
    }

    if (username) user.username = username;
    if (email) user.email = email;
    if (fullName) user.fullName = fullName;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (password) user.password = password;

    const effectiveRole = role || user.role;
    user.classId = effectiveRole === 'student' ? (classId || null) : null;
    await user.save();

    const userWithoutPassword = user.toJSON();
    delete userWithoutPassword.password;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'មិនឃើញអ្នកប្រើប្រាស់' });
    if (user.role === 'admin') return res.status(400).json({ message: 'មិនអាចលុបគណនី Admin បានទេ' });
    await user.destroy();
    res.json({ message: 'លុបអ្នកប្រើប្រាស់បានជោគជ័យ' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ──────────────────────────────────────────────────────────
//  🆕 NEW FUNCTIONS: Export Template & Import Excel
// ──────────────────────────────────────────────────────────

// 📥 1. ទាញយក Template Excel
const downloadUserTemplate = async (req, res) => {
  try {
    const workbook = XLSX.utils.book_new();
    const headers = ['username', 'email', 'password', 'fullName', 'role', 'className', 'isActive'];
    const sheetData = [headers];
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename=user_import_template.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📤 2. Import Users ពី Excel
const importUsersFromExcel = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'សូមផ្ទុកឯកសារ Excel' });

  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const results = { success: [], errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const { username, email, password, fullName, role = 'student', className, isActive = 1 } = row;

      if (!username || !email || !password || !fullName) {
        results.errors.push({ row: i + 2, error: 'ខ្វះព័ត៌មានសំខាន់ (username, email, password, fullName)' });
        continue;
      }

      // ពិនិត្យអ្នកប្រើដដែល
      const existing = await User.findOne({ where: { [Op.or]: [{ email }, { username }] } });
      if (existing) {
        results.errors.push({ row: i + 2, error: 'ឈ្មោះអ្នកប្រើ ឬ អ៊ីមែល មានរួចហើយ' });
        continue;
      }

      // រក classId តាម className (ប្រសិនបើជាសិស្ស)
      let classId = null;
      if (className && role === 'student') {
        const classObj = await Class.findOne({ where: { name: className } });
        if (!classObj) {
          results.errors.push({ row: i + 2, error: `ថ្នាក់ "${className}" មិនមានក្នុងប្រព័ន្ធ` });
          continue;
        }
        classId = classObj.id;
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // បង្កើត user
      await User.create({
        username,
        email,
        password: hashedPassword,
        fullName,
        role: ['admin', 'teacher', 'student'].includes(role) ? role : 'student',
        classId,
        isActive: (isActive == 1 || isActive === '1' || isActive === true)
      });

      results.success.push({ row: i + 2, username, email });
    }

    res.json({
      message: `បានបញ្ចូលជោគជ័យ ${results.success.length} នាក់, បរាជ័យ ${results.errors.length}`,
      details: results
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  downloadUserTemplate,
  importUsersFromExcel,
  upload   // export multer instance for route
};
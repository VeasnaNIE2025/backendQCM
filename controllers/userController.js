const User = require('../models/User');
const Class = require('../models/Class');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const XLSX = require('xlsx');
const multer = require('multer');

// សម្រាប់ import (memory storage)
const upload = multer({ storage: multer.memoryStorage() });

// ──────────────────────────────────────────────────────────
//  Existing functions
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
//  🆕 Export Template & Import Excel
// ──────────────────────────────────────────────────────────

// 📥 1. ទាញយក Template Excel
const downloadUserTemplate = async (req, res) => {
  try {
    const classes = await Class.findAll({
      attributes: ['id', 'name'],
      order: [['name', 'ASC']]
    });

    const workbook = XLSX.utils.book_new();

    // ── Sheet 1: Template ──────────────────────────────────
    const templateData = [
      ['username', 'email', 'password', 'fullName', 'role', 'classId', 'isActive'],
      ['student01', 'student01@school.com', '123456', 'សុខ វុទ្ធី',  'student', 1, 1],
      ['teacher01', 'teacher01@school.com', '123456', 'គ្រូ សុភា',   'teacher', '', 1],
    ];
    const templateSheet = XLSX.utils.aoa_to_sheet(templateData);
    templateSheet['!cols'] = [
      { wch: 15 }, { wch: 25 }, { wch: 12 },
      { wch: 20 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
    ];
    XLSX.utils.book_append_sheet(workbook, templateSheet, 'Template');

    // ── Sheet 2: Classes Reference ─────────────────────────
    const classData = [
      ['classId', 'ឈ្មោះថ្នាក់'],
      ...classes.map(c => [c.id, c.name])
    ];
    const classSheet = XLSX.utils.aoa_to_sheet(classData);
    classSheet['!cols'] = [{ wch: 10 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, classSheet, 'Classes');

    // ── Sheet 3: Instructions ──────────────────────────────
    const instructions = [
      ['ការណែនាំការបំពេញទិន្នន័យ'],
      [''],
      ['Column',   'ការណែនាំ',                                                          'ចាំបាច់'],
      ['username', 'ឈ្មោះអ្នកប្រើប្រាស់ (មិនអាចដូចគ្នា)',                              'បាទ/ចាស'],
      ['email',    'អ៊ីមែល (មិនអាចដូចគ្នា)',                                             'បាទ/ចាស'],
      ['password', 'ពាក្យសម្ងាត់ (យ៉ាងតិច 6 តួ)',                                      'បាទ/ចាស'],
      ['fullName', 'ឈ្មោះពេញ (ភាសាខ្មែរ ឬ អង់គ្លេស)',                                  'បាទ/ចាស'],
      ['role',     'student / teacher / admin',                                          'បាទ/ចាស'],
      ['classId',  'ID ថ្នាក់ (មើលក្នុង Sheet "Classes") — សម្រាប់ student ប៉ុណ្ណោះ',  'អត់'],
      ['isActive', '1 = សកម្ម, 0 = បិទ',                                                'អត់ (default: 1)'],
    ];
    const instrSheet = XLSX.utils.aoa_to_sheet(instructions);
    instrSheet['!cols'] = [{ wch: 12 }, { wch: 55 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, instrSheet, 'ការណែនាំ');

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
      const {
        username,
        email,
        password,
        fullName,
        role = 'student',
        classId: rawClassId,   // ✅ classId ពី Excel (number)
        className,             // fallback: className (string)
        isActive = 1
      } = row;

      // ── Validate required fields ───────────────────────
      if (!username || !email || !password || !fullName) {
        results.errors.push({
          row: i + 2,
          error: 'ខ្វះព័ត៌មានសំខាន់ (username, email, password, fullName)'
        });
        continue;
      }

      // ── ពិនិត្យ duplicate ──────────────────────────────
      const existing = await User.findOne({
        where: { [Op.or]: [{ email }, { username }] }
      });
      if (existing) {
        results.errors.push({ row: i + 2, error: 'ឈ្មោះអ្នកប្រើ ឬ អ៊ីមែល មានរួចហើយ' });
        continue;
      }

      // ── រក classId (support ទាំង classId និង className) ──
      let classId = null;
      if (role === 'student') {
        if (rawClassId) {
          // ✅ Option 1: ប្រើ classId ផ្ទាល់ពី Excel
          const classObj = await Class.findByPk(Number(rawClassId));
          if (!classObj) {
            results.errors.push({
              row: i + 2,
              error: `classId "${rawClassId}" មិនមានក្នុងប្រព័ន្ធ`
            });
            continue;
          }
          classId = classObj.id;
        } else if (className) {
          // ✅ Option 2: fallback ប្រើ className បើ classId ទទេ
          const classObj = await Class.findOne({ where: { name: className } });
          if (!classObj) {
            results.errors.push({
              row: i + 2,
              error: `ថ្នាក់ "${className}" មិនមានក្នុងប្រព័ន្ធ`
            });
            continue;
          }
          classId = classObj.id;
        }
        // classId = null បើ student មិនមានថ្នាក់ (អនុញ្ញាត)
      }

      // ── Hash password ──────────────────────────────────
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(String(password), salt);

      // ── បង្កើត user ────────────────────────────────────
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
    console.error('Import error:', error);
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
  upload
};
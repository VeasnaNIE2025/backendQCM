const User = require('../models/User');
const Class = require('../models/Class');  // ✅ បន្ថែម Class Model (ប្រសិនបើមិនទាន់មាន)
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const register = async (req, res) => {
  try {
    const { username, email, password, fullName, role, classId } = req.body;

    // 1. ពិនិត្យអ្នកប្រើប្រាស់ដដែល
    const userExists = await User.findOne({
      where: { [Op.or]: [{ email }, { username }] }
    });
    if (userExists) {
      return res.status(400).json({ message: 'អ្នកប្រើប្រាស់មានរួចហើយ' });
    }

    // 2. បើតួនាទីជា student ត្រូវការ classId
    const finalRole = role || 'student';
    let finalClassId = null;
    if (finalRole === 'student') {
      if (!classId) {
        return res.status(400).json({ message: 'សូមជ្រើសរើសថ្នាក់រៀន' });
      }
      // ពិនិត្យថាតើ classId មានក្នុងតារាង classes ដែរឬទេ (ស្រេចចិត្ត)
      const classExists = await Class.findByPk(classId);
      if (!classExists) {
        return res.status(400).json({ message: 'ថ្នាក់រៀនមិនត្រឹមត្រូវ' });
      }
      finalClassId = classId;
    }

    // 3. បង្កើតអ្នកប្រើប្រាស់
    const user = await User.create({
      username,
      email,
      password,
      fullName,
      role: finalRole,
      classId: finalClassId   // ប្រើ null ប្រសិនបើមិនមែន student
    });

    res.status(201).json({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      token: generateToken(user.id),
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'អ៊ីមែល ឬ ពាក្យសម្ងាត់មិនត្រឹមត្រូវ' });
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'អ៊ីមែល ឬ ពាក្យសម្ងាត់មិនត្រឹមត្រូវ' });
    }
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      token: generateToken(user.id),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { register, login, getMe };
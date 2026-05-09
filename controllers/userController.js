const User = require('../models/User');
const Class = require('../models/Class');
const { Op } = require('sequelize');

// @desc    Get all users
// @route   GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      include: [{
        model: Class,
        attributes: ['id', 'name'],
        required: false   // LEFT JOIN — user គ្មានថ្នាក់ក៏ return មក
      }],
      order: [['createdAt', 'DESC']]
    });
    res.json(users);
  } catch (error) {
    console.error('Error in getUsers:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [{ model: Class, attributes: ['id', 'name'], required: false }]
    });
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'មិនឃើញអ្នកប្រើប្រាស់' });
    }
  } catch (error) {
    console.error('Error in getUserById:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create user
// @route   POST /api/admin/users
const createUser = async (req, res) => {
  try {
    const { username, email, password, fullName, role, classId, isActive } = req.body;

    const userExists = await User.findOne({
      where: { [Op.or]: [{ email }, { username }] }
    });
    if (userExists) {
      return res.status(400).json({ message: 'អ្នកប្រើប្រាស់មានរួចហើយ' });
    }

    const user = await User.create({
      username,
      email,
      password,
      fullName,
      role:     role     || 'student',
      classId:  role === 'student' ? (classId || null) : null,  // ✅ classId តែ student
      isActive: isActive !== undefined ? isActive : true
    });

    const userWithoutPassword = user.toJSON();
    delete userWithoutPassword.password;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Error in createUser:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
const updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'មិនឃើញអ្នកប្រើប្រាស់' });
    }

    const { username, email, password, fullName, role, classId, isActive } = req.body;

    if (username && username !== user.username) {
      const existing = await User.findOne({ where: { username } });
      if (existing) return res.status(400).json({ message: 'ឈ្មោះអ្នកប្រើប្រាស់មានរួចហើយ' });
    }
    if (email && email !== user.email) {
      const existing = await User.findOne({ where: { email } });
      if (existing) return res.status(400).json({ message: 'អ៊ីមែលមានរួចហើយ' });
    }

    if (username)            user.username  = username;
    if (email)               user.email     = email;
    if (fullName)            user.fullName  = fullName;
    if (role)                user.role      = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (password)            user.password  = password;

    // ✅ update classId — student only
    const effectiveRole = role || user.role;
    user.classId = effectiveRole === 'student' ? (classId || null) : null;

    await user.save();

    const userWithoutPassword = user.toJSON();
    delete userWithoutPassword.password;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error in updateUser:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'មិនឃើញអ្នកប្រើប្រាស់' });
    }
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'មិនអាចលុបគណនី Admin បានទេ' });
    }
    await user.destroy();
    res.json({ message: 'លុបអ្នកប្រើប្រាស់បានជោគជ័យ' });
  } catch (error) {
    console.error('Error in deleteUser:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getUsers, getUserById, createUser, updateUser, deleteUser };
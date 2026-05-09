const { sequelize } = require('../config/db');
const Class = require('../models/Class');
const Subject = require('../models/Subject');

// Get subjects assigned to a specific class
const getSubjectsByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const classObj = await Class.findByPk(classId, {
      include: [{ model: Subject, through: { attributes: [] } }]
    });
    if (!classObj) return res.status(404).json({ message: 'ថ្នាក់មិនមាន' });
    res.json(classObj.Subjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Assign subjects to a class (replace existing)
const assignSubjectsToClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const { subjectIds } = req.body; // array of subject IDs
    const classObj = await Class.findByPk(classId);
    if (!classObj) return res.status(404).json({ message: 'ថ្នាក់មិនមាន' });
    await classObj.setSubjects(subjectIds);
    res.json({ message: 'បានកំណត់មុខវិជ្ជាដល់ថ្នាក់ដោយជោគជ័យ' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all classes with their assigned subjects (for Admin UI)
const getAllClassesWithSubjects = async (req, res) => {
  try {
    const classes = await Class.findAll({
      include: [{ model: Subject, through: { attributes: [] } }]
    });
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSubjectsByClass, assignSubjectsToClass, getAllClassesWithSubjects };
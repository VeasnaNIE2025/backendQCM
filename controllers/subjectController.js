// const Subject = require('../models/Subject');
// const { Op } = require('sequelize');

// // Get all subjects
// const getSubjects = async (req, res) => {
//   try {
//     console.log('✅ getSubjects called');
//     const subjects = await Subject.findAll({
//       order: [['createdAt', 'DESC']]
//     });
//     console.log(`Found ${subjects.length} subjects`);
//     res.json(subjects);
//   } catch (error) {
//     console.error('Error in getSubjects:', error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // Get single subject
// const getSubjectById = async (req, res) => {
//   try {
//     const subject = await Subject.findByPk(req.params.id);
//     if (subject) {
//       res.json(subject);
//     } else {
//       res.status(404).json({ message: 'មិនឃើញមុខវិជ្ជា' });
//     }
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // Create subject
// const createSubject = async (req, res) => {
//   try {
//     console.log('📝 createSubject called with body:', req.body);
//     const { name, description, isActive } = req.body;
    
//     if (!name) {
//       return res.status(400).json({ message: 'ឈ្មោះមុខវិជ្ជាត្រូវបានទាមទារ' });
//     }
    
//     const existing = await Subject.findOne({ where: { name } });
//     if (existing) {
//       return res.status(400).json({ message: 'មុខវិជ្ជានេះមានរួចហើយ' });
//     }
    
//     const subject = await Subject.create({
//       name,
//       description: description || '',
//       isActive: isActive !== undefined ? isActive : true
//     });
    
//     res.status(201).json(subject);
//   } catch (error) {
//     console.error('Error in createSubject:', error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // Update subject
// const updateSubject = async (req, res) => {
//   try {
//     const subject = await Subject.findByPk(req.params.id);
//     if (!subject) {
//       return res.status(404).json({ message: 'មិនឃើញមុខវិជ្ជា' });
//     }
    
//     const { name, description, isActive } = req.body;
    
//     if (name && name !== subject.name) {
//       const existing = await Subject.findOne({ where: { name } });
//       if (existing) {
//         return res.status(400).json({ message: 'មុខវិជ្ជានេះមានរួចហើយ' });
//       }
//       subject.name = name;
//     }
    
//     if (description !== undefined) subject.description = description;
//     if (isActive !== undefined) subject.isActive = isActive;
    
//     await subject.save();
//     res.json(subject);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // Delete subject
// const deleteSubject = async (req, res) => {
//   try {
//     const subject = await Subject.findByPk(req.params.id);
//     if (!subject) {
//       return res.status(404).json({ message: 'មិនឃើញមុខវិជ្ជា' });
//     }
    
//     await subject.destroy();
//     res.json({ message: 'លុបមុខវិជ្ជាបានជោគជ័យ' });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // Make sure all functions are exported
// module.exports = {
//   getSubjects,
//   getSubjectById,
//   createSubject,
//   updateSubject,
//   deleteSubject
// };

const Subject = require('../models/Subject');
const { Op } = require('sequelize');

// Get all subjects
const getSubjects = async (req, res) => {
  try {
    console.log('✅ getSubjects called');
    const subjects = await Subject.findAll({
      order: [['createdAt', 'DESC']]
    });
    console.log(`Found ${subjects.length} subjects`);
    res.json(subjects);
  } catch (error) {
    console.error('Error in getSubjects:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get single subject
const getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findByPk(req.params.id);
    if (subject) {
      res.json(subject);
    } else {
      res.status(404).json({ message: 'មិនឃើញមុខវិជ្ជា' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create subject
const createSubject = async (req, res) => {
  try {
    console.log('📝 createSubject called with body:', req.body);
    const { name, description, teacherId, isActive } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'ឈ្មោះមុខវិជ្ជាត្រូវបានទាមទារ' });
    }
    
    const existing = await Subject.findOne({ where: { name } });
    if (existing) {
      return res.status(400).json({ message: 'មុខវិជ្ជានេះមានរួចហើយ' });
    }
    
    const subject = await Subject.create({
      name,
      description: description || '',
      teacherId: teacherId || null,
      isActive: isActive !== undefined ? isActive : true
    });
    
    res.status(201).json(subject);
  } catch (error) {
    console.error('Error in createSubject:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update subject
const updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findByPk(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'មិនឃើញមុខវិជ្ជា' });
    }
    
    const { name, description, teacherId, isActive } = req.body;
    
    if (name && name !== subject.name) {
      const existing = await Subject.findOne({ where: { name } });
      if (existing) {
        return res.status(400).json({ message: 'មុខវិជ្ជានេះមានរួចហើយ' });
      }
    }
    
    await subject.update({
      name: name || subject.name,
      description: description !== undefined ? description : subject.description,
      teacherId: teacherId !== undefined ? teacherId : subject.teacherId,
      isActive: isActive !== undefined ? isActive : subject.isActive
    });
    
    res.json(subject);
  } catch (error) {
    console.error('Error in updateSubject:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete subject
const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findByPk(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'មិនឃើញមុខវិជ្ជា' });
    }
    
    await subject.destroy();
    res.json({ message: 'លុបមុខវិជ្ជាបានជោគជ័យ' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject
};
const Question = require('../models/Question');
const { Op } = require('sequelize');

// Get all questions — ✅ support filter: subjectId, difficulty, search
const getQuestions = async (req, res) => {
  try {
    console.log('✅ getQuestions API called', req.query);

    const { subjectId, difficulty, search } = req.query;

    // ✅ Build where clause dynamically
    const where = {};

    if (subjectId) {
      where.subjectId = parseInt(subjectId);
    }

    if (difficulty) {
      where.difficulty = difficulty;
    }

    if (search) {
      where.questionText = { [Op.like]: `%${search}%` };
    }

    const questions = await Question.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    console.log(`Found ${questions.length} questions`);
    res.json(questions);
  } catch (error) {
    console.error('Error in getQuestions:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get single question
const getQuestionById = async (req, res) => {
  try {
    const question = await Question.findByPk(req.params.id);
    if (question) {
      res.json(question);
    } else {
      res.status(404).json({ message: 'មិនឃើញសំណួរ' });
    }
  } catch (error) {
    console.error('Error in getQuestionById:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create question
const createQuestion = async (req, res) => {
  try {
    console.log('📝 createQuestion called');

    const {
      subjectId, questionText,
      option_a, option_b, option_c, option_d,
      correctAnswer, explanation, difficulty, points
    } = req.body;

    if (!subjectId) return res.status(400).json({ message: 'សូមជ្រើសរើសមុខវិជ្ជា' });
    if (!questionText) return res.status(400).json({ message: 'សូមបញ្ចូលសំណួរ' });
    if (!option_a || !option_b || !option_c || !option_d)
      return res.status(400).json({ message: 'សូមបញ្ចូលជម្រើសទាំងអស់' });
    if (!correctAnswer) return res.status(400).json({ message: 'សូមជ្រើសរើសចម្លើយត្រឹមត្រូវ' });

    const question = await Question.create({
      subjectId: parseInt(subjectId),
      questionText, option_a, option_b, option_c, option_d,
      correctAnswer,
      explanation: explanation || '',
      difficulty: difficulty || 'medium',
      points: points || 1
    });

    res.status(201).json(question);
  } catch (error) {
    console.error('Error in createQuestion:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update question
const updateQuestion = async (req, res) => {
  try {
    const question = await Question.findByPk(req.params.id);
    if (!question) return res.status(404).json({ message: 'មិនឃើញសំណួរ' });
    await question.update(req.body);
    res.json(question);
  } catch (error) {
    console.error('Error in updateQuestion:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete question
const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findByPk(req.params.id);
    if (!question) return res.status(404).json({ message: 'មិនឃើញសំណួរ' });
    await question.destroy();
    res.json({ message: 'លុបសំណួរបានជោគជ័យ' });
  } catch (error) {
    console.error('Error in deleteQuestion:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getQuestions, getQuestionById, createQuestion, updateQuestion, deleteQuestion };
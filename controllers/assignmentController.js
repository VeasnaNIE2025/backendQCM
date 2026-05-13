const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Subject    = require('../models/Subject');
const User       = require('../models/User');

// ═══════════════════════════════════════════════
// TEACHER FUNCTIONS
// ═══════════════════════════════════════════════

// ── 1. គ្រូបង្កើតកិច្ចការ ────────────────────────────────
const createAssignment = async (req, res) => {
  try {
    const { title, description, subjectId, classId, dueDate, totalPoints } = req.body;
    const createdBy = req.user.id;

    const assignment = await Assignment.create({
      title, description, subjectId, classId,
      dueDate, totalPoints: totalPoints || 100, createdBy
    });

    res.status(201).json({ message: 'បង្កើតកិច្ចការដោយជោគជ័យ!', assignment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ── 2. គ្រូទាញកិច្ចការ ───────────────────────────────────
const getAssignmentsBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const whereClause = (subjectId && subjectId !== 'undefined') ? { subjectId } : {};

    const assignments = await Assignment.findAll({
      where: whereClause,
      include: [
        { model: Subject, attributes: ['id', 'name'] },
        { model: User, as: 'teacher', attributes: ['id', 'fullName', 'email'] }
      ],
      order: [['dueDate', 'ASC']]
    });

    res.json({ assignments });
  } catch (error) {
    console.error('getAssignmentsBySubject error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ── 3. គ្រូមើល Submissions ទាំងអស់របស់ Assignment ────────
const getSubmissionsByAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findByPk(assignmentId, {
      include: [
        { model: Subject, attributes: ['id', 'name'] },
        { model: User, as: 'teacher', attributes: ['id', 'fullName', 'email'] }
      ]
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment រកមិនឃើញ!' });
    }

    const submissions = await Submission.findAll({
      where: { assignmentId },
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'fullName', 'email']
        }
      ],
      order: [['submittedAt', 'DESC']]
    });

    res.json({
      assignment,
      totalSubmissions: submissions.length,
      submissions
    });
  } catch (error) {
    console.error('getSubmissionsByAssignment error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ── 4. គ្រូដាក់ពិន្ទុ + មតិកែលម្អ ──────────────────────
const gradeSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { grade, feedback } = req.body;

    const submission = await Submission.findByPk(submissionId, {
      include: [{ model: Assignment }]
    });

    if (!submission) {
      return res.status(404).json({ message: 'Submission រកមិនឃើញ!' });
    }

    if (grade > submission.Assignment.totalPoints) {
      return res.status(400).json({
        message: `ពិន្ទុមិនអាចលើស ${submission.Assignment.totalPoints}!`
      });
    }

    await submission.update({
      grade, feedback,
      gradedAt: new Date(),
      status: 'graded'
    });

    res.json({ message: 'ដាក់ពិន្ទុដោយជោគជ័យ!', submission });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ═══════════════════════════════════════════════
// STUDENT FUNCTIONS
// ═══════════════════════════════════════════════

// ── 5. សិស្សមើលកិច្ចការទាំងអស់របស់ខ្លួន ─────────────────
const getStudentAssignments = async (req, res) => {
  try {
    const studentId = req.user.id;

    // ទាញ classId របស់សិស្ស
    const student = await User.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: 'សិស្សរកមិនឃើញ!' });
    }

    // ទាញ assignments តាម classId របស់សិស្ស
    const whereClause = student.classId
      ? { classId: student.classId }
      : {};

    const assignments = await Assignment.findAll({
      where: whereClause,
      include: [
        { model: Subject, attributes: ['id', 'name'] },
        {
          model: Submission,
          where: { studentId },
          required: false,
          attributes: ['id', 'status', 'grade', 'feedback', 'submittedAt']
        }
      ],
      order: [['dueDate', 'ASC']]
    });

    res.json({ assignments });
  } catch (error) {
    console.error('getStudentAssignments error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// ── Update Assignment ─────────────────────────
const updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findByPk(id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment រកមិនឃើញ!' });
    }

    // ← log មើល value ពិតប្រាកដ
    console.log('createdBy:', assignment.createdBy, typeof assignment.createdBy);
    console.log('user.id:', req.user.id, typeof req.user.id);

    // ← លុបការ check សិន — allow ទាំងអស់
    await assignment.update({
      title: req.body.title,
      description: req.body.description,
      subjectId: req.body.subjectId,
      classId: req.body.classId,
      dueDate: req.body.dueDate,
      totalPoints: req.body.totalPoints
    });

    res.json({ message: 'កែប្រែដោយជោគជ័យ!', assignment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// ── Delete Assignment ─────────────────────────
const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findByPk(id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment រកមិនឃើញ!' });
    }

    // ← parseInt ដូចគ្នា
    if (parseInt(assignment.createdBy) !== parseInt(req.user.id)) {
      return res.status(403).json({ message: 'មិនមានសិទ្ធិលុប!' });
    }

    await assignment.destroy();
    res.json({ message: 'លុបដោយជោគជ័យ!' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// ── 6. សិស្សដាក់ស្នាដៃ (Upload File) ─────────────────────
const submitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const studentId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: 'សូមភ្ជាប់ឯកសារ!' });
    }

    const assignment = await Assignment.findByPk(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment រកមិនឃើញ!' });
    }

    if (new Date() > new Date(assignment.dueDate)) {
      return res.status(400).json({ message: 'ផុតកំណត់ submit ហើយ!' });
    }

    const existing = await Submission.findOne({ where: { assignmentId, studentId } });
    if (existing) {
      return res.status(400).json({ message: 'បានដាក់ស្នាដៃរួចហើយ!' });
    }

    const submission = await Submission.create({
      assignmentId, studentId,
      fileUrl:  req.file.path,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      submittedAt: new Date()
    });

    res.status(201).json({ message: 'ដាក់ស្នាដៃដោយជោគជ័យ!', submission });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ── 7. សិស្សមើល Submissions + ពិន្ទុ របស់ខ្លួន ───────────
const getMySubmissions = async (req, res) => {
  try {
    const studentId = req.user.id;

    const submissions = await Submission.findAll({
      where: { studentId },
      include: [
        {
          model: Assignment,
          attributes: ['id', 'title', 'dueDate', 'totalPoints'],
          include: [{ model: Subject, attributes: ['id', 'name'] }]
        }
      ],
      order: [['submittedAt', 'DESC']]
    });

    res.json({ submissions });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ═══════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════
module.exports = {
  createAssignment,
  getAssignmentsBySubject,
  getSubmissionsByAssignment,
  gradeSubmission,
  getStudentAssignments,
  submitAssignment,
  getMySubmissions,
  updateAssignment,   
  deleteAssignment  
};
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Subject    = require('../models/Subject');
const User       = require('../models/User');

// ═══════════════════════════════════════════════
// TEACHER FUNCTIONS
// ═══════════════════════════════════════════════

// ── 1. គ្រូបង្កើតកិច្ចការ ────────────────────────────────
// const createAssignment = async (req, res) => {
//   try {
//     const { title, description, subjectId, dueDate, totalPoints } = req.body;
//     const createdBy = req.user.id;

//     const subject = await Subject.findByPk(subjectId);
//     if (!subject) {
//       return res.status(404).json({ message: 'Subject រកមិនឃើញ!' });
//     }

//     const assignment = await Assignment.create({
//       title,
//       description,
//       subjectId,
//       dueDate,
//       totalPoints: totalPoints || 100,
//       createdBy
//     });

//     res.status(201).json({
//       message: 'បង្កើតកិច្ចការដោយជោគជ័យ!',
//       assignment
//     });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// // ── 2. គ្រូទាញកិច្ចការ (ទាំងអស់ ឬ តាម Subject) ──────────
// const getAssignmentsBySubject = async (req, res) => {
//   try {
//     const { subjectId } = req.params;
//     const whereClause = (subjectId && subjectId !== 'undefined')
//       ? { subjectId }
//       : {};                              // ← គ្មាន subjectId = ទាញទាំងអស់

//     const assignments = await Assignment.findAll({
//       where: whereClause,
//       include: [
//         {
//           model: Subject,
//           attributes: ['id', 'name']
//         },
//         {
//           model: User,
//           as: 'teacher',
//           attributes: ['id', 'fullName', 'email']  // ← fullName
//         }
//       ],
//       order: [['dueDate', 'ASC']]
//     });

//     res.json({ assignments });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// assignmentController.js

// ── createAssignment ── បន្ថែម classId
const createAssignment = async (req, res) => {
  try {
    const { title, description, subjectId, classId, dueDate, totalPoints } = req.body;
    const createdBy = req.user.id;

    const assignment = await Assignment.create({
      title, description, subjectId,
      classId,                          // ← បន្ថែម
      dueDate, totalPoints: totalPoints || 100, createdBy
    });

    res.status(201).json({ message: 'បង្កើតកិច្ចការដោយជោគជ័យ!', assignment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ── getAssignmentsBySubject ── បន្ថែម Class include
const getAssignmentsBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const whereClause = (subjectId && subjectId !== 'undefined') ? { subjectId } : {};

    const assignments = await Assignment.findAll({
      where: whereClause,
      include: [
        { model: Subject, attributes: ['id', 'name'] },
        { model: Class,   attributes: ['id', 'name'] },  // ← បន្ថែម
        { model: User, as: 'teacher', attributes: ['id', 'fullName', 'email'] }
      ],
      order: [['dueDate', 'ASC']]
    });

    res.json({ assignments });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// ── 3. គ្រូមើល Submissions ទាំងអស់របស់ Assignment ────────
const getSubmissionsByAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findByPk(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment រកមិនឃើញ!' });
    }

    const submissions = await Submission.findAll({
      where: { assignmentId },
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'fullName', 'email']  // ← fullName
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
      grade,
      feedback,
      gradedAt: new Date(),
      status: 'graded'
    });

    res.json({
      message: 'ដាក់ពិន្ទុដោយជោគជ័យ!',
      submission
    });
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

    const student = await User.findByPk(studentId, {
      include: [{ model: Subject, as: 'subjects' }]
    });

    if (!student || !student.subjects || student.subjects.length === 0) {
      return res.json({ assignments: [] });
    }

    const subjectIds = student.subjects.map(s => s.id);

    const assignments = await Assignment.findAll({
      where: { subjectId: subjectIds },
      include: [
        {
          model: Subject,
          attributes: ['id', 'name']
        },
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
      assignmentId,
      studentId,
      fileUrl:  req.file.path,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      submittedAt: new Date()
    });

    res.status(201).json({
      message: 'ដាក់ស្នាដៃដោយជោគជ័យ!',
      submission
    });
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
  getMySubmissions
};

// const Subject = require('./Subject');
// const Question = require('./Question');
// const Exam = require('./Exam');
// const ExamQuestion = require('./ExamQuestion');
// const Class = require('./Class');       
// const User = require('./User');          



// const setupAssociations = () => {
//   // ------------------------------
//   // Subject - Question
//   // ------------------------------
//   Subject.hasMany(Question, { foreignKey: 'subjectId' });
//   Question.belongsTo(Subject, { foreignKey: 'subjectId' });
  
//   // ------------------------------
//   // Subject - Exam
//   // ------------------------------
//   Subject.hasMany(Exam, { foreignKey: 'subjectId' });
//   Exam.belongsTo(Subject, { foreignKey: 'subjectId' });
  
//   // ------------------------------
//   // Exam - Question (Many-to-Many)
//   // ------------------------------
//   Exam.belongsToMany(Question, { 
//     through: ExamQuestion, 
//     foreignKey: 'examId',
//     otherKey: 'questionId'
//   });
//   Question.belongsToMany(Exam, { 
//     through: ExamQuestion, 
//     foreignKey: 'questionId',
//     otherKey: 'examId'
//   });
  
//   // ------------------------------
//   // ✅ Class - User (One-to-Many)
//   // ------------------------------
//   Class.hasMany(User, { foreignKey: 'classId' });
//   User.belongsTo(Class, { foreignKey: 'classId' });

//   console.log('✅ Database associations established (including Class-User)');
// };

// module.exports = setupAssociations;

const Subject = require('./Subject');
const Question = require('./Question');
const Exam = require('./Exam');
const ExamQuestion = require('./ExamQuestion');
const Class = require('./Class');
const User = require('./User');          // ✅ ត្រូវការ
const ClassSubject = require('./ClassSubject');

const Assignment = require('./Assignment');
const Submission  = require('./Submission');

const setupAssociations = () => {
  // Subject - Question
  Subject.hasMany(Question, { foreignKey: 'subjectId' });
  Question.belongsTo(Subject, { foreignKey: 'subjectId' });
  
  // Subject - Exam
  Subject.hasMany(Exam, { foreignKey: 'subjectId' });
  Exam.belongsTo(Subject, { foreignKey: 'subjectId' });
  
  // Exam - Question (Many-to-Many)
  Exam.belongsToMany(Question, { through: ExamQuestion, foreignKey: 'examId', otherKey: 'questionId' });
  Question.belongsToMany(Exam, { through: ExamQuestion, foreignKey: 'questionId', otherKey: 'examId' });
  
  // Class - User
  Class.hasMany(User, { foreignKey: 'classId' });
  User.belongsTo(Class, { foreignKey: 'classId' });
  
  // Class - Subject (Many-to-Many)
  Class.belongsToMany(Subject, { through: ClassSubject, foreignKey: 'classId', otherKey: 'subjectId' });
  Subject.belongsToMany(Class, { through: ClassSubject, foreignKey: 'subjectId', otherKey: 'classId' });

  // Assignment ↔ Subject
  Assignment.belongsTo(Subject,     { foreignKey: 'subjectId' });
  Subject.hasMany(Assignment,       { foreignKey: 'subjectId' });

  // Assignment ↔ Teacher (User)
  Assignment.belongsTo(User,        { foreignKey: 'createdBy', as: 'teacher' });
  User.hasMany(Assignment,          { foreignKey: 'createdBy', as: 'createdAssignments' });

  // Submission ↔ Assignment
  Submission.belongsTo(Assignment,  { foreignKey: 'assignmentId' });
  Assignment.hasMany(Submission,    { foreignKey: 'assignmentId' });

  // Submission ↔ Student (User)
  Submission.belongsTo(User,        { foreignKey: 'studentId', as: 'student' });
  User.hasMany(Submission,          { foreignKey: 'studentId', as: 'submissions' });

  Assignment.belongsTo(Class, { foreignKey: 'classId' });
  Class.hasMany(Assignment,   { foreignKey: 'classId' });
  
  console.log('✅ All database associations established');
};

module.exports = setupAssociations;
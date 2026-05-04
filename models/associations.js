// const Subject = require('./Subject');
// const Question = require('./Question');
// const Exam = require('./Exam');
// const ExamQuestion = require('./ExamQuestion');
// const ExamResult = require('./ExamResult');
// const StudentAnswer = require('./StudentAnswer');
// const User = require('./User');

// const setupAssociations = () => {
//   // Subject - Question
//   Subject.hasMany(Question, { foreignKey: 'subjectId' });
//   Question.belongsTo(Subject, { foreignKey: 'subjectId' });
  
//   // Subject - Exam
//   Subject.hasMany(Exam, { foreignKey: 'subjectId' });
//   Exam.belongsTo(Subject, { foreignKey: 'subjectId' });
  
//   // Exam - Question (Many-to-Many)
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
  
//   // Exam - ExamResult (One-to-Many)
//   Exam.hasMany(ExamResult, { foreignKey: 'examId' });
//   ExamResult.belongsTo(Exam, { foreignKey: 'examId' });
  
//   // User (Student) - ExamResult
//   User.hasMany(ExamResult, { foreignKey: 'studentId' });
//   ExamResult.belongsTo(User, { foreignKey: 'studentId' });
  
//   // ExamResult - StudentAnswer
//   ExamResult.hasMany(StudentAnswer, { foreignKey: 'resultId' });
//   StudentAnswer.belongsTo(ExamResult, { foreignKey: 'resultId' });
  
//   console.log('✅ All database associations established');
// };

// module.exports = setupAssociations;

const Subject = require('./Subject');
const Question = require('./Question');
const Exam = require('./Exam');
const ExamQuestion = require('./ExamQuestion');
// បិទ ExamResult និង StudentAnswer សិន
// const ExamResult = require('./ExamResult');
// const StudentAnswer = require('./StudentAnswer');
// const User = require('./User');

const setupAssociations = () => {
  // Subject - Question
  Subject.hasMany(Question, { foreignKey: 'subjectId' });
  Question.belongsTo(Subject, { foreignKey: 'subjectId' });
  
  // Subject - Exam
  Subject.hasMany(Exam, { foreignKey: 'subjectId' });
  Exam.belongsTo(Subject, { foreignKey: 'subjectId' });
  
  // Exam - Question (Many-to-Many)
  Exam.belongsToMany(Question, { 
    through: ExamQuestion, 
    foreignKey: 'examId',
    otherKey: 'questionId'
  });
  Question.belongsToMany(Exam, { 
    through: ExamQuestion, 
    foreignKey: 'questionId',
    otherKey: 'examId'
  });
  
  // បិទ ExamResult associations សិន
  // Exam.hasMany(ExamResult, { foreignKey: 'examId' });
  // ExamResult.belongsTo(Exam, { foreignKey: 'examId' });
  // User.hasMany(ExamResult, { foreignKey: 'studentId' });
  // ExamResult.belongsTo(User, { foreignKey: 'studentId' });
  
  console.log('✅ Database associations established (without ExamResult)');
};

module.exports = setupAssociations;
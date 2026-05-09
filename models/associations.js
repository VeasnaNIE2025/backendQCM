
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
const User = require('./User');
const ClassSubject = require('./ClassSubject');



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
  
  // ✅ Class - Subject (Many-to-Many through ClassSubject)
  Class.belongsToMany(Subject, { through: ClassSubject, foreignKey: 'classId', otherKey: 'subjectId' });
  Subject.belongsToMany(Class, { through: ClassSubject, foreignKey: 'subjectId', otherKey: 'classId' });
  
  console.log('✅ All database associations established (including Class-Subject)');
};

module.exports = setupAssociations;
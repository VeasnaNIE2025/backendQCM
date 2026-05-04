const mongoose = require('mongoose');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Question = require('../models/Question');
const dotenv = require('dotenv');

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // 1. Clear existing data
    await User.deleteMany();
    await Subject.deleteMany();
    await Question.deleteMany();
    
    // 2. Create Admin
    const admin = await User.create({
      username: 'admin',
      email: 'admin@qcm.com',
      password: 'admin123',
      fullName: 'អ្នកគ្រប់គ្រងប្រព័ន្ធ',
      role: 'admin'
    });
    console.log('✅ Admin created');
    
    // 3. Create Subject
    const subject = await Subject.create({
      name: 'កម្មវិធី JavaScript',
      description: 'មូលដ្ឋានគ្រឹះ JavaScript សម្រាប់អ្នកចាប់ផ្តើម',
      isActive: true
    });
    console.log('✅ Subject created');
    
    // 4. Create Questions
    const questions = await Question.create([
      {
        subjectId: subject._id,
        questionText: 'តើ JavaScript ជាភាសាអ្វី?',
        options: ['កម្មវិធីកុំព្យូទ័រ', 'កម្មវិធីសរសេរ Script', 'កម្មវិធីតុបតែង', 'កម្មវិធីត្រួតពិនិត្យ'],
        correctAnswer: 1,
        explanation: 'JavaScript គឺជាភាសាសរសេរ Script ដែលប្រើសម្រាប់បង្កើតគេហទំព័រអន្តរកម្ម',
        difficulty: 'easy',
        points: 1
      },
      {
        subjectId: subject._id,
        questionText: 'តើកូដ alert("Hello") ធ្វើអ្វី?',
        options: ['បង្ហាញ Hello ក្នុង Console', 'បង្ហាញ Hello ក្នុង Popup', 'បោះពុម្ព Hello', 'រក្សាទុក Hello'],
        correctAnswer: 1,
        explanation: 'alert() ប្រើសម្រាប់បង្ហាញប្រអប់សារជូនអ្នកប្រើ',
        difficulty: 'easy',
        points: 1
      }
    ]);
    console.log(`✅ ${questions.length} questions created`);
    
    console.log('\n📊 Database Seeded Successfully!');
    console.log(`📧 Admin Email: admin@qcm.com`);
    console.log(`🔑 Admin Password: admin123`);
    
    process.exit();
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
const { sequelize } = require('../config/db');
const ExcelJS = require('exceljs');

// Export exam results to Excel
const exportExamResults = async (req, res) => {
  try {
    const { examId } = req.query;
    let whereClause = '';
    let replacements = {};
    
    if (examId) {
      whereClause = 'WHERE er.examId = :examId';
      replacements.examId = examId;
    }
    
    const results = await sequelize.query(
      `SELECT er.*, u.fullName as studentName, u.email as studentEmail, e.title as examTitle, e.totalPoints
       FROM exam_results er
       JOIN users u ON er.studentId = u.id
       JOIN exams e ON er.examId = e.id
       ${whereClause}
       ORDER BY er.submittedAt DESC`,
      {
        replacements: replacements,
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('លទ្ធផលប្រឡង');
    
    // Define columns
    worksheet.columns = [
      { header: 'លេខរៀង', key: 'index', width: 10 },
      { header: 'ឈ្មោះសិស្ស', key: 'studentName', width: 25 },
      { header: 'អ៊ីមែល', key: 'studentEmail', width: 30 },
      { header: 'ការប្រឡង', key: 'examTitle', width: 30 },
      { header: 'ពិន្ទុដែលទទួលបាន', key: 'totalScore', width: 20 },
      { header: 'ពិន្ទុសរុប', key: 'totalPoints', width: 15 },
      { header: 'ភាគរយ', key: 'percentage', width: 15 },
      { header: 'លទ្ធផល', key: 'result', width: 15 },
      { header: 'ថ្ងៃប្រឡង', key: 'submittedAt', width: 25 }
    ];
    
    // Style header row
    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F81BD' }
    };
    worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' } };
    
    // Add data rows
    results.forEach((result, index) => {
      const percentage = parseFloat(result.percentage).toFixed(2);
      const status = percentage >= 70 ? 'ជាប់' : (percentage >= 50 ? 'មធ្យម' : 'ធ្លាក់');
      
      worksheet.addRow({
        index: index + 1,
        studentName: result.studentName,
        studentEmail: result.studentEmail,
        examTitle: result.examTitle,
        totalScore: result.totalScore,
        totalPoints: result.totalPoints,
        percentage: `${percentage}%`,
        result: status,
        submittedAt: new Date(result.submittedAt).toLocaleString('km-KH')
      });
    });
    
    // Add border to all cells
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=exam_results_${Date.now()}.xlsx`);
    
    // Write to response
    await workbook.xlsx.write(res);
    res.end();
    
  } catch (error) {
    console.error('Error exporting exam results:', error);
    res.status(500).json({ message: error.message });
  }
};

// Export student performance to Excel
const exportStudentPerformance = async (req, res) => {
  try {
    const results = await sequelize.query(
      `SELECT u.id, u.fullName, u.email, 
              COUNT(er.id) as totalExamsTaken,
              SUM(er.totalScore) as totalScore,
              SUM(e.totalPoints) as totalPossible,
              AVG(er.percentage) as averagePercentage
       FROM users u
       LEFT JOIN exam_results er ON u.id = er.studentId AND er.status = 'completed'
       LEFT JOIN exams e ON er.examId = e.id
       WHERE u.role = 'student'
       GROUP BY u.id, u.fullName, u.email
       ORDER BY averagePercentage DESC`,
      { type: sequelize.QueryTypes.SELECT }
    );
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('ដំណើរការសិស្ស');
    
    worksheet.columns = [
      { header: 'លេខរៀង', key: 'index', width: 10 },
      { header: 'ឈ្មោះសិស្ស', key: 'fullName', width: 25 },
      { header: 'អ៊ីមែល', key: 'email', width: 30 },
      { header: 'ចំនួនប្រឡង', key: 'totalExamsTaken', width: 15 },
      { header: 'ពិន្ទុសរុប', key: 'totalScore', width: 15 },
      { header: 'ពិន្ទុសរុបដែលអាចបាន', key: 'totalPossible', width: 20 },
      { header: 'មធ្យមភាគរយ', key: 'averagePercentage', width: 15 },
      { header: 'កម្រិត', key: 'level', width: 15 }
    ];
    
    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F81BD' }
    };
    worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' } };
    
    results.forEach((student, index) => {
      const avg = parseFloat(student.averagePercentage) || 0;
      const level = avg >= 70 ? 'ពូកែ' : (avg >= 50 ? 'ល្អ' : 'ត្រូវការកែលម្អ');
      
      worksheet.addRow({
        index: index + 1,
        fullName: student.fullName,
        email: student.email,
        totalExamsTaken: student.totalExamsTaken || 0,
        totalScore: student.totalScore || 0,
        totalPossible: student.totalPossible || 0,
        averagePercentage: `${avg.toFixed(2)}%`,
        level: level
      });
    });
    
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=student_performance_${Date.now()}.xlsx`);
    
    await workbook.xlsx.write(res);
    res.end();
    
  } catch (error) {
    console.error('Error exporting student performance:', error);
    res.status(500).json({ message: error.message });
  }
};

// Export subject performance to Excel
const exportSubjectPerformance = async (req, res) => {
  try {
    const results = await sequelize.query(
      `SELECT s.id, s.name as subjectName,
              COUNT(DISTINCT er.id) as totalExams,
              COUNT(DISTINCT er.studentId) as totalStudents,
              AVG(er.percentage) as averageScore
       FROM subjects s
       LEFT JOIN exams e ON s.id = e.subjectId
       LEFT JOIN exam_results er ON e.id = er.examId AND er.status = 'completed'
       GROUP BY s.id, s.name
       ORDER BY averageScore DESC`,
      { type: sequelize.QueryTypes.SELECT }
    );
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('ដំណើរការមុខវិជ្ជា');
    
    worksheet.columns = [
      { header: 'លេខរៀង', key: 'index', width: 10 },
      { header: 'មុខវិជ្ជា', key: 'subjectName', width: 25 },
      { header: 'ចំនួនការប្រឡង', key: 'totalExams', width: 18 },
      { header: 'ចំនួនសិស្សចូលរួម', key: 'totalStudents', width: 20 },
      { header: 'ពិន្ទុមធ្យម', key: 'averageScore', width: 15 }
    ];
    
    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F81BD' }
    };
    worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' } };
    
    results.forEach((subject, index) => {
      worksheet.addRow({
        index: index + 1,
        subjectName: subject.subjectName,
        totalExams: subject.totalExams || 0,
        totalStudents: subject.totalStudents || 0,
        averageScore: `${(parseFloat(subject.averageScore) || 0).toFixed(2)}%`
      });
    });
    
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=subject_performance_${Date.now()}.xlsx`);
    
    await workbook.xlsx.write(res);
    res.end();
    
  } catch (error) {
    console.error('Error exporting subject performance:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  exportExamResults,
  exportStudentPerformance,
  exportSubjectPerformance
};
// const { sequelize } = require('../config/db');
// const ExcelJS = require('exceljs');
// const PDFDocument = require('pdfkit');
// const path = require('path');

// // ✅ Khmer font path
// const FONT      = path.join(__dirname, '../fonts/Battambang.ttf');
// const FONT_BOLD = path.join(__dirname, '../fonts/Battambang-Bold.ttf');

// // ── Excel Helpers ─────────────────────────────────────────────
// const headerStyle = (worksheet) => {
//   const row = worksheet.getRow(1);
//   row.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
//   row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } };
// };

// const addBorders = (worksheet) => {
//   worksheet.eachRow((row) => {
//     row.eachCell((cell) => {
//       cell.border = {
//         top: { style: 'thin' }, left: { style: 'thin' },
//         bottom: { style: 'thin' }, right: { style: 'thin' }
//       };
//     });
//   });
// };

// // ── Export exam results (Excel) ───────────────────────────────
// const exportExamResults = async (req, res) => {
//   try {
//     const { examId } = req.query;
//     let whereClause = '';
//     let replacements = {};
//     if (examId) { whereClause = 'WHERE er.examId = :examId'; replacements.examId = examId; }

//     const results = await sequelize.query(
//       `SELECT er.*, u.fullName as studentName, u.email as studentEmail,
//               c.name as className, e.title as examTitle, e.totalPoints
//        FROM exam_results er
//        JOIN  users u ON er.studentId = u.id
//        LEFT JOIN classes c ON u.classId = c.id
//        JOIN  exams e ON er.examId = e.id
//        ${whereClause}
//        ORDER BY er.submittedAt DESC`,
//       { replacements, type: sequelize.QueryTypes.SELECT }
//     );

//     const workbook  = new ExcelJS.Workbook();
//     const worksheet = workbook.addWorksheet('លទ្ធផលប្រឡង');

//     worksheet.columns = [
//       { header: 'លេខរៀង',          key: 'index',        width: 10 },
//       { header: 'ឈ្មោះសិស្ស',      key: 'studentName',  width: 25 },
//       { header: 'អ៊ីមែល',           key: 'studentEmail', width: 30 },
//       { header: 'ថ្នាក់',            key: 'className',    width: 15 },
//       { header: 'ការប្រឡង',         key: 'examTitle',    width: 30 },
//       { header: 'ពិន្ទុដែលទទួលបាន', key: 'totalScore',   width: 20 },
//       { header: 'ពិន្ទុសរុប',        key: 'totalPoints',  width: 15 },
//       { header: 'ភាគរយ',            key: 'percentage',   width: 15 },
//       { header: 'លទ្ធផល',           key: 'result',       width: 15 },
//       { header: 'ថ្ងៃប្រឡង',        key: 'submittedAt',  width: 25 }
//     ];

//     headerStyle(worksheet);

//     results.forEach((r, i) => {
//       const pct    = parseFloat(r.percentage).toFixed(2);
//       const status = pct >= 70 ? 'ជាប់' : pct >= 50 ? 'មធ្យម' : 'ធ្លាក់';
//       worksheet.addRow({
//         index: i + 1, studentName: r.studentName, studentEmail: r.studentEmail,
//         className: r.className || '—', examTitle: r.examTitle,
//         totalScore: r.totalScore, totalPoints: r.totalPoints,
//         percentage: `${pct}%`, result: status,
//         submittedAt: new Date(r.submittedAt).toLocaleString('km-KH')
//       });
//     });

//     addBorders(worksheet);
//     res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
//     res.setHeader('Content-Disposition', `attachment; filename=exam_results_${Date.now()}.xlsx`);
//     await workbook.xlsx.write(res);
//     res.end();
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ── Export student performance (Excel) ───────────────────────
// const exportStudentPerformance = async (req, res) => {
//   try {
//     const results = await sequelize.query(
//       `SELECT u.id, u.fullName, u.email, c.name as className,
//               COUNT(er.id) as totalExamsTaken, SUM(er.totalScore) as totalScore,
//               SUM(e.totalPoints) as totalPossible, AVG(er.percentage) as averagePercentage
//        FROM users u
//        LEFT JOIN classes c       ON u.classId = c.id
//        LEFT JOIN exam_results er ON u.id = er.studentId AND er.status = 'completed'
//        LEFT JOIN exams e         ON er.examId = e.id
//        WHERE u.role = 'student'
//        GROUP BY u.id, u.fullName, u.email, c.name
//        ORDER BY averagePercentage DESC`,
//       { type: sequelize.QueryTypes.SELECT }
//     );

//     const workbook  = new ExcelJS.Workbook();
//     const worksheet = workbook.addWorksheet('ដំណើរការសិស្ស');

//     worksheet.columns = [
//       { header: 'លេខរៀង',            key: 'index',             width: 10 },
//       { header: 'ឈ្មោះសិស្ស',        key: 'fullName',          width: 25 },
//       { header: 'អ៊ីមែល',             key: 'email',             width: 30 },
//       { header: 'ថ្នាក់',              key: 'className',         width: 15 },
//       { header: 'ចំនួនប្រឡង',         key: 'totalExamsTaken',   width: 15 },
//       { header: 'ពិន្ទុសរុប',          key: 'totalScore',        width: 15 },
//       { header: 'ពិន្ទុសរុបដែលអាចបាន', key: 'totalPossible',     width: 20 },
//       { header: 'មធ្យមភាគរយ',         key: 'averagePercentage', width: 15 },
//       { header: 'កម្រិត',              key: 'level',             width: 15 }
//     ];

//     headerStyle(worksheet);

//     results.forEach((s, i) => {
//       const avg   = parseFloat(s.averagePercentage) || 0;
//       const level = avg >= 70 ? 'ពូកែ' : avg >= 50 ? 'ល្អ' : 'ត្រូវការកែលម្អ';
//       worksheet.addRow({
//         index: i + 1, fullName: s.fullName, email: s.email,
//         className: s.className || '—', totalExamsTaken: s.totalExamsTaken || 0,
//         totalScore: s.totalScore || 0, totalPossible: s.totalPossible || 0,
//         averagePercentage: `${avg.toFixed(2)}%`, level
//       });
//     });

//     addBorders(worksheet);
//     res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
//     res.setHeader('Content-Disposition', `attachment; filename=student_performance_${Date.now()}.xlsx`);
//     await workbook.xlsx.write(res);
//     res.end();
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ── Export subject performance (Excel) ───────────────────────
// const exportSubjectPerformance = async (req, res) => {
//   try {
//     const results = await sequelize.query(
//       `SELECT s.id, s.name as subjectName,
//               COUNT(DISTINCT er.id) as totalExams,
//               COUNT(DISTINCT er.studentId) as totalStudents,
//               AVG(er.percentage) as averageScore
//        FROM subjects s
//        LEFT JOIN exams e         ON s.id = e.subjectId
//        LEFT JOIN exam_results er ON e.id = er.examId AND er.status = 'completed'
//        GROUP BY s.id, s.name
//        ORDER BY averageScore DESC`,
//       { type: sequelize.QueryTypes.SELECT }
//     );

//     const workbook  = new ExcelJS.Workbook();
//     const worksheet = workbook.addWorksheet('ដំណើរការមុខវិជ្ជា');

//     worksheet.columns = [
//       { header: 'លេខរៀង',         key: 'index',         width: 10 },
//       { header: 'មុខវិជ្ជា',        key: 'subjectName',   width: 25 },
//       { header: 'ចំនួនការប្រឡង',    key: 'totalExams',    width: 18 },
//       { header: 'ចំនួនសិស្សចូលរួម', key: 'totalStudents', width: 20 },
//       { header: 'ពិន្ទុមធ្យម',       key: 'averageScore',  width: 15 }
//     ];

//     headerStyle(worksheet);

//     results.forEach((s, i) => {
//       worksheet.addRow({
//         index: i + 1, subjectName: s.subjectName,
//         totalExams: s.totalExams || 0, totalStudents: s.totalStudents || 0,
//         averageScore: `${(parseFloat(s.averageScore) || 0).toFixed(2)}%`
//       });
//     });

//     addBorders(worksheet);
//     res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
//     res.setHeader('Content-Disposition', `attachment; filename=subject_performance_${Date.now()}.xlsx`);
//     await workbook.xlsx.write(res);
//     res.end();
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ── Export single exam result as PDF (with Khmer font) ────────
// const exportExamResultPDF = async (req, res) => {
//   try {
//     const { resultId } = req.params;

//     const result = await sequelize.query(
//       `SELECT er.*,
//               u.fullName as studentName, u.email as studentEmail, u.username,
//               c.name as className,
//               e.title as examTitle, e.totalPoints, e.duration,
//               s.name as subjectName
//        FROM exam_results er
//        JOIN users u    ON er.studentId = u.id
//        LEFT JOIN classes c ON u.classId = c.id
//        JOIN exams e    ON er.examId = e.id
//        JOIN subjects s ON e.subjectId = s.id
//        WHERE er.id = :resultId`,
//       { replacements: { resultId }, type: sequelize.QueryTypes.SELECT }
//     );

//     if (!result || result.length === 0) {
//       return res.status(404).json({ message: 'Result not found' });
//     }

//     const data = result[0];

//     const answers = await sequelize.query(
//       `SELECT sa.selectedOption, sa.isCorrect, sa.pointsEarned,
//               q.questionText, q.correctAnswer, q.points,
//               q.option_a, q.option_b, q.option_c, q.option_d
//        FROM student_answers sa
//        JOIN questions q ON sa.questionId = q.id
//        WHERE sa.resultId = :resultId
//        ORDER BY sa.id ASC`,
//       { replacements: { resultId }, type: sequelize.QueryTypes.SELECT }
//     );

//     const doc = new PDFDocument({ margin: 50, size: 'A4' });

//     // ✅ Register Khmer font
//     doc.registerFont('Khmer', FONT);
//     // Register Bold — fallback to Regular if Bold file not found
//     try {
//       doc.registerFont('Khmer-Bold', FONT_BOLD);
//     } catch {
//       doc.registerFont('Khmer-Bold', FONT);
//     }

//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition',
//       `attachment; filename="exam_result_${data.id}_${Date.now()}.pdf"`);

//     doc.pipe(res);

//     // ── Header (ទម្រង់ក្រសួង) ──────────────────────────────
//     const headerTopY = 50;

//     // ── ឆ្វេង: Logo + ឈ្មោះស្ថាប័ន ──
//     const logoPath = path.join(__dirname, '../assets/logo.png');
//     try {
//       doc.image(logoPath, 55, headerTopY, { width: 65 });
//     } catch {
//       // no logo — draw placeholder circle
//       doc.circle(87, headerTopY + 32, 30).stroke('#cccccc');
//     }
//     doc.font('Khmer').fontSize(10)
//        .text('វិចប.ព្រះនរោត្តមសីហមុនី', 50, headerTopY + 70, { width: 130, align: 'center' });

//     // ── ស្ដាំ: ព្រះរាជាណាចក្រ ──
//     doc.font('Khmer-Bold').fontSize(12)
//        .text('ព្រះរាជាណាចក្រកម្ពុជា', 320, headerTopY + 5, { width: 220, align: 'center' });
//     doc.font('Khmer').fontSize(11)
//        .text('ជាតិ  សាសនា  ព្រះមហាក្សត្រ', 320, headerTopY + 25, { width: 220, align: 'center' });
//     // underline
//     doc.moveTo(340, headerTopY + 48).lineTo(530, headerTopY + 48).lineWidth(1).stroke('#333');

//     // ── កណ្ដាល: Title ──
//     doc.font('Helvetica-Bold').fontSize(15)
//        .text('QCM Examination System', 50, headerTopY + 85, { width: 495, align: 'center' });
//     doc.font('Khmer-Bold').fontSize(13)
//        .text('របាយការណ៍លទ្ធផលប្រឡង', 50, headerTopY + 108, { width: 495, align: 'center' });

//     // ── Divider ──
//     doc.moveDown(0.3);
//     const divY = headerTopY + 132;
//     doc.moveTo(50, divY).lineTo(545, divY).lineWidth(1.5).stroke('#333333');
//     doc.y = divY + 10;

//     // ── Student Info ─────────────────────────────────────────
//     doc.font('Khmer').fontSize(11);

//     const L = 50, R = 300; // left and right columns
//     const drawRow = (label1, val1, label2, val2) => {
//       const y = doc.y;
//       doc.font('Khmer-Bold').text(`${label1}:`, L, y, { width: 80, continued: false });
//       doc.font('Khmer').text(val1 || '—', L + 85, y, { width: 180 });
//       if (label2) {
//         doc.font('Khmer-Bold').text(`${label2}:`, R, y, { width: 80, continued: false });
//         doc.font('Khmer').text(val2 || '—', R + 85, y, { width: 160 });
//       }
//       doc.moveDown(1.2);
//     };

//     drawRow('ឈ្មោះសិស្ស', data.studentName,  'ថ្នាក់',    data.className || '—');
//     drawRow('អ៊ីមែល',      data.studentEmail, 'មុខវិជ្ជា', data.subjectName);
//     drawRow('ការប្រឡង',    data.examTitle,    'រយៈពេល',   `${data.duration} នាទី`);
//     drawRow('ថ្ងៃប្រឡង',   new Date(data.submittedAt).toLocaleDateString('en-GB'), '', '');

//     doc.moveDown(0.5);
//     doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
//     doc.moveDown(0.5);

//     // ── Score Box ────────────────────────────────────────────
//     const pct    = parseFloat(data.percentage).toFixed(1);
//     const pctNum = parseFloat(pct);
//     // ✅ ៣ កម្រិត — ជាប់ / មធ្យម / ធ្លាក់
//     const resultLabel = pctNum >= 70 ? 'ជាប់' : pctNum >= 50 ? 'មធ្យម' : 'ធ្លាក់';
//     const resultColor = pctNum >= 70 ? '#28a745' : pctNum >= 50 ? '#f39c12' : '#dc3545';
//     const boxBg       = pctNum >= 70 ? '#e8f5e9' : pctNum >= 50 ? '#fff8e1' : '#ffebee';
//     const boxY   = doc.y;

//     doc.rect(50, boxY, 495, 55)
//        .fillAndStroke(boxBg, resultColor);
//     doc.fillColor('black');

//     doc.font('Khmer-Bold').fontSize(13)
//        .text(`${data.totalScore} / ${data.totalPoints} ពិន្ទុ`, 65, boxY + 10);

//     doc.font('Khmer-Bold').fontSize(20)
//        .text(`${pct}%`, 260, boxY + 8, { continued: true });

//     doc.font('Khmer').fontSize(14)
//        .text(`  >> ${resultLabel}`, { continued: false });

//     doc.moveDown(3.5);
//     doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
//     doc.moveDown(0.5);

//     // ── Answer Table ─────────────────────────────────────────
//     doc.font('Khmer-Bold').fontSize(11).fillColor('black')
//        .text('ចម្លើយលម្អិត');
//     doc.moveDown(0.3);

//     // Table header
//     const thY = doc.y;
//     doc.rect(50, thY, 495, 24).fill('#4F81BD');
//     doc.fillColor('white').font('Khmer-Bold').fontSize(11);

//     doc.text('ល.រ',       55,  thY + 6, { width: 25 });
//     doc.text('សំណួរ',      82,  thY + 6, { width: 215 });
//     doc.text('ចម្លើយ',     300, thY + 6, { width: 55 });
//     doc.text('ត្រឹមត្រូវ',  358, thY + 6, { width: 60 });
//     doc.text('លទ្ធផល',    422, thY + 6, { width: 55 });
//     doc.text('ពិន្ទុ',     480, thY + 6, { width: 55 });

//     doc.fillColor('black');
//     doc.moveDown(1.8);

//     // Rows
//     answers.forEach((ans, i) => {
//       if (doc.y > 700) {
//         doc.addPage();
//         doc.moveDown(0.5);
//       }

//       const rowY      = doc.y;
//       const isCorrect = ans.isCorrect === 1 || ans.isCorrect === true;
//       const bg        = i % 2 === 0 ? '#f0f4ff' : '#ffffff';

//       doc.rect(50, rowY, 495, 22).fill(bg);
//       doc.fillColor('black').font('Khmer').fontSize(10);

//       const qShort = (ans.questionText || '').length > 55
//         ? ans.questionText.substring(0, 52) + '...'
//         : (ans.questionText || '');

//       doc.text(`${i + 1}`,                                  55,  rowY + 5, { width: 25 });
//       doc.text(qShort,                                       82,  rowY + 5, { width: 215 });
//       doc.text((ans.selectedOption || '—').toUpperCase(),    300, rowY + 5, { width: 55 });
//       doc.text(ans.correctAnswer.toUpperCase(),              358, rowY + 5, { width: 60 });

//       // ✅ ៣ កម្រិត
//       const rowResult = isCorrect ? 'ជាប់' : 'ធ្លាក់';
//       const rowColor  = isCorrect ? '#1a7a3a' : '#c0392b';

//       doc.fillColor(rowColor)
//          .font('Khmer-Bold').fontSize(10)
//          .text(rowResult,                                       422, rowY + 5, { width: 55 });

//       doc.fillColor('black').font('Khmer').fontSize(10)
//          .text(`${ans.pointsEarned}/${ans.points}`,          480, rowY + 5, { width: 55 });

//       doc.moveDown(1.6);
//     });

//     // ── Footer ───────────────────────────────────────────────
//     doc.moveDown(1);
//     doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
//     doc.moveDown(0.5);
//     doc.font('Khmer').fontSize(10).fillColor('#888888')
//        .text('រៀបចំដោយលោកគ្រូ ម៉ាន់ វាសនា', { align: 'center' })
//        .text(`កាលបរិច្ឆេទ: ${new Date().toLocaleDateString('en-GB')}`, { align: 'center' });

//     doc.end();

//   } catch (error) {
//     console.error('Error generating PDF:', error);
//     res.status(500).json({ message: 'មិនអាចបង្កើត PDF បានទេ', error: error.message });
//   }
// };

// module.exports = {
//   exportExamResults,
//   exportStudentPerformance,
//   exportSubjectPerformance,
//   exportExamResultPDF
// };


const { sequelize } = require('../config/db');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const path = require('path');

// ✅ Khmer Fonts
const FONT = path.join(__dirname, '../fonts/Battambang.ttf');
const FONT_BOLD = path.join(__dirname, '../fonts/Battambang-Bold.ttf');

// ── Excel Helpers ─────────────────────────────────────────────
const headerStyle = (worksheet) => {
  const row = worksheet.getRow(1);
  row.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
  row.alignment = { vertical: 'middle', horizontal: 'center' };
};

const addBorders = (worksheet) => {
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
};

// ── Export Exam Results (Excel) ───────────────────────────────
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
      `SELECT er.*, u.fullName as studentName, u.email as studentEmail,
              c.name as className, e.title as examTitle, e.totalPoints
       FROM exam_results er
       JOIN users u ON er.studentId = u.id
       LEFT JOIN classes c ON u.classId = c.id
       JOIN exams e ON er.examId = e.id
       ${whereClause}
       ORDER BY er.submittedAt DESC`,
      { replacements, type: sequelize.QueryTypes.SELECT }
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('លទ្ធផលប្រឡង');

    worksheet.columns = [
      { header: 'លេខរៀង', width: 10 },
      { header: 'ឈ្មោះសិស្ស', width: 28 },
      { header: 'អ៊ីមែល', width: 32 },
      { header: 'ថ្នាក់', width: 15 },
      { header: 'ការប្រឡង', width: 35 },
      { header: 'ពិន្ទុទទួលបាន', width: 18 },
      { header: 'ពិន្ទុសរុប', width: 15 },
      { header: 'ភាគរយ', width: 15 },
      { header: 'លទ្ធផល', width: 15 },
      { header: 'ថ្ងៃប្រឡង', width: 25 }
    ];

    headerStyle(worksheet);

    results.forEach((r, i) => {
      const pct = parseFloat(r.percentage || 0).toFixed(2);
      const status = pct >= 70 ? 'ជាប់' : pct >= 50 ? 'មធ្យម' : 'ធ្លាក់';

      worksheet.addRow({
        index: i + 1,
        studentName: r.studentName,
        studentEmail: r.studentEmail,
        className: r.className || '—',
        examTitle: r.examTitle,
        totalScore: r.totalScore,
        totalPoints: r.totalPoints,
        percentage: `${pct}%`,
        result: status,
        submittedAt: new Date(r.submittedAt).toLocaleString('km-KH')
      });
    });

    addBorders(worksheet);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=exam_results_${Date.now()}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ── Export Student Performance (Excel) ───────────────────────
const exportStudentPerformance = async (req, res) => {
  try {
    const results = await sequelize.query(
      `SELECT u.id, u.fullName, u.email, c.name as className,
              COUNT(er.id) as totalExamsTaken, 
              SUM(er.totalScore) as totalScore,
              SUM(e.totalPoints) as totalPossible, 
              AVG(er.percentage) as averagePercentage
       FROM users u
       LEFT JOIN classes c ON u.classId = c.id
       LEFT JOIN exam_results er ON u.id = er.studentId AND er.status = 'completed'
       LEFT JOIN exams e ON er.examId = e.id
       WHERE u.role = 'student'
       GROUP BY u.id, u.fullName, u.email, c.name
       ORDER BY averagePercentage DESC`,
      { type: sequelize.QueryTypes.SELECT }
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('ដំណើរការសិស្ស');

    worksheet.columns = [
      { header: 'លេខរៀង', width: 10 },
      { header: 'ឈ្មោះសិស្ស', width: 28 },
      { header: 'អ៊ីមែល', width: 32 },
      { header: 'ថ្នាក់', width: 15 },
      { header: 'ចំនួនប្រឡង', width: 15 },
      { header: 'ពិន្ទុសរុប', width: 18 },
      { header: 'ពិន្ទុសរុបដែលអាចបាន', width: 22 },
      { header: 'មធ្យមភាគរយ', width: 18 },
      { header: 'កម្រិត', width: 18 }
    ];

    headerStyle(worksheet);

    results.forEach((s, i) => {
      const avg = parseFloat(s.averagePercentage) || 0;
      const level = avg >= 70 ? 'ពូកែ' : avg >= 50 ? 'ល្អ' : 'ត្រូវការកែលម្អ';

      worksheet.addRow({
        index: i + 1,
        fullName: s.fullName,
        email: s.email,
        className: s.className || '—',
        totalExamsTaken: s.totalExamsTaken || 0,
        totalScore: s.totalScore || 0,
        totalPossible: s.totalPossible || 0,
        averagePercentage: `${avg.toFixed(2)}%`,
        level
      });
    });

    addBorders(worksheet);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=student_performance_${Date.now()}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Export Subject Performance (Excel) ───────────────────────
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
      { header: 'លេខរៀង', width: 10 },
      { header: 'មុខវិជ្ជា', width: 30 },
      { header: 'ចំនួនការប្រឡង', width: 20 },
      { header: 'ចំនួនសិស្ស', width: 20 },
      { header: 'ពិន្ទុមធ្យម', width: 18 }
    ];

    headerStyle(worksheet);

    results.forEach((s, i) => {
      worksheet.addRow({
        index: i + 1,
        subjectName: s.subjectName,
        totalExams: s.totalExams || 0,
        totalStudents: s.totalStudents || 0,
        averageScore: `${(parseFloat(s.averageScore) || 0).toFixed(2)}%`
      });
    });

    addBorders(worksheet);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=subject_performance_${Date.now()}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Export Single Exam Result as Modern PDF ───────────────────
const exportExamResultPDF = async (req, res) => {
  try {
    const { resultId } = req.params;

    const result = await sequelize.query(
      `SELECT er.*, u.fullName as studentName, u.email as studentEmail,
              c.name as className, e.title as examTitle, e.totalPoints, 
              e.duration, s.name as subjectName
       FROM exam_results er
       JOIN users u ON er.studentId = u.id
       LEFT JOIN classes c ON u.classId = c.id
       JOIN exams e ON er.examId = e.id
       JOIN subjects s ON e.subjectId = s.id
       WHERE er.id = :resultId`,
      { replacements: { resultId }, type: sequelize.QueryTypes.SELECT }
    );

    if (!result || result.length === 0) {
      return res.status(404).json({ message: 'Result not found' });
    }

    const data = result[0];

    const answers = await sequelize.query(
      `SELECT sa.selectedOption, sa.isCorrect, sa.pointsEarned,
              q.questionText, q.correctAnswer, q.points,
              q.option_a, q.option_b, q.option_c, q.option_d
       FROM student_answers sa
       JOIN questions q ON sa.questionId = q.id
       WHERE sa.resultId = :resultId
       ORDER BY sa.id ASC`,
      { replacements: { resultId }, type: sequelize.QueryTypes.SELECT }
    );

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    doc.registerFont('Khmer', FONT);
    doc.registerFont('Khmer-Bold', FONT_BOLD);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="លទ្ធផល_${data.studentName}_${Date.now()}.pdf"`);

    doc.pipe(res);

    // Header
    const headerY = 45;
    const logoPath = path.join(__dirname, '../assets/logo.png');

    try {
      doc.image(logoPath, 50, headerY, { width: 70 });
    } catch (e) {
      doc.rect(50, headerY, 70, 70).fill('#f1f5f9').stroke();
    }

    doc.font('Khmer-Bold').fontSize(14)
       .fillColor('#1e3a8a')
       .text('ព្រះរាជាណាចក្រកម្ពុជា', 380, headerY + 12, { align: 'center', width: 180 });

    doc.font('Khmer').fontSize(11)
       .fillColor('#334155')
       .text('ជាតិ  សាសនា  ព្រះមហាក្សត្រ', 380, headerY + 34, { align: 'center', width: 180 });

    doc.font('Khmer-Bold').fontSize(18)
       .fillColor('#1e40af')
       .text('របាយការណ៍លទ្ធផលប្រឡង', 0, headerY + 78, { align: 'center', width: doc.page.width });

    doc.moveTo(50, headerY + 118)
       .lineTo(545, headerY + 118)
       .lineWidth(3)
       .strokeColor('#3b82f6')
       .stroke();

    doc.y = headerY + 140;

    // Student Information
    doc.font('Khmer').fontSize(11).fillColor('#1f2937');

    const drawInfo = (label, value, label2 = '', value2 = '') => {
      const y = doc.y;
      doc.font('Khmer-Bold').text(label + ': ', 50, y, { width: 95 });
      doc.font('Khmer').text(value || '—', 145, y);

      if (label2) {
        doc.font('Khmer-Bold').text(label2 + ': ', 320, y, { width: 85 });
        doc.font('Khmer').text(value2 || '—', 405, y);
      }
      doc.moveDown(1.4);
    };

    drawInfo('ឈ្មោះសិស្ស', data.studentName, 'ថ្នាក់', data.className || '—');
    drawInfo('អ៊ីមែល', data.studentEmail, 'មុខវិជ្ជា', data.subjectName);
    drawInfo('ការប្រឡង', data.examTitle, 'ថ្ងៃប្រឡង', new Date(data.submittedAt).toLocaleDateString('km-KH'));

    doc.moveDown(1);

    // Score Card
    const percentage = parseFloat(data.percentage).toFixed(1);
    const scoreNum = parseFloat(percentage);
    const status = scoreNum >= 70 ? 'ជាប់' : scoreNum >= 50 ? 'មធ្យម' : 'ធ្លាក់';
    const color = scoreNum >= 70 ? '#22c55e' : scoreNum >= 50 ? '#eab308' : '#ef4444';

    const cardY = doc.y;
    doc.rect(50, cardY, 495, 95).fillAndStroke('#f8fafc', '#e2e8f0');

    // Circle
    doc.circle(115, cardY + 47, 38).fill('#ffffff').stroke(color, 10);
    doc.font('Khmer-Bold').fontSize(29)
       .fillColor(color)
       .text(percentage + '%', 82, cardY + 30, { width: 65, align: 'center' });

    doc.font('Khmer-Bold').fontSize(23)
       .fillColor('#1e2937')
       .text(`${data.totalScore} / ${data.totalPoints}`, 190, cardY + 28);

    doc.font('Khmer').fontSize(13)
       .fillColor('#64748b')
       .text('ពិន្ទុសរុប', 190, cardY + 55);

    // Status Badge
    doc.rect(380, cardY + 28, 145, 48)
       .fill(color)
       .rounded(10);

    doc.fillColor('#ffffff')
       .font('Khmer-Bold')
       .fontSize(19)
       .text(status, 390, cardY + 38, { width: 125, align: 'center' });

    doc.moveDown(7);

    // Detailed Answers Table
    doc.font('Khmer-Bold').fontSize(13).fillColor('#1e40af')
       .text('លទ្ធផលលម្អិត');

    doc.moveDown(0.5);

    const thY = doc.y;
    doc.rect(50, thY, 495, 28).fill('#1e40af');
    doc.fillColor('#ffffff').font('Khmer-Bold').fontSize(10.5);

    const colX = [55, 85, 305, 375, 445, 490];
    const headers = ['ល.រ', 'សំណួរ', 'ចម្លើយសិស្ស', 'ចម្លើយត្រឹមត្រូវ', 'លទ្ធផល', 'ពិន្ទុ'];

    headers.forEach((text, i) => {
      doc.text(text, colX[i], thY + 9, { width: i === 1 ? 210 : 80 });
    });

    doc.fillColor('#1f2937');

    answers.forEach((ans, i) => {
      if (doc.y > 680) doc.addPage();

      const rowY = doc.y;
      const isCorrect = ans.isCorrect === 1 || ans.isCorrect === true;
      const bg = i % 2 === 0 ? '#f8fafc' : '#ffffff';

      doc.rect(50, rowY, 495, 27).fill(bg);

      const qShort = (ans.questionText || '').length > 58 
        ? (ans.questionText || '').substring(0, 55) + '...' 
        : (ans.questionText || '');

      doc.font('Khmer').fontSize(9.8);
      doc.text((i + 1).toString(), 57, rowY + 8);
      doc.text(qShort, 85, rowY + 8, { width: 210 });
      doc.text((ans.selectedOption || '—').toUpperCase(), 305, rowY + 8);
      doc.text((ans.correctAnswer || '').toUpperCase(), 375, rowY + 8);

      doc.font('Khmer-Bold').fontSize(10)
         .fillColor(isCorrect ? '#22c55e' : '#ef4444')
         .text(isCorrect ? 'ត្រឹមត្រូវ' : 'ខុស', 445, rowY + 8);

      doc.fillColor('#1f2937').font('Khmer').fontSize(10)
         .text(`${ans.pointsEarned}/${ans.points}`, 490, rowY + 8, { align: 'right', width: 45 });

      doc.moveDown(1.5);
    });

    // Footer
    const footerY = doc.page.height - 70;
    doc.font('Khmer').fontSize(9.5).fillColor('#64748b');
    doc.text('រៀបចំដោយ៖ លោកគ្រូ ម៉ាន់ វាសនា', 50, footerY, { align: 'center', width: 495 });
    doc.text(`កាលបរិច្ឆេទ៖ ${new Date().toLocaleDateString('km-KH')}`, 50, footerY + 15, { align: 'center', width: 495 });

    doc.end();

  } catch (error) {
    console.error('PDF Error:', error);
    res.status(500).json({ message: 'មិនអាចបង្កើត PDF បានទេ', error: error.message });
  }
};

module.exports = {
  exportExamResults,
  exportStudentPerformance,
  exportSubjectPerformance,
  exportExamResultPDF
};
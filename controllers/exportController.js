const { sequelize } = require('../config/db');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const path = require('path');

// ✅ Khmer font path
const FONT      = path.join(__dirname, '../fonts/Battambang.ttf');
const FONT_BOLD = path.join(__dirname, '../fonts/Battambang-Bold.ttf');

// ── Excel Helpers ─────────────────────────────────────────────
const headerStyle = (worksheet) => {
  const row = worksheet.getRow(1);
  row.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } };
};

const addBorders = (worksheet) => {
  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' }
      };
    });
  });
};

// ── Export exam results (Excel) ───────────────────────────────
const exportExamResults = async (req, res) => {
  try {
    const { examId } = req.query;
    let whereClause = '';
    let replacements = {};
    if (examId) { whereClause = 'WHERE er.examId = :examId'; replacements.examId = examId; }

    const results = await sequelize.query(
      `SELECT er.*, u.fullName as studentName, u.email as studentEmail,
              c.name as className, e.title as examTitle, e.totalPoints
       FROM exam_results er
       JOIN  users u ON er.studentId = u.id
       LEFT JOIN classes c ON u.classId = c.id
       JOIN  exams e ON er.examId = e.id
       ${whereClause}
       ORDER BY er.submittedAt DESC`,
      { replacements, type: sequelize.QueryTypes.SELECT }
    );

    const workbook  = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('លទ្ធផលប្រឡង');

    worksheet.columns = [
      { header: 'លេខរៀង',          key: 'index',        width: 10 },
      { header: 'ឈ្មោះសិស្ស',      key: 'studentName',  width: 25 },
      { header: 'អ៊ីមែល',           key: 'studentEmail', width: 30 },
      { header: 'ថ្នាក់',            key: 'className',    width: 15 },
      { header: 'ការប្រឡង',         key: 'examTitle',    width: 30 },
      { header: 'ពិន្ទុដែលទទួលបាន', key: 'totalScore',   width: 20 },
      { header: 'ពិន្ទុសរុប',        key: 'totalPoints',  width: 15 },
      { header: 'ភាគរយ',            key: 'percentage',   width: 15 },
      { header: 'លទ្ធផល',           key: 'result',       width: 15 },
      { header: 'ថ្ងៃប្រឡង',        key: 'submittedAt',  width: 25 }
    ];

    headerStyle(worksheet);

    results.forEach((r, i) => {
      const pct    = parseFloat(r.percentage).toFixed(2);
      const status = pct >= 70 ? 'ជាប់' : pct >= 50 ? 'មធ្យម' : 'ធ្លាក់';
      worksheet.addRow({
        index: i + 1, studentName: r.studentName, studentEmail: r.studentEmail,
        className: r.className || '—', examTitle: r.examTitle,
        totalScore: r.totalScore, totalPoints: r.totalPoints,
        percentage: `${pct}%`, result: status,
        submittedAt: new Date(r.submittedAt).toLocaleString('km-KH')
      });
    });

    addBorders(worksheet);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=exam_results_${Date.now()}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Export student performance (Excel) ───────────────────────
const exportStudentPerformance = async (req, res) => {
  try {
    const results = await sequelize.query(
      `SELECT u.id, u.fullName, u.email, c.name as className,
              COUNT(er.id) as totalExamsTaken, SUM(er.totalScore) as totalScore,
              SUM(e.totalPoints) as totalPossible, AVG(er.percentage) as averagePercentage
       FROM users u
       LEFT JOIN classes c       ON u.classId = c.id
       LEFT JOIN exam_results er ON u.id = er.studentId AND er.status = 'completed'
       LEFT JOIN exams e         ON er.examId = e.id
       WHERE u.role = 'student'
       GROUP BY u.id, u.fullName, u.email, c.name
       ORDER BY averagePercentage DESC`,
      { type: sequelize.QueryTypes.SELECT }
    );

    const workbook  = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('ដំណើរការសិស្ស');

    worksheet.columns = [
      { header: 'លេខរៀង',            key: 'index',             width: 10 },
      { header: 'ឈ្មោះសិស្ស',        key: 'fullName',          width: 25 },
      { header: 'អ៊ីមែល',             key: 'email',             width: 30 },
      { header: 'ថ្នាក់',              key: 'className',         width: 15 },
      { header: 'ចំនួនប្រឡង',         key: 'totalExamsTaken',   width: 15 },
      { header: 'ពិន្ទុសរុប',          key: 'totalScore',        width: 15 },
      { header: 'ពិន្ទុសរុបដែលអាចបាន', key: 'totalPossible',     width: 20 },
      { header: 'មធ្យមភាគរយ',         key: 'averagePercentage', width: 15 },
      { header: 'កម្រិត',              key: 'level',             width: 15 }
    ];

    headerStyle(worksheet);

    results.forEach((s, i) => {
      const avg   = parseFloat(s.averagePercentage) || 0;
      const level = avg >= 70 ? 'ពូកែ' : avg >= 50 ? 'ល្អ' : 'ត្រូវការកែលម្អ';
      worksheet.addRow({
        index: i + 1, fullName: s.fullName, email: s.email,
        className: s.className || '—', totalExamsTaken: s.totalExamsTaken || 0,
        totalScore: s.totalScore || 0, totalPossible: s.totalPossible || 0,
        averagePercentage: `${avg.toFixed(2)}%`, level
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

// ── Export subject performance (Excel) ───────────────────────
const exportSubjectPerformance = async (req, res) => {
  try {
    const results = await sequelize.query(
      `SELECT s.id, s.name as subjectName,
              COUNT(DISTINCT er.id) as totalExams,
              COUNT(DISTINCT er.studentId) as totalStudents,
              AVG(er.percentage) as averageScore
       FROM subjects s
       LEFT JOIN exams e         ON s.id = e.subjectId
       LEFT JOIN exam_results er ON e.id = er.examId AND er.status = 'completed'
       GROUP BY s.id, s.name
       ORDER BY averageScore DESC`,
      { type: sequelize.QueryTypes.SELECT }
    );

    const workbook  = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('ដំណើរការមុខវិជ្ជា');

    worksheet.columns = [
      { header: 'លេខរៀង',         key: 'index',         width: 10 },
      { header: 'មុខវិជ្ជា',        key: 'subjectName',   width: 25 },
      { header: 'ចំនួនការប្រឡង',    key: 'totalExams',    width: 18 },
      { header: 'ចំនួនសិស្សចូលរួម', key: 'totalStudents', width: 20 },
      { header: 'ពិន្ទុមធ្យម',       key: 'averageScore',  width: 15 }
    ];

    headerStyle(worksheet);

    results.forEach((s, i) => {
      worksheet.addRow({
        index: i + 1, subjectName: s.subjectName,
        totalExams: s.totalExams || 0, totalStudents: s.totalStudents || 0,
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

// ── Export single exam result as PDF (with Khmer font) ────────
const exportExamResultPDF = async (req, res) => {
  try {
    const { resultId } = req.params;

    const result = await sequelize.query(
      `SELECT er.*,
              u.fullName as studentName, u.email as studentEmail, u.username,
              c.name as className,
              e.title as examTitle, e.totalPoints, e.duration,
              s.name as subjectName
       FROM exam_results er
       JOIN users u    ON er.studentId = u.id
       LEFT JOIN classes c ON u.classId = c.id
       JOIN exams e    ON er.examId = e.id
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

    // ✅ Register Khmer font
    doc.registerFont('Khmer', FONT);
    // Register Bold — fallback to Regular if Bold file not found
    try {
      doc.registerFont('Khmer-Bold', FONT_BOLD);
    } catch {
      doc.registerFont('Khmer-Bold', FONT);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition',
      `attachment; filename="exam_result_${data.id}_${Date.now()}.pdf"`);

    doc.pipe(res);

    // ── Header ──────────────────────────────────────────────
    doc.font('Khmer-Bold').fontSize(16)
       .text('QCM Examination System', { align: 'center' });
    doc.font('Khmer').fontSize(12)
       .text('របាយការណ៍លទ្ធផលប្រឡង', { align: 'center' });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    // ── Student Info ─────────────────────────────────────────
    doc.font('Khmer').fontSize(10);

    const info = [
      ['ឈ្មោះសិស្ស',  data.studentName,  'ថ្នាក់',      data.className   || '—'],
      ['អ៊ីមែល',      data.studentEmail, 'មុខវិជ្ជា',   data.subjectName       ],
      ['ការប្រឡង',    data.examTitle,    'រយៈពេល',     `${data.duration} នាទី`],
      ['ថ្ងៃប្រឡង',   new Date(data.submittedAt).toLocaleDateString('en-GB'), '', '']
    ];

    info.forEach(([lbl1, val1, lbl2, val2]) => {
      const y = doc.y;
      doc.font('Khmer-Bold').text(`${lbl1}: `, 50, y, { continued: true, width: 60 });
      doc.font('Khmer').text(val1 || '', { continued: !!lbl2, width: 200 });
      if (lbl2) {
        doc.font('Khmer-Bold').text(`  ${lbl2}: `, { continued: true });
        doc.font('Khmer').text(val2 || '');
      }
    });

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    // ── Score Box ────────────────────────────────────────────
    const pct    = parseFloat(data.percentage).toFixed(1);
    const passed = parseFloat(pct) >= 70;
    const boxY   = doc.y;

    doc.rect(50, boxY, 495, 55)
       .fillAndStroke(passed ? '#e8f5e9' : '#ffebee', passed ? '#28a745' : '#dc3545');
    doc.fillColor('black');

    doc.font('Khmer-Bold').fontSize(13)
       .text(`${data.totalScore} / ${data.totalPoints} ពិន្ទុ`, 65, boxY + 10);

    doc.font('Khmer-Bold').fontSize(20)
       .text(`${pct}%`, 260, boxY + 8, { continued: true });

    doc.font('Khmer').fontSize(12)
       .text(`  ${passed ? '✓ ជាប់' : '✗ ធ្លាក់'}`, { continued: false });

    doc.moveDown(3.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    // ── Answer Table ─────────────────────────────────────────
    doc.font('Khmer-Bold').fontSize(11).fillColor('black')
       .text('ចម្លើយលម្អិត');
    doc.moveDown(0.3);

    // Table header
    const thY = doc.y;
    doc.rect(50, thY, 495, 20).fill('#4F81BD');
    doc.fillColor('white').font('Khmer-Bold').fontSize(9);

    doc.text('ល.រ',       55,  thY + 5, { width: 25 });
    doc.text('សំណួរ',      82,  thY + 5, { width: 220 });
    doc.text('ចម្លើយ',     305, thY + 5, { width: 60 });
    doc.text('ត្រឹមត្រូវ',  368, thY + 5, { width: 60 });
    doc.text('លទ្ធផល',    430, thY + 5, { width: 50 });
    doc.text('ពិន្ទុ',     482, thY + 5, { width: 55 });

    doc.fillColor('black');
    doc.moveDown(1.5);

    // Rows
    answers.forEach((ans, i) => {
      if (doc.y > 720) {
        doc.addPage();
        doc.moveDown(0.5);
      }

      const rowY      = doc.y;
      const isCorrect = ans.isCorrect === 1 || ans.isCorrect === true;
      const bg        = i % 2 === 0 ? '#f5f5f5' : '#ffffff';

      doc.rect(50, rowY, 495, 18).fill(bg);
      doc.fillColor('black').font('Khmer').fontSize(8);

      const qShort = (ans.questionText || '').length > 60
        ? ans.questionText.substring(0, 57) + '...'
        : (ans.questionText || '');

      doc.text(`${i + 1}`,                                  55,  rowY + 4, { width: 25 });
      doc.text(qShort,                                       82,  rowY + 4, { width: 220 });
      doc.text((ans.selectedOption || '—').toUpperCase(),    305, rowY + 4, { width: 60 });
      doc.text(ans.correctAnswer.toUpperCase(),              368, rowY + 4, { width: 60 });

      doc.fillColor(isCorrect ? '#28a745' : '#dc3545')
         .font('Khmer-Bold')
         .text(isCorrect ? '✓' : '✗',                      430, rowY + 4, { width: 50 });

      doc.fillColor('black').font('Khmer')
         .text(`${ans.pointsEarned}/${ans.points}`,          482, rowY + 4, { width: 55 });

      doc.moveDown(1.3);
    });

    // ── Footer ───────────────────────────────────────────────
    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);
    doc.font('Khmer').fontSize(8).fillColor('#888888')
       .text('បង្កើតដោយ QCM Examination System', { align: 'center' })
       .text(`ថ្ងៃទី: ${new Date().toLocaleDateString('en-GB')}`, { align: 'center' });

    doc.end();

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ message: 'មិនអាចបង្កើត PDF បានទេ', error: error.message });
  }
};

module.exports = {
  exportExamResults,
  exportStudentPerformance,
  exportSubjectPerformance,
  exportExamResultPDF
};
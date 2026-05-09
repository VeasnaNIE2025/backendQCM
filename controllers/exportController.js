const { sequelize } = require('../config/db');
const ExcelJS = require('exceljs');

const headerStyle = (worksheet) => {
  const row = worksheet.getRow(1);
  row.font  = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
  row.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } };
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

// ── Export exam results ───────────────────────────────
const exportExamResults = async (req, res) => {
  try {
    const { examId } = req.query;
    let whereClause = '';
    let replacements = {};
    if (examId) { whereClause = 'WHERE er.examId = :examId'; replacements.examId = examId; }

    const results = await sequelize.query(
      `SELECT er.*,
              u.fullName  as studentName,
              u.email     as studentEmail,
              c.name      as className,
              e.title     as examTitle,
              e.totalPoints
       FROM exam_results er
       JOIN  users   u ON er.studentId = u.id
       LEFT JOIN classes c ON u.classId = c.id
       JOIN  exams   e ON er.examId   = e.id
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
      { header: 'ថ្នាក់',            key: 'className',    width: 15 }, // ✅ ថ្មី
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
        index:        i + 1,
        studentName:  r.studentName,
        studentEmail: r.studentEmail,
        className:    r.className || '—',
        examTitle:    r.examTitle,
        totalScore:   r.totalScore,
        totalPoints:  r.totalPoints,
        percentage:   `${pct}%`,
        result:       status,
        submittedAt:  new Date(r.submittedAt).toLocaleString('km-KH')
      });
    });

    addBorders(worksheet);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=exam_results_${Date.now()}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error exporting exam results:', error);
    res.status(500).json({ message: error.message });
  }
};

// ── Export student performance ────────────────────────
const exportStudentPerformance = async (req, res) => {
  try {
    const results = await sequelize.query(
      `SELECT u.id, u.fullName, u.email,
              c.name             as className,
              COUNT(er.id)       as totalExamsTaken,
              SUM(er.totalScore) as totalScore,
              SUM(e.totalPoints) as totalPossible,
              AVG(er.percentage) as averagePercentage
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
      { header: 'លេខរៀង',            key: 'index',              width: 10 },
      { header: 'ឈ្មោះសិស្ស',        key: 'fullName',           width: 25 },
      { header: 'អ៊ីមែល',             key: 'email',              width: 30 },
      { header: 'ថ្នាក់',              key: 'className',          width: 15 }, // ✅ ថ្មី
      { header: 'ចំនួនប្រឡង',         key: 'totalExamsTaken',    width: 15 },
      { header: 'ពិន្ទុសរុប',          key: 'totalScore',         width: 15 },
      { header: 'ពិន្ទុសរុបដែលអាចបាន', key: 'totalPossible',      width: 20 },
      { header: 'មធ្យមភាគរយ',         key: 'averagePercentage',  width: 15 },
      { header: 'កម្រិត',              key: 'level',              width: 15 }
    ];

    headerStyle(worksheet);

    results.forEach((s, i) => {
      const avg   = parseFloat(s.averagePercentage) || 0;
      const level = avg >= 70 ? 'ពូកែ' : avg >= 50 ? 'ល្អ' : 'ត្រូវការកែលម្អ';
      worksheet.addRow({
        index:             i + 1,
        fullName:          s.fullName,
        email:             s.email,
        className:         s.className || '—',
        totalExamsTaken:   s.totalExamsTaken   || 0,
        totalScore:        s.totalScore        || 0,
        totalPossible:     s.totalPossible     || 0,
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
    console.error('Error exporting student performance:', error);
    res.status(500).json({ message: error.message });
  }
};

// ── Export subject performance ────────────────────────
const exportSubjectPerformance = async (req, res) => {
  try {
    const results = await sequelize.query(
      `SELECT s.id, s.name as subjectName,
              COUNT(DISTINCT er.id)        as totalExams,
              COUNT(DISTINCT er.studentId) as totalStudents,
              AVG(er.percentage)           as averageScore
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
      { header: 'លេខរៀង',            key: 'index',          width: 10 },
      { header: 'មុខវិជ្ជា',           key: 'subjectName',    width: 25 },
      { header: 'ចំនួនការប្រឡង',       key: 'totalExams',     width: 18 },
      { header: 'ចំនួនសិស្សចូលរួម',    key: 'totalStudents',  width: 20 },
      { header: 'ពិន្ទុមធ្យម',          key: 'averageScore',   width: 15 }
    ];

    headerStyle(worksheet);

    results.forEach((s, i) => {
      worksheet.addRow({
        index:         i + 1,
        subjectName:   s.subjectName,
        totalExams:    s.totalExams    || 0,
        totalStudents: s.totalStudents || 0,
        averageScore:  `${(parseFloat(s.averageScore) || 0).toFixed(2)}%`
      });
    });

    addBorders(worksheet);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=subject_performance_${Date.now()}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error exporting subject performance:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { exportExamResults, exportStudentPerformance, exportSubjectPerformance };
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

// ── Helper: measure text height safely ───────────────────────
const measureH = (doc, text, width, fontSize = 10) => {
  doc.fontSize(fontSize);
  return Math.max(doc.heightOfString(String(text || ''), { width }) + 8, 22);
};

// ── Helper: draw one option block, return height used ─────────
const drawOption = (doc, label, text, isCorrect, isSelected, x, y, width) => {
  let bgColor   = '#f5f5f5';
  let textColor = '#333333';
  let borderCol = '#cccccc';
  let icon      = '';
  let bold      = false;

  if (isCorrect && isSelected) {
    bgColor   = '#d4edda'; textColor = '#155724';
    borderCol = '#28a745'; icon = '✓ '; bold = true;
  } else if (isCorrect && !isSelected) {
    bgColor   = '#cce5ff'; textColor = '#004085';
    borderCol = '#0066cc'; icon = '● '; bold = true;
  } else if (!isCorrect && isSelected) {
    bgColor   = '#f8d7da'; textColor = '#721c24';
    borderCol = '#dc3545'; icon = '✗ '; bold = true;
  }

  const fullText  = `${label}. ${icon}${text || ''}`;
  const innerW    = width - 12;
  doc.font(bold ? 'Khmer-Bold' : 'Khmer').fontSize(10);
  const textH     = doc.heightOfString(fullText, { width: innerW });
  const boxH      = Math.max(textH + 10, 24);

  doc.rect(x, y, width, boxH).fill(bgColor).stroke(borderCol);
  doc.fillColor(textColor)
     .font(bold ? 'Khmer-Bold' : 'Khmer').fontSize(10)
     .text(fullText, x + 6, y + 5, { width: innerW, lineBreak: true });

  return boxH;
};

// ── Export single exam result as PDF ─────────────────────────
const exportExamResultPDF = async (req, res) => {
  try {
    const { resultId } = req.params;

    // ── Fetch result info ──────────────────────────────────
    const result = await sequelize.query(
      `SELECT er.*,
              u.fullName as studentName, u.email as studentEmail, u.username,
              c.name as className,
              e.title as examTitle, e.totalPoints, e.duration,
              s.name as subjectName
       FROM exam_results er
       JOIN users u        ON er.studentId = u.id
       LEFT JOIN classes c ON u.classId = c.id
       JOIN exams e        ON er.examId = e.id
       JOIN subjects s     ON e.subjectId = s.id
       WHERE er.id = :resultId`,
      { replacements: { resultId }, type: sequelize.QueryTypes.SELECT }
    );

    if (!result || result.length === 0)
      return res.status(404).json({ message: 'Result not found' });

    const data = result[0];

    // ── Fetch answers + full question detail ───────────────
    const answers = await sequelize.query(
      `SELECT
         sa.selectedOption,
         sa.isCorrect,
         sa.pointsEarned,
         q.questionText,
         q.correctAnswer,
         q.points,
         q.option_a,
         q.option_b,
         q.option_c,
         q.option_d
       FROM student_answers sa
       JOIN questions q ON sa.questionId = q.id
       WHERE sa.resultId = :resultId
       ORDER BY sa.id ASC`,
      { replacements: { resultId }, type: sequelize.QueryTypes.SELECT }
    );

    // ── Create PDF ─────────────────────────────────────────
    const doc = new PDFDocument({ margin: 50, size: 'A4', autoFirstPage: true });

    doc.registerFont('Khmer', FONT);
    try { doc.registerFont('Khmer-Bold', FONT_BOLD); }
    catch { doc.registerFont('Khmer-Bold', FONT); }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition',
      `attachment; filename="exam_result_${data.id}_${Date.now()}.pdf"`);
    doc.pipe(res);

    // ════════════════════════════════════════════════════════
    //  PAGE HEADER (repeated on each page via function)
    // ════════════════════════════════════════════════════════
    const drawPageHeader = () => {
      const topY = 35;

      // Logo
      const logoPath = path.join(__dirname, '../assets/logo.png');
      try { doc.image(logoPath, 55, topY, { width: 60 }); }
      catch { doc.circle(85, topY + 28, 25).stroke('#cccccc'); }

      doc.font('Khmer').fontSize(10)
         .fillColor('#333')
         .text('វិចប.ព្រះនរោត្តមសីហមុនី', 48, topY + 65, { width: 125, align: 'center' });

      // Right: Kingdom header
      doc.font('Khmer-Bold').fontSize(12).fillColor('black')
         .text('ព្រះរាជាណាចក្រកម្ពុជា', 320, topY + 3, { width: 220, align: 'center' });
      doc.font('Khmer').fontSize(11)
         .text('ជាតិ  សាសនា  ព្រះមហាក្សត្រ', 320, topY + 22, { width: 220, align: 'center' });
      doc.moveTo(338, topY + 44).lineTo(532, topY + 44).lineWidth(1).stroke('#333');

      // Center title
      doc.font('Helvetica-Bold').fontSize(14).fillColor('black')
         .text('QCM Examination System', 50, topY + 80, { width: 495, align: 'center' });
      doc.font('Khmer-Bold').fontSize(12)
         .text('របាយការណ៍លទ្ធផលប្រឡង', 50, topY + 100, { width: 495, align: 'center' });

      // Divider
      const divY = topY + 122;
      doc.moveTo(50, divY).lineTo(545, divY).lineWidth(1.5).stroke('#333');
      doc.y = divY + 10;
    };

    drawPageHeader();

    // ════════════════════════════════════════════════════════
    //  STUDENT INFO SECTION
    // ════════════════════════════════════════════════════════
    const infoStartY = doc.y;
    const col1X = 50, col2X = 300;

    const infoRows = [
      ['ឈ្មោះសិស្ស',  data.studentName,                                      'ថ្នាក់',     data.className    || '—'],
      ['អ៊ីមែល',       data.studentEmail,                                     'មុខវិជ្ជា',  data.subjectName],
      ['ការប្រឡង',     data.examTitle,                                        'រយៈពេល',   `${data.duration} នាទី`],
      ['ថ្ងៃប្រឡង',    new Date(data.submittedAt).toLocaleDateString('en-GB'), '',           ''],
    ];

    infoRows.forEach(([l1, v1, l2, v2]) => {
      const y = doc.y;
      doc.font('Khmer-Bold').fontSize(11).fillColor('black')
         .text(`${l1}:`, col1X, y, { width: 80 });
      doc.font('Khmer').fontSize(11)
         .text(v1 || '—', col1X + 85, y, { width: 190 });
      if (l2) {
        doc.font('Khmer-Bold').fontSize(11)
           .text(`${l2}:`, col2X, y, { width: 80 });
        doc.font('Khmer').fontSize(11)
           .text(v2 || '—', col2X + 85, y, { width: 160 });
      }
      doc.moveDown(1.1);
    });

    doc.moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    // ════════════════════════════════════════════════════════
    //  SCORE SUMMARY BOX
    // ════════════════════════════════════════════════════════
    const pct      = parseFloat(data.percentage).toFixed(1);
    const pctNum   = parseFloat(pct);
    const resLabel = pctNum >= 70 ? 'ជាប់' : pctNum >= 50 ? 'មធ្យម' : 'ធ្លាក់';
    const resColor = pctNum >= 70 ? '#28a745' : pctNum >= 50 ? '#e67e22' : '#dc3545';
    const boxBg    = pctNum >= 70 ? '#e8f5e9' : pctNum >= 50 ? '#fff8e1' : '#ffebee';

    const boxY     = doc.y;
    const correctCount  = answers.filter(a => a.isCorrect === 1 || a.isCorrect === true).length;
    const incorrectCount = answers.length - correctCount;

    doc.rect(50, boxY, 495, 65).fillAndStroke(boxBg, resColor);
    doc.fillColor('black');

    // Row 1: score + percentage + result
    doc.font('Khmer-Bold').fontSize(14)
       .text(`ពិន្ទុ: ${data.totalScore} / ${data.totalPoints}`, 65, boxY + 8, { width: 180 });
    doc.font('Khmer-Bold').fontSize(22)
       .fillColor(resColor)
       .text(`${pct}%`, 265, boxY + 5, { width: 100 });
    doc.font('Khmer-Bold').fontSize(16)
       .fillColor(resColor)
       .text(`[ ${resLabel} ]`, 375, boxY + 10, { width: 150 });

    // Row 2: correct / incorrect count
    doc.fillColor('#155724').font('Khmer').fontSize(11)
       .text(`✓ ចម្លើយត្រឹមត្រូវ: ${correctCount}`, 65, boxY + 38, { width: 180 });
    doc.fillColor('#721c24').font('Khmer').fontSize(11)
       .text(`✗ ចម្លើយខុស: ${incorrectCount}`, 265, boxY + 38, { width: 180 });
    doc.fillColor('#333').font('Khmer').fontSize(11)
       .text(`សំណួរសរុប: ${answers.length}`, 440, boxY + 38, { width: 100 });

    doc.fillColor('black');
    doc.y = boxY + 75;

    // ════════════════════════════════════════════════════════
    //  COLOR LEGEND  — NO continued:true  ✅
    // ════════════════════════════════════════════════════════
    doc.moveDown(0.5);
    const legY = doc.y;

    // background strip
    doc.rect(50, legY, 495, 22).fill('#f0f0f0').stroke('#cccccc');

    // label
    doc.font('Khmer-Bold').fontSize(10).fillColor('#333')
       .text('សញ្ញាពណ៌:', 55, legY + 5, { width: 65 });

    // 🟢 green swatch + label
    doc.rect(122, legY + 5, 11, 11).fill('#d4edda').stroke('#28a745');
    doc.font('Khmer').fontSize(10).fillColor('#155724')
       .text('ត្រូវ (ជ្រើស)', 136, legY + 5, { width: 85 });

    // 🔵 blue swatch + label
    doc.rect(228, legY + 5, 11, 11).fill('#cce5ff').stroke('#004085');
    doc.font('Khmer').fontSize(10).fillColor('#004085')
       .text('ត្រូវ (មិនជ្រើស)', 242, legY + 5, { width: 100 });

    // 🔴 red swatch + label
    doc.rect(350, legY + 5, 11, 11).fill('#f8d7da').stroke('#dc3545');
    doc.font('Khmer').fontSize(10).fillColor('#721c24')
       .text('ខុស (ជ្រើស)', 364, legY + 5, { width: 80 });

    // ⬜ grey swatch + label
    doc.rect(452, legY + 5, 11, 11).fill('#f5f5f5').stroke('#cccccc');
    doc.font('Khmer').fontSize(10).fillColor('#555')
       .text('មិនមែន', 466, legY + 5, { width: 70 });

    doc.fillColor('black');
    doc.y = legY + 30;
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#cccccc');
    doc.moveDown(0.4);

    // ════════════════════════════════════════════════════════
    //  QUESTION DETAIL — explicit Y coords, no overlap ✅
    // ════════════════════════════════════════════════════════
    doc.font('Khmer-Bold').fontSize(12).fillColor('#1a1a1a')
       .text('លម្អិតសំណួរ និងចម្លើយ', 50, doc.y, { width: 495, align: 'center' });
    doc.moveDown(0.4);

    const PAGE_BOTTOM  = 800;
    const MARGIN_LEFT  = 50;
    const PAGE_WIDTH   = 495;
    const optionMap    = { a: 'option_a', b: 'option_b', c: 'option_c', d: 'option_d' };
    const optionLabels = ['a', 'b', 'c', 'd'];
    const COL_W        = 242;  // each option column width
    const COL_GAP      = 11;
    const COL2_X       = MARGIN_LEFT + COL_W + COL_GAP;

    answers.forEach((ans, idx) => {
      const isCorrect = ans.isCorrect === 1 || ans.isCorrect === true;
      const selected  = (ans.selectedOption || '').toLowerCase();
      const correct   = (ans.correctAnswer  || '').toLowerCase();

      // ── Pre-measure full block height ────────────────────
      doc.font('Khmer-Bold').fontSize(11);
      const qTextH = doc.heightOfString(String(ans.questionText || ''), { width: 360 }) + 14;
      const qRowH  = Math.max(qTextH, 26);

      // measure each option
      const optHeights = optionLabels.map(lbl => {
        const lblU   = lbl.toUpperCase();
        const txt    = ans[optionMap[lbl]] || '';
        const isCo   = lbl === correct;
        const isSel  = lbl === selected;
        const icon   = (isCo && isSel) ? '✓ ' : (isCo && !isSel) ? '● ' : (!isCo && isSel) ? '✗ ' : '';
        doc.font((isCo || isSel) ? 'Khmer-Bold' : 'Khmer').fontSize(10);
        const h = doc.heightOfString(`${lblU}. ${icon}${txt}`, { width: COL_W - 12 });
        return Math.max(h + 10, 24);
      });

      // 2-column pairing: row1 = A+B, row2 = C+D
      const row1H = Math.max(optHeights[0], optHeights[1]) + 4;
      const row2H = Math.max(optHeights[2], optHeights[3]) + 4;
      const sumH  = 22;
      const totalBlockH = qRowH + row1H + row2H + sumH + 20;

      // ── New page check ────────────────────────────────────
      if (doc.y + totalBlockH > PAGE_BOTTOM) {
        doc.addPage();
        doc.font('Khmer').fontSize(9).fillColor('#888888')
           .text(
             `${data.studentName}  |  ${data.examTitle}  |  ${pct}%`,
             50, 25, { width: 495, align: 'center' }
           );
        doc.moveTo(50, 42).lineTo(545, 42).lineWidth(0.8).stroke('#cccccc');
        doc.y = 52;
      }

      // ── Draw question header row ──────────────────────────
      let curY = doc.y;

      // number badge [idx+1]
      const badgeColor = isCorrect ? '#28a745' : '#dc3545';
      doc.rect(MARGIN_LEFT, curY, 28, qRowH).fill(badgeColor);
      doc.font('Khmer-Bold').fontSize(11).fillColor('white')
         .text(`${idx + 1}`, MARGIN_LEFT, curY + (qRowH - 14) / 2,
               { width: 28, align: 'center' });

      // points badge [right]
      const ptsTxt  = `${ans.pointsEarned}/${ans.points}ព`;
      const ptsBoxW = 62;
      const ptsX    = MARGIN_LEFT + PAGE_WIDTH - ptsBoxW;
      doc.rect(ptsX, curY, ptsBoxW, qRowH).fill(badgeColor);
      doc.font('Khmer').fontSize(9).fillColor('white')
         .text(ptsTxt, ptsX + 2, curY + (qRowH - 12) / 2,
               { width: ptsBoxW - 4, align: 'center' });

      // question text box
      const qBg     = isCorrect ? '#eafaf1' : '#fff8e1';
      const qBorder = isCorrect ? '#28a745' : '#e67e22';
      const qBoxX   = MARGIN_LEFT + 28;
      const qBoxW   = PAGE_WIDTH - 28 - ptsBoxW;
      doc.rect(qBoxX, curY, qBoxW, qRowH).fill(qBg).stroke(qBorder);
      doc.font('Khmer-Bold').fontSize(11).fillColor('#1a1a1a')
         .text(ans.questionText || '(គ្មានអត្ថបទ)',
               qBoxX + 6, curY + 5,
               { width: qBoxW - 12, lineBreak: true });

      curY += qRowH + 4;

      // ── Draw options — row 1: A (left) + B (right) ────────
      const hA = drawOption(doc, 'A', ans.option_a, 'a' === correct, 'a' === selected,
                            MARGIN_LEFT, curY, COL_W);
      const hB = drawOption(doc, 'B', ans.option_b, 'b' === correct, 'b' === selected,
                            COL2_X, curY, COL_W);
      curY += Math.max(hA, hB) + 4;

      // ── Draw options — row 2: C (left) + D (right) ────────
      const hC = drawOption(doc, 'C', ans.option_c, 'c' === correct, 'c' === selected,
                            MARGIN_LEFT, curY, COL_W);
      const hD = drawOption(doc, 'D', ans.option_d, 'd' === correct, 'd' === selected,
                            COL2_X, curY, COL_W);
      curY += Math.max(hC, hD) + 4;

      // ── Summary bar ───────────────────────────────────────
      doc.rect(MARGIN_LEFT, curY, PAGE_WIDTH, sumH).fill('#f0f4f8').stroke('#d0d8e0');

      // correct answer label
      doc.font('Khmer-Bold').fontSize(10).fillColor('#004085')
         .text('ចម្លើយត្រឹមត្រូវ:', MARGIN_LEFT + 6, curY + 5, { width: 110 });
      doc.font('Khmer-Bold').fontSize(11).fillColor('#155724')
         .text(correct.toUpperCase(), MARGIN_LEFT + 118, curY + 4, { width: 30 });

      // divider
      doc.moveTo(MARGIN_LEFT + 155, curY + 4)
         .lineTo(MARGIN_LEFT + 155, curY + sumH - 4)
         .stroke('#aaaaaa');

      // student answer label
      doc.font('Khmer-Bold').fontSize(10).fillColor('#555')
         .text('ចម្លើយសិស្ស:', MARGIN_LEFT + 162, curY + 5, { width: 95 });
      doc.font('Khmer-Bold').fontSize(11)
         .fillColor(isCorrect ? '#155724' : '#721c24')
         .text(selected ? selected.toUpperCase() : '—',
               MARGIN_LEFT + 256, curY + 4, { width: 30 });

      // divider
      doc.moveTo(MARGIN_LEFT + 292, curY + 4)
         .lineTo(MARGIN_LEFT + 292, curY + sumH - 4)
         .stroke('#aaaaaa');

      // result icon
      doc.font('Khmer-Bold').fontSize(11)
         .fillColor(isCorrect ? '#155724' : '#721c24')
         .text(isCorrect ? '✓ ត្រឹមត្រូវ' : '✗ ខុស',
               MARGIN_LEFT + 298, curY + 5, { width: 120 });

      curY += sumH + 10;
      doc.y = curY;
    });

    // ════════════════════════════════════════════════════════
    //  FOOTER
    // ════════════════════════════════════════════════════════
    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#cccccc');
    doc.moveDown(0.4);
    doc.font('Khmer').fontSize(10).fillColor('#888888')
       .text('រៀបចំដោយលោកគ្រូ ម៉ាន់ វាសនា', { align: 'center' })
       .text(`កាលបរិច្ឆេទ: ${new Date().toLocaleDateString('en-GB')}`, { align: 'center' });

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
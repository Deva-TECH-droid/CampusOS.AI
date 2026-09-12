import ExcelJS from "exceljs";

/**
 * Builds an attendance workbook and streams it directly into the HTTP response.
 */
export const streamAttendanceExcel = async (res, filename, rows) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "CampusOS.AI";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Attendance");
  sheet.columns = [
    { header: "Student Name", key: "studentName", width: 26 },
    { header: "Roll Number", key: "rollNumber", width: 16 },
    { header: "Subject", key: "subject", width: 20 },
    { header: "Date", key: "date", width: 14 },
    { header: "Attendance Status", key: "status", width: 18 },
    { header: "Time", key: "time", width: 12 },
    { header: "Method", key: "method", width: 12 },
  ];
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  };

  rows.forEach((row) => sheet.addRow(row));
  sheet.autoFilter = { from: "A1", to: "G1" };

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  await workbook.xlsx.write(res);
  res.end();
};

/**
 * Generates an Excel workbook for the Student List according to Requirement 12:
 * Student Name | Roll Number | Email | Department | Class | Subject | Teacher | Attendance
 */
export const buildStudentListWorkbook = (rows) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "CampusOS.AI";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Student List");
  sheet.columns = [
    { header: "Student Name", key: "studentName", width: 26 },
    { header: "Roll Number", key: "rollNumber", width: 16 },
    { header: "Email", key: "email", width: 28 },
    { header: "Department", key: "department", width: 22 },
    { header: "Class", key: "className", width: 16 },
    { header: "Subject", key: "subject", width: 20 },
    { header: "Teacher", key: "teacher", width: 24 },
    { header: "Attendance", key: "attendance", width: 18 },
  ];

  // Professional header styling
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E293B" }, // Slate 800
  };
  headerRow.height = 24;

  rows.forEach((r, idx) => {
    const row = sheet.addRow(r);
    // Subtle alternating row zebra stripe
    if (idx % 2 === 1) {
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF8FAFC" },
      };
    }
  });

  sheet.autoFilter = { from: "A1", to: "H1" };
  return workbook;
};

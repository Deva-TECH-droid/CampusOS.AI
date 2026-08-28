import ExcelJS from "exceljs";

/**
 * Builds an attendance workbook and streams it directly into the HTTP
 * response as a .xlsx download.
 *
 * @param {import('express').Response} res
 * @param {string} filename
 * @param {Array<{studentName, rollNumber, subject, date, status, time}>} rows
 */
export const streamAttendanceExcel = async (res, filename, rows) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "CampusOS";
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

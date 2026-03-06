const fs = require('fs');
const path = require('path');

// Execute this using: npm install xlsx --no-save && node read_excel.js

try {
  const xlsx = require('xlsx');
  const filePath = 'C:\\Users\\trist\\Downloads\\KadoKado 2026 數據需求.xlsx';
  
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const wb = xlsx.readFile(filePath);
  
  // Find the exact sheet or use the first one if not found
  const sheetName = wb.SheetNames.find(n => n.includes('專案整理需求')) || wb.SheetNames[0];
  console.log(`Reading sheet: ${sheetName}`);
  
  const sheet = wb.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, { defval: '' });
  
  // Filter where any column contains "待開發"
  const pending = data.filter(r => Object.values(r).some(v => String(v).includes('待開發')));
  
  console.log('--- FILTERED DATA START ---');
  console.log(JSON.stringify(pending, null, 2));
  console.log('--- FILTERED DATA END ---');

} catch (e) {
  console.error("Error parsing the excel file:", e);
}

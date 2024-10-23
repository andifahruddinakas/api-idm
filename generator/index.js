const XLSX = require("xlsx");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const https = require("https");

async function fetchIdmData(kodeDesa, tahun) {
  const url = `https://idm.kemendesa.go.id/open/api/desa/rumusan/${kodeDesa}/${tahun}`;

  try {
    const response = await axios.get(url, {
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    });
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching data for ${kodeDesa} in ${tahun}: ${error.message}`
    );
    return null;
  }
}

function readCSVFile(filePath) {
  const workbook = XLSX.readFile(filePath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(worksheet, { header: 1 });
}

async function generateJsonFromExcel(excelFilePath, tahunAwal, tahunAkhir) {
  const data = readCSVFile(excelFilePath);
  const outputDir = path.join(__dirname, "../public/desa");

  for (let i = 1; i < data.length; i++) {
    const [kodeDesa, , namaDesa] = data[i];
    const kodeDesaStr = String(kodeDesa);

    for (let tahun = tahunAwal; tahun <= tahunAkhir; tahun++) {
      const outputFilePath = path.join(outputDir, kodeDesaStr, `${tahun}.json`);

      if (fs.existsSync(outputFilePath)) {
        console.log(
          `File JSON untuk desa ${namaDesa} (${kodeDesaStr}) tahun ${tahun} sudah ada.`
        );
        continue;
      }

      const idmResult = await fetchIdmData(kodeDesaStr, tahun);

      if (!fs.existsSync(path.dirname(outputFilePath))) {
        fs.mkdirSync(path.dirname(outputFilePath), { recursive: true });
      }

      if (idmResult) {
        fs.writeFileSync(outputFilePath, JSON.stringify(idmResult, null, 2));
        console.log(
          `File JSON untuk desa ${namaDesa} (${kodeDesaStr}) tahun ${tahun} berhasil dibuat.`
        );
      } else {
        console.warn(
          `Tidak ada data untuk desa ${namaDesa} (${kodeDesaStr}) tahun ${tahun}.`
        );
      }
    }
  }
}

const args = process.argv.slice(2);
const excelFilePath = path.join(__dirname, "data", args[0] || "desa.csv");
const tahunAwal = 2024;
const tahunAkhir = new Date().getFullYear();

console.log(`Menggunakan file CSV: ${excelFilePath}`);

generateJsonFromExcel(excelFilePath, tahunAwal, tahunAkhir);

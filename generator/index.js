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
    console.error(`Error fetching data for ${kodeDesa} in ${tahun}: ${error.message}`);
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
        console.log(`File JSON untuk desa ${namaDesa} (${kodeDesaStr}) tahun ${tahun} sudah ada. Dilewati.`);
        continue;
      }

      const idmResult = await fetchIdmData(kodeDesaStr, tahun);

      if (!fs.existsSync(path.dirname(outputFilePath))) {
        fs.mkdirSync(path.dirname(outputFilePath), { recursive: true });
      }

      if (idmResult) {
        // Minify JSON by removing spaces and line breaks
        fs.writeFileSync(outputFilePath, JSON.stringify(idmResult));
        console.log(`File JSON untuk desa ${namaDesa} (${kodeDesaStr}) tahun ${tahun} berhasil dibuat.`);
      } else {
        console.warn(`Tidak ada data untuk desa ${namaDesa} (${kodeDesaStr}) tahun ${tahun}.`);
      }
    }
  }
}

async function updateCache(cache, cacheFilePath) {
  fs.writeFileSync(cacheFilePath, JSON.stringify(Array.from(cache), null, 2));
}

async function processAllCSVs(tahunAwal, tahunAkhir) {
  const dataFolder = path.join(__dirname, "data");
  const csvFiles = fs
    .readdirSync(dataFolder)
    .filter((file) => file.endsWith(".csv") && file !== "desa.csv" && file !== "test.csv");

  const cacheFilePath = path.join(__dirname, "cache.json");
  const processedCache = new Set();

  if (fs.existsSync(cacheFilePath)) {
    const cachedData = fs.readFileSync(cacheFilePath, "utf8");
    const cachedFiles = JSON.parse(cachedData);
    cachedFiles.forEach((file) => processedCache.add(file));
  }

  for (const csvFile of csvFiles) {
    if (processedCache.has(csvFile)) {
      console.log(`File CSV ${csvFile} sudah diproses sebelumnya.`);
      continue;
    }

    const excelFilePath = path.join(dataFolder, csvFile);
    console.log(`Menggunakan file CSV: ${excelFilePath}`);
    await generateJsonFromExcel(excelFilePath, tahunAwal, tahunAkhir);

    processedCache.add(csvFile);
    await updateCache(processedCache, cacheFilePath);
    console.log(`Cache diperbarui dengan file ${csvFile}.`);
  }
}

const tahunAwal = 2021;
const tahunAkhir = new Date().getFullYear();

processAllCSVs(tahunAwal, tahunAkhir)
  .then(() => {
    console.log("Proses selesai.");
  })
  .catch((err) => {
    console.error("Terjadi kesalahan:", err);
  });

const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send(
    "Welcome to the API! Use /api/desa/:kodedesa/:tahun to access data."
  );
});

app.get(["/api", "/api/desa"], (req, res) => {
  res.status(404).json({
    status: 404,
    error: true,
    message: "API endpoint not found",
  });
});

app.get("/api/desa/:kodedesa", (req, res) => {
  const folderPath = path.join(
    __dirname,
    "public",
    "desa",
    req.params.kodedesa
  );

  if (!fs.existsSync(folderPath)) {
    return res.status(400).json({
      status: 400,
      error: true,
      message: "ID Desa tidak ditemukan",
    });
  }

  res.status(400).json({
    status: 400,
    error: true,
    message: "Tahun tidak ditemukan dalam permintaan",
  });
});

app.get("/api/desa/:kodedesa/:tahun", (req, res) => {
  const { kodedesa, tahun } = req.params;
  const filePath = path.join(
    __dirname,
    "public",
    "desa",
    kodedesa,
    tahun + ".json"
  );

  if (!fs.existsSync(path.join(__dirname, "public", "desa", kodedesa))) {
    return res.status(400).json({
      status: 400,
      error: true,
      message: "ID Desa tidak ditemukan",
    });
  }

  if (!fs.existsSync(filePath)) {
    return res.status(400).json({
      status: 400,
      error: true,
      message: "Tahun tidak ditemukan",
    });
  }

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({
        status: 500,
        error: true,
        message: "Error reading the file",
      });
    }
    res.json(JSON.parse(data));
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

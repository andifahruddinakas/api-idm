const fs = require("fs");
const path = require("path");

// Path to the cache file
const cacheFilePath = path.join(__dirname, "minify_cache.json");

// Load cache from file or initialize an empty array
let cache = [];
if (fs.existsSync(cacheFilePath)) {
  try {
    const data = fs.readFileSync(cacheFilePath, "utf8");
    cache = JSON.parse(data);

    // Ensure cache is an array
    if (!Array.isArray(cache)) {
      throw new Error(
        "Cache data is not an array. Initializing an empty cache."
      );
    }
  } catch (error) {
    console.error(`Failed to load cache: ${error.message}`);
    cache = []; // Reset to empty array if there's an error
  }
}

// Function to create a cache key using the full file path
function createCacheKey(filePath) {
  return filePath.replace(/\\/g, "/"); // Replace backslashes with forward slashes for consistency
}

// Function to minify a single JSON file
function minifyJsonFile(filePath) {
  const cacheKey = createCacheKey(filePath);

  // Check if the file has already been minified
  if (cache.includes(cacheKey)) {
    console.log(`Already minified: ${filePath}`);
    return;
  }

  try {
    const jsonData = fs.readFileSync(filePath, "utf8");
    const parsedData = JSON.parse(jsonData);
    const minifiedData = JSON.stringify(parsedData);

    fs.writeFileSync(filePath, minifiedData);
    console.log(`Minified: ${filePath}`);

    // Mark the file as minified in the cache
    cache.push(cacheKey);

    // Save updated cache to file after each successful minification
    fs.writeFileSync(cacheFilePath, JSON.stringify(cache, null, 2));
  } catch (error) {
    console.error(`Failed to minify ${filePath}: ${error.message}`);
  }
}

// Function to recursively find and minify all JSON files in a directory
function minifyJsonFilesInDirectory(directoryPath) {
  fs.readdirSync(directoryPath).forEach((file) => {
    const fullPath = path.join(directoryPath, file);

    if (fs.statSync(fullPath).isDirectory()) {
      // Recursively minify JSON files in subdirectories
      minifyJsonFilesInDirectory(fullPath);
    } else if (file.endsWith(".json")) {
      minifyJsonFile(fullPath);
    }
  });
}

// Specify the base directory containing the JSON files
const directoryPath = path.join(__dirname, "../public/desa");

// Minify all JSON files in the base directory and its subdirectories
minifyJsonFilesInDirectory(directoryPath);
console.log("All JSON files in 'public/desa' have been processed.");

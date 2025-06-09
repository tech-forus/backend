// backend-main/backend-main/src/utils/pincodeMap.js

const fs = require("fs");
const path = require("path");

// 1. Resolve the path to pincode_centroids.json
const JSON_PATH = path.join(__dirname, "../../data/pincode_centroids.json");

let rawCentroids = [];
try {
  rawCentroids = JSON.parse(fs.readFileSync(JSON_PATH, "utf-8"));
} catch (err) {
  console.error("Failed to load pincode_centroids.json:", err);
  process.exit(1);
}

// 2. Build an in-memory map: { "560001": { lat: 12.97..., lng: 77.59... }, … }
const pinMap = {};
rawCentroids.forEach((entry) => {
  if (entry.pincode) {
    pinMap[entry.pincode] = { lat: entry.lat, lng: entry.lng };
  }
});

module.exports = pinMap;

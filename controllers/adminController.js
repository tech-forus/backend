import priceModel from "../model/priceModel.js";
import transporterModel from "../model/transporterModel.js";
import xlsx from "xlsx";
import path from 'path';
// and to get __dirname in an ESM file:
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
import redisClient from "../utils/redisClient.js";

export const addTransporter = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const companyName = req.body.transporter;
    const servicableZones = JSON.parse(req.body.zones);

    // Parse from buffer instead of file path
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const service = rows.map(row => ({
      pincode: Number(row.pincode || row.Pincode),
      isOda: String(row.isOda || row.ODA).toLowerCase() === 'true',
      zone: String(row.zone || row.Zone || '')
    }));

    // Upsert
    const cacheKey = `transporter:${companyName}`;
    const redisData = await redisClient.setEx(
      cacheKey,
      60 * 60,
      JSON.stringify({ companyName, servicableZones, service })
    );

    console.log("Redis data:", redisData);

    return res.json({ success: true, message: 'Transporter data cached, awaiting prices.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const addPrice = async (req, res) => {
  try {
    const { companyName, priceRate, zoneRates } = req.body;
    if (!companyName || !priceRate || !zoneRates) {
      return res.status(400).json({ success: false, message: 'Missing payload' });
    }

    // 1. fetch transporter data from Redis
    const cacheKey = `transporter:${companyName}`;
    const transporterJson = await redisClient.get(cacheKey);
    if (!transporterJson) {
      return res.status(404).json({ success: false, message: 'No transporter data in cache' });
    }
    const { servicableZones, service } = JSON.parse(transporterJson);

    // 2. upsert into Mongo to get companyId
    const transporter = await transporterModel.findOneAndUpdate(
      { companyName },
      { companyName, servicableZones, service },
      { upsert: true, new: true }
    );

    // 3. create the Price doc
    const priceDoc = new priceModel({
      companyId: transporter._id,
      priceRate,
      zoneRates,        // Mongoose will cast this JS object into a Map<zone, ToZoneRatesSchema>
    });
    await priceDoc.save();

    // 4. cleanup: remove from Redis if you don't need it any more
    await redisClient.del(cacheKey);

    res.json({
      success: true,
      message: 'Prices saved',
      priceId: priceDoc._id
    });
  } catch (err) {
    console.error('Error in /api/prices:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

export const getTransporters = async (req, res) => {
  try {
    const { transporter } = req.query;
    const transporters = await transporterModel.find({companyName: transporter});
    if (!transporters || transporters.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No transporters found",
      });
    }
    return res.status(200).json({
      success: true,
      data: transporters,
      message: "Transporters fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching transporters:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

export const downloadTransporterTemplate = (req, res) => {
   const filePath = path.join(__dirname, 'templates', 'pincodes_template.xlsx');

  // res.download sets the right headers and streams the file
  res.download(filePath, 'pincodes_template.xlsx', err => {
    if (err) {
      console.error('Download error:', err);
      return res.status(500).json({ success: false, message: 'Could not download file.' });
    }
  });
}

export const addPincodeController = async (req, res) => {
  try {
    const { pincode, city, state, zone } = req.body;

    // Manual input validation
    if (
      !pincode ||
      isNaN(pincode) ||
      !city ||
      typeof city !== "string" ||
      city.trim() === "" ||
      !state ||
      typeof state !== "string" ||
      state.trim() === ""
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid input. Please provide all required fields with valid data.",
      });
    }

    const data = await new pincodeModel({
      pincode: Number(pincode),
      city: city.trim(),
      state: state.trim()
     
    }).save();

    return res.status(201).json({
      success: true,
      message: "Pincode data saved successfully",
    });
  } catch (error) {
    console.error("Error saving Pincode data:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const transporterPriceController = async (req, res) => {
  try {
    const data = req.body;
    console.log("Received data:", data);
    const savedData = await new priceModel(data).save();
    if(!savedData) {
      return res.status(400).json({
        success: false,
        message: "Failed to save transporter price data"
      });
    }
    return res.status(200).json({
      success: true,
      message: "Data received successfully",
      data: data
    });
  } catch (error) {
    console.error("Error fetching price:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getPricesController = async (req, res) => {
  try {
    const prices = await priceModel.find({});
    if (!prices || prices.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No prices found",
      });
    }
    return res.status(200).json({
      success: true,
      data: prices,
      message: "Prices fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching prices:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    }); 
  }
};

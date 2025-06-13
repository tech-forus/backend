import priceModel from "../model/priceModel.js";
import transporterModel from "../model/transporterModel.js";

export const addTransporter = async (req, res) => {
  try {
    const { companyName } = req.body;
    let { servicableZone } = req.body;

    // Parse servicableZone (JSON or CSV)
    if (!servicableZone) {
      return res.status(400).json({ message: 'servicableZone is required' });
    }
    if (typeof servicableZone === 'string') {
      try { servicableZone = JSON.parse(servicableZone); }
      catch {
        servicableZone = servicableZone.split(',').map(z => z.trim());
      }
    }
    if (!Array.isArray(servicableZone)) {
      return res.status(400).json({ message: 'servicableZone must be an array' });
    }

    // Read and parse Excel file buffer into JSON
    if (!req.file) {
      return res.status(400).json({ message: 'serviceFile (Excel) is required' });
    }
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const service = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    if (!service.length) {
      return res.status(400).json({ message: 'Service sheet is empty or invalid' });
    }

    // Check duplicates
    if (await transporterModel.findOne({ companyName })) {
      return res.status(400).json({ message: 'Transporter already exists' });
    }

    const newTransporter = new transporterModel({ companyName, servicableZone, service });
    await newTransporter.save();
    res.status(201).json({ message: 'Transporter saved', data: newTransporter });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Company name duplicate' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

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

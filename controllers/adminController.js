import transporterModel from "../model/transporterModel.js";

export const addTransporter = async (req, res) => {
  try {
    const { companyName, service } = req.body;

    if (!companyName || !Array.isArray(service)) {
      return res.status(400).json({ message: "Invalid input data" });
    }

    const existingTransporter = await transporterModel.findOne({ companyName });
    if (existingTransporter) {
        return res.status(400).json({ message: "Transporter with this company name already exists" });
    }
    

    const newTransporter = new transporterModel({
      companyName,
      service,
    });

    await newTransporter.save();

    res.status(201).json({ message: "Transporter saved successfully", data: newTransporter });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Company name already exists" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

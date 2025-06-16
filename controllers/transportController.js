import priceModel from "../model/priceModel.js";
import temporaryTransporterModel from "../model/temporaryTransporterModel.js";
import transporterModel from "../model/transporterModel.js";
import usertransporterrelationshipModel from "../model/usertransporterrelationshipModel.js";
import XLSX from "xlsx";
//import customerpriceModel from "../model/customerpriceModel.js"

export const calculatePrice = async (req, res) => {
  const {
    modeoftransport,
    fromPincode,
    toPincode,
    noofboxes,
    quantity,
    length,
    width,
    height,
    weight,
  } = req.body;

  console.log(req.body);

  // 1) validate
  if (
    !modeoftransport ||
    !fromPincode ||
    !toPincode ||
    !noofboxes ||
    !quantity ||
    !length ||
    !width ||
    !height ||
    !weight
  ) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields",
    });
  }

  try {
    // 2) compute actual + volumetric weights
    const actualWeight = weight * noofboxes;
    const transporterData = await transporterModel.find();
    const result = await Promise.all(transporterData.map(async (transporter) => {
      const fromZone = transporter.service.find(
        (service) => service.pincode === Number(fromPincode)
      ).zone;
      const fromOda = transporter.service.find(
        (service) => service.pincode === Number(fromPincode)
      ).isOda;
      const toZone = transporter.service.find(
        (service) => service.pincode === Number(toPincode)
      ).zone;
      const toOda = transporter.service.find(
        (service) => service.pincode === Number(toPincode)
      ).isOda;
      if(fromOda){
        return res.status(400).json({
          success: false,
          message: "Pickup service is not available for ODA pincode",
        });
      }
      //console.log(fromZone, toZone);
      const priceData = await priceModel.findOne({ companyId: transporter._id });
      //console.log(priceData);
      const unitPrice = priceData.zoneRates.get(fromZone)?.get(toZone);
      console.log(fromZone, toZone);
      console.log(unitPrice);
      const volumetricWeight = (length * width * height) / priceData.priceRate.divisor;
      const chargeableWeight = Math.max(actualWeight, volumetricWeight);
      if(chargeableWeight < priceData.priceRate.minCharges) {
        return res.status(400).json({
          success: false,
          message: "Chargeable weight is less than minimum charges",
        });
      }
      const baseFreight = unitPrice * chargeableWeight;
      const docketCharges = priceData.priceRate.docketCharges;
      const fuelSurcharge = (priceData.priceRate.fuel/100)*baseFreight;
      const rovCharges = Math.max(priceData.priceRate.rovCharges.variable * chargeableWeight, priceData.priceRate.rovCharges.fixed);
      const inuaranceCharges = Math.max(priceData.priceRate.inuaranceCharges.variable * chargeableWeight, priceData.priceRate.inuaranceCharges.fixed);
      let odaCharges = 0;
      if(toOda){
        odaCharges = Math.max(chargeableWeight/priceData.priceRate.odaCharges.variable, priceData.priceRate.odaCharges.fixed);
      }
      const codCharges = Math.max(priceData.priceRate.codCharges.variable * chargeableWeight, priceData.priceRate.codCharges.fixed);
      const prepaidCharges = Math.max(priceData.priceRate.prepaidCharges.variable * chargeableWeight, priceData.priceRate.prepaidCharges.fixed);
      const topayCharges = Math.max(priceData.priceRate.topayCharges.variable * chargeableWeight, priceData.priceRate.topayCharges.fixed);
      const handlingCharges = Math.max(priceData.priceRate.handlingCharges.variable * chargeableWeight, priceData.priceRate.handlingCharges.fixed);
      const fmCharges = Math.max(priceData.priceRate.fmCharges.variable * chargeableWeight, priceData.priceRate.fmCharges.fixed);
      const appointmentCharges = Math.max(priceData.priceRate.appointmentCharges.variable * chargeableWeight, priceData.priceRate.appointmentCharges.fixed);
      const minCHarges = priceData.priceRate.minCharges;
      const greenTax = priceData.priceRate.greenTax;
      const daccCharges = priceData.priceRate.daccCharges;
      const miscellanousCharges = priceData.priceRate.miscellanousCharges;
      const totalCharges = baseFreight + docketCharges + fuelSurcharge + rovCharges + inuaranceCharges + odaCharges + codCharges + prepaidCharges + topayCharges + handlingCharges + fmCharges + appointmentCharges + minCHarges + greenTax + daccCharges+ miscellanousCharges;
      return {
        transporterId: transporter._id,
        transporterName: transporter.companyName,
        originPincode: fromPincode,
        destinationPincode: toPincode,
        originZone: fromZone,
        destinationZone: toZone,
        actualWeight: actualWeight,
        volumetricWeight: volumetricWeight,
        chargeableWeight: chargeableWeight,
        unitPrice: unitPrice,
        modeoftransport: modeoftransport,
        baseFreight: baseFreight,
        docketCharges: docketCharges,
        fuelSurcharge: fuelSurcharge,
        rovCharges: rovCharges,
        inuaranceCharges: inuaranceCharges,
        odaCharges: odaCharges,
        codCharges: codCharges,
        prepaidCharges: prepaidCharges,
        topayCharges: topayCharges,
        handlingCharges: handlingCharges,
        fmCharges: fmCharges,
        appointmentCharges: appointmentCharges,
        minCHarges: minCHarges,
        greenTax: greenTax,
        daccCharges: daccCharges,
        miscellanousCharges: miscellanousCharges,
        totalCharges: totalCharges
      };

      // TODO: Calculate unitPrice based on priceData and zones
      // Example placeholder logic:
      // const unitPrice = priceData ? priceData.basePrice : 0;
      // You can add further processing here as needed
    }));
    return res.status(200).json({
      success: true,
      message: "Price calculated successfully",
      data: result,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const addTiedUpCompany = async (req, res) => {
  try {
    const { customerID, companyName, priceRate:raw } = req.body;
    if (customerID, companyName, raw, !req.file) {
      return res.status(400).json({
        success: false,
        message:
          "customerID, companyName, priceRate and priceChart file are all required",
      });
    }

    const parsedRate = JSON.parse(raw);

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const data = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
    //console.log(data);
    const companyId = await transporterModel.findOne({companyName: companyName});
    if (!companyId) {
      const tempData = new temporaryTransporterModel({
        customerID: customerID,
        companyName: companyName,
        prices:{
          priceRate: parsedRate,
          priceChart: data
        }
      }).save();
      if(tempData){
        return res.status(201).json({
          success: true,
          message: "Company added for verification",
        });
      }
    }
    const existing = await usertransporterrelationshipModel.findOne({customerID: customerID});
    if(existing){
      console.log(existing);
    }else{
      const newDoc = new usertransporterrelationshipModel({
        customerID: customerID,
        prices: {transporterId: companyId._id, priceRate: parsedRate, priceChart: data}
      });
      await newDoc.save();
    }
    return res.status(200).json({
      success: true,
      message: "Tied up company added successfully",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
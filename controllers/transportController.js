import priceModel from "../model/priceModel.js";
import transporterModel from "../model/transporterModel.js";
import usertransporterrelationshipModel from "../model/usertransporterrelationshipModel.js";
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
  console.log("REQ.BODY: ",req.body);
  const { customerID, prices, priceChart } = req.body;
  console.log("REQ.BODY: ",req.body);
  const errors = [];

  // 1) customerID
  if (!customerID) {
    errors.push("customerID is required");
  }

  // 2) prices array
  if (!Array.isArray(prices) || prices.length === 0) {
    errors.push("prices must be a non-empty array");
  } else {
    prices.forEach((p, i) => {
      // transporterName
      if (!p.transporterName || typeof p.transporterName !== "string") {
        errors.push(`prices[${i}].transporterName is required and must be a string`);
      }
      // priceRate
      const pr = p.priceRate;
      if (!pr || typeof pr !== "object") {
        errors.push(`prices[${i}].priceRate is required and must be an object`);
        return;
      }

      // flat numeric fields ≥ 0
      [ "minWeight", "docketCharges", "fuel", "minCharges", "greenTax", "daccCharges", "miscellanousCharges" ]
        .forEach(field => {
          if (typeof pr[field] !== "number") {
            errors.push(`prices[${i}].priceRate.${field} must be a number`);
          } else if (pr[field] < 0) {
            errors.push(`prices[${i}].priceRate.${field} must be ≥ 0`);
          }
        });

      // divisor ≥ 1
      if (typeof pr.divisor !== "number") {
        errors.push(`prices[${i}].priceRate.divisor must be a number`);
      } else if (pr.divisor < 1) {
        errors.push(`prices[${i}].priceRate.divisor must be ≥ 1`);
      }

      // nested charges objects
      [
        "rovCharges","inuaranceCharges","odaCharges","codCharges",
        "prepaidCharges","topayCharges","handlingCharges",
        "fmCharges","appointmentCharges"
      ].forEach(pkg => {
        const obj = pr[pkg];
        if (!obj || typeof obj !== "object") {
          errors.push(`prices[${i}].priceRate.${pkg} must be an object`);
        } else {
          ["variable","fixed"].forEach(side => {
            if (typeof obj[side] !== "number") {
              errors.push(`prices[${i}].priceRate.${pkg}.${side} must be a number`);
            } else if (obj[side] < 0) {
              errors.push(`prices[${i}].priceRate.${pkg}.${side} must be ≥ 0`);
            }
          });
        }
      });
    });
  }

  // 3) priceChart
  if (!priceChart || typeof priceChart !== "object") {
    errors.push("priceChart is required and must be an object");
  } else {
    // Example check for one zone–zone; repeat as needed
    if (
      !priceChart.N1 ||
      typeof priceChart.N1 !== "object" ||
      typeof priceChart.N1.N1 !== "number"
    ) {
      errors.push("priceChart.N1.N1 must be a number");
    }
    // …add similar checks for all 14×14 zone values…
  }

  // If any errors, return them
  if (errors.length) {
    return res.status(422).json({ success: false, errors });
  }

  // All good—save!
  try {
    const existingTransporter = await transporterModel.findOne({ companyName: prices[0].transporterName });
    if (existingTransporter) {
      return res.status(400).json({
        success: false,
        message: "Transporter already exists",
      });
    }
    const doc = new usertransporterrelationshipModel(req.body);
    const saved = await doc.save();
    return res.status(201).json({ success: true, data: saved });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ success: false, error: err.message });
  }

}

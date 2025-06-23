import customerModel from "../model/customerModel.js";
import priceModel from "../model/priceModel.js";
import temporaryTransporterModel from "../model/temporaryTransporterModel.js";
import transporterModel from "../model/transporterModel.js";
import usertransporterrelationshipModel from "../model/usertransporterrelationshipModel.js";
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const calculateDistanceBetweenPincode = async(origin, destination) =>{
  try {
    const response = await axios.get(`https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&key=${process.env.GOOGLE_MAP_API_KEY}`);
    //console.log(response.data.rows[0].elements[0].distance.value, response.data.rows[0].elements[0].distance.text);
    const estTime = ((response.data.rows[0].elements[0].distance.value)/400000).toFixed(2);
    const distance = response.data.rows[0].elements[0].distance.text;
    //console.log(estTime, distance);
    return {estTime: estTime, distance: distance};
  } catch (error) {
    console.log(error);
  }
}

export const calculatePrice = async (req, res) => {
  const {
    customerID,
    userogpincode,
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

  if (
    !customerID ||
    !userogpincode ||
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

  // Assuming calculateDistanceBetweenPincode is a safe function
  const distData = await calculateDistanceBetweenPincode(fromPincode, toPincode);
  //console.log(distData)
  const estTime = distData.estTime;
  const dist = distData.distance;
  //console.log(estTime, dist)

  try {
    const actualWeight = weight * noofboxes;
    const transporterData = await transporterModel.find();
    const tiedUpCompanies = await usertransporterrelationshipModel.find({ customerID });
    const customerData = await customerModel.findOne({ _id: customerID });

    // FIX: Added a check in case customer is not found
    if (!customerData) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }
    const isSubscribed = customerData.isSubscribed;

    const result1 = await Promise.all(tiedUpCompanies.map(async (tuc) => {
      if (!tuc.prices?.priceRate || !tuc.prices?.priceChart) {
        return;
      }
      const transporter = await transporterModel.findOne({ _id: tuc.transporterId });
      if (!transporter || !transporter.service) {
        return;
      }

      const fromService = transporter.service.find((entry) => String(entry.pincode) === fromPincode);
      const toService = transporter.service.find((entry) => String(entry.pincode) === toPincode);

      if (!fromService || !toService) {
        return;
      }

      const fromZone = fromService.zone;
      const toZone = toService.zone;
      const toOda = toService.isOda;

      if (!fromZone || !toZone) {
          return; 
      }

      const volumetricDivisor = tuc.prices.priceRate.divisor;
      if (!volumetricDivisor) {
        return;
      }


      const volumetricWeight = ((length * width * height) / volumetricDivisor) * noofboxes;
      const chargeableWeight = Math.max(actualWeight, volumetricWeight);

      const unitPrice = tuc.prices.priceChart[String(fromPincode)]?.[toZone] || 0;
      
      const baseFreight = chargeableWeight * unitPrice;
      
      const charges = tuc.prices.priceRate;
      const docketCharges = charges.docketCharges;
      const fuelSurcharge = ((charges.fuel / 100) * baseFreight);
      const rovCharges = (Math.max((baseFreight*(charges.rovCharges.variable/100)), (charges.rovCharges.fixed)));
      const insuaranceCharges = (Math.max((baseFreight*(charges.insuaranceCharges.variable/100)), (charges.insuaranceCharges.fixed)));
      const odaCharges = toOda ? (Math.max(chargeableWeight*charges.odaCharges.variable, charges.odaCharges.fixed*noofboxes)) : 0;
      const codCharges =( Math.max((chargeableWeight*(charges.codCharges.variable/100)), (charges.codCharges.fixed)));
      const prepaidCharges = (Math.max((chargeableWeight*(charges.prepaidCharges.variable/100)), (charges.prepaidCharges.fixed)));
      const topayCharges = (Math.max((chargeableWeight*(charges.topayCharges.variable/100)), (charges.topayCharges.fixed)));
      const handlingCharges = chargeableWeight < 400 ? (chargeableWeight*charges.handlingCharges.variable) : (charges.handlingCharges.fixed*chargeableWeight);
      const fmCharges = (Math.max(chargeableWeight*charges.fmCharges.variable, (charges.prepaidCharges.fixed * noofboxes)));
      const appointmentCharges = (Math.max(chargeableWeight*charges.appointmentCharges.variable, (charges.appointmentCharges.fixed * noofboxes)));
      const minCharges = (charges.minCharges);
      const greenTax = (charges.greenTax);
      const daccCharges = (charges.daccCharges);
      const miscCharges = (charges.miscellanousCharges);

      const totalCharges = Number((baseFreight + docketCharges + fuelSurcharge + rovCharges + insuaranceCharges + odaCharges + codCharges + prepaidCharges + topayCharges + handlingCharges + fmCharges + appointmentCharges + minCharges + greenTax + daccCharges + miscCharges)).toFixed(2);

      return {
        transporterId: transporter._id,
        transporterName: transporter.companyName,
        originPincode: fromPincode,
        destinationPincode: toPincode,
        originZone: fromZone,
        destinationZone: toZone,
        actualWeight,
        volumetricWeight,
        chargeableWeight,
        unitPrice,
        modeoftransport,
        baseFreight,
        docketCharges,
        fuelSurcharge,
        rovCharges,
        insuaranceCharges,
        odaCharges,
        codCharges,
        prepaidCharges,
        topayCharges,
        handlingCharges,
        fmCharges,
        appointmentCharges,
        minCharges,
        greenTax,
        daccCharges,
        miscCharges,
        totalCharges,
        estimatedTime: estTime,
        distance: dist,
        isHidden: false,
      };
    }));

    const result2 = await Promise.all(transporterData.map(async (transporter) => {
      if (!transporter.service) {
        return;
      }

      const fromService = transporter.service.find(service => String(service.pincode) === String(fromPincode));
      const toService = transporter.service.find(service => String(service.pincode) === String(toPincode));

      if (!fromService || !toService) {
        return;
      }
      
      const fromZone = fromService.zone;
      const toZone = toService.zone;
      const toOda = toService.isOda;

      const priceData = await priceModel.findOne({ companyId: transporter._id });

      if (!priceData || !priceData.priceRate || !priceData.zoneRates) {
        return;
      }
      
      const volumetricDivisor = priceData.priceRate.divisor;
      if (!volumetricDivisor) {
        return; 
      }

      const volumetricWeight = ((length * width * height) / volumetricDivisor) * noofboxes;
      const chargeableWeight = Math.max(actualWeight, volumetricWeight);

      const unitPrice = priceData.zoneRates.get(fromZone)?.get(toZone) || 0;
      const baseFreight = unitPrice * chargeableWeight;
      const charges = priceData.priceRate;
      
      const docketCharges = charges.docketCharges;
      const fuelSurcharge = ((charges.fuel / 100) * baseFreight);
      const rovCharges = (Math.max((baseFreight*(charges.rovCharges.variable/100)), (charges.rovCharges.fixed)));
      const insuaranceCharges = (Math.max((baseFreight*(charges.insuaranceCharges.variable/100)), (charges.insuaranceCharges.fixed)));
      const odaCharges = toOda ? (Math.max(chargeableWeight*charges.odaCharges.variable, charges.odaCharges.fixed*noofboxes)) : 0;
      const codCharges =( Math.max((chargeableWeight*(charges.codCharges.variable/100)), (charges.codCharges.fixed)));
      const prepaidCharges = (Math.max((chargeableWeight*(charges.prepaidCharges.variable/100)), (charges.prepaidCharges.fixed)));
      const topayCharges = (Math.max((chargeableWeight*(charges.topayCharges.variable/100)), (charges.topayCharges.fixed)));
      const handlingCharges = chargeableWeight < 400 ? (chargeableWeight*charges.handlingCharges.variable) : (charges.handlingCharges.fixed*chargeableWeight);
      const fmCharges = (Math.max(chargeableWeight*charges.fmCharges.variable, (charges.prepaidCharges.fixed * noofboxes)));
      const appointmentCharges = (Math.max(chargeableWeight*charges.appointmentCharges.variable, (charges.appointmentCharges.fixed * noofboxes)));
      const minCharges = (charges.minCharges);
      const greenTax = (charges.greenTax);
      const daccCharges = (charges.daccCharges);
      const miscCharges = (charges.miscellanousCharges);

      const totalCharges = (Number(baseFreight + docketCharges + fuelSurcharge + rovCharges + insuaranceCharges + odaCharges + codCharges + prepaidCharges + topayCharges + handlingCharges + fmCharges + appointmentCharges + minCharges + greenTax + daccCharges + miscCharges)).toFixed(2);
      
      if (isSubscribed) {
        return {
          transporterId: transporter._id,
          transporterName: transporter.companyName,
          originPincode: fromPincode,
          destinationPincode: toPincode,
          originZone: fromZone,
          destinationZone: toZone,
          actualWeight,
          volumetricWeight,
          chargeableWeight,
          unitPrice,
          modeoftransport,
          baseFreight,
          docketCharges,
          fuelSurcharge,
          rovCharges,
          insuaranceCharges,
          odaCharges,
          codCharges,
          prepaidCharges,
          topayCharges,
          handlingCharges,
          fmCharges,
          appointmentCharges,
          minCharges,
          greenTax,
          daccCharges,
          miscCharges,
          totalCharges,
          estimatedTime: estTime,
          distance: dist,
          isHidden: true,
        };
      } else {
        return {
          totalCharges,
          isHidden: true,
        };
      }
    }));

    return res.status(200).json({
      success: true,
      message: "Price calculated successfully",
      tiedUpResult: result1.filter(Boolean),
      companyResult: result2.filter(Boolean)
    });
  } catch (err) {
    console.error("An error occurred in calculatePrice:", err);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred.",
    });
  }
};

export const addTiedUpCompany = async (req, res) => {
  try {
    const { customerID, vendorCode, vendorPhone, vendorEmail, gstNo, mode, address, state, pincode, companyName, priceRate, priceChart } = req.body;
    if (!customerID,!vendorCode, !vendorPhone, !vendorEmail, !gstNo,!mode, !address, !state,!pincode, !companyName, !priceRate, !priceChart) {
      return res.status(400).json({
        success: false,
        message:
          "customerID, companyName, priceRate and priceChart file are all required",
      });
    }

    //console.log(data);
    const companyId = await transporterModel.findOne({companyName: companyName});
    if (!companyId) {
      const tempData = new temporaryTransporterModel({
        customerID: customerID,
        companyName: companyName,
        vendorCode: vendorCode,
        vendorPhone: vendorPhone,
        vendorEmail: vendorEmail,
        gstNo: gstNo,
        mode: mode,
        address: address,
        state: state,
        pincode: pincode,
        prices:{
          priceRate: priceRate,
          priceChart: priceChart
        }
      }).save();
      if(tempData){
        return res.status(201).json({
          success: true,
          message: "Company added for verification",
        });
      }
    }
    const existing = await usertransporterrelationshipModel.findOne({customerID: customerID, transporterId: companyId._id});
    if(existing){
      console.log(existing);
    }else{
      const newDoc = new usertransporterrelationshipModel({
        customerID: customerID,
        transporterId: companyId._id,
        prices: { 
          vendorCode: vendorCode,
          vendorPhone: vendorPhone,
          vendorEmail: vendorEmail,
          gstNo: gstNo,
          mode: mode,
          address: address,
          state: state,
          pincode: pincode,
          priceRate: priceRate,
          priceChart: priceChart
        }
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

export const getTiedUpCompanies = async(req, res) => {
  try {
    const userid = await req.query;
    console.log(userid)
    const data = await usertransporterrelationshipModel.findOne({customerID: userid});
    console.log(data);
    return res.status(200).json({
      success: true,
      message: "Tied up companies fetched successfully",
      data: data
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

export const getTransporters = async(req, res) => {
  try {
    const { vendorName } = req.query;
  if (!vendorName || vendorName.length < 1) return res.json([]);

  const matches = await transporterModel.find({
    companyName: { $regex: `^${vendorName}`, $options: 'i' }
  })
    .limit(10);

  //console.log(matches);

  return res.status(200).json(matches.map(v => v.companyName));

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}
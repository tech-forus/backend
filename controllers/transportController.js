import customerModel from "../model/customerModel.js";
import priceModel from "../model/priceModel.js";
import temporaryTransporterModel from "../model/temporaryTransporterModel.js";
import transporterModel from "../model/transporterModel.js";
import usertransporterrelationshipModel from "../model/usertransporterrelationshipModel.js";
import dotenv from 'dotenv';
import axios from 'axios';
import packingModel from "../model/packingModel.js";
import ratingModel from "../model/ratingModel.js";
import PackingList from '../model/packingModel.js'; // Make sure model is imported

export const deletePackingList = async (req, res) => {
  try {
    const preset = await PackingList.findById(req.params.id);

    if (!preset) {
      return res.status(404).json({ message: 'Preset not found' });
    }

    await preset.deleteOne();

    res.status(200).json({ message: 'Preset deleted successfully' });
  } catch (error) {
    console.error('Error deleting preset:', error);
    res.status(500).json({ message: 'Server error while deleting preset.' });
  }
};

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

  const distData = await calculateDistanceBetweenPincode(
    fromPincode,
    toPincode
  );
  const estTime = distData.estTime;
  const dist = distData.distance;

  try {
    const actualWeight = weight * noofboxes;
    const tiedUpCompanies = await usertransporterrelationshipModel.find({
      customerID,
    });
    const transporterData = await transporterModel.find();
    let l1 = Number.MAX_SAFE_INTEGER;

    // Build tied-up results, skip zero-price
    const tiedUpRaw = await Promise.all(
      tiedUpCompanies.map(async (tuc) => {
        const doesExist = tuc.prices.priceChart[fromPincode];
        if (!doesExist) return null;

        const transporter = await transporterModel.findById(tuc.transporterId);
        const matchedService = transporter.service.find(
          (entry) => entry.pincode === Number(fromPincode)
        );
        if (!matchedService || matchedService.isOda) return null;

        const matchedDest = transporter.service.find(
          (entry) => entry.pincode === Number(toPincode)
        );
        if (!matchedDest) return null;

        const destZone = matchedDest.zone;
        const destIsOda = matchedDest.isOda;
        const unitPrice = tuc.prices.priceChart[fromPincode][destZone];
        if (!unitPrice) return null;

        // volumetric weight
        let volumetricWeight =
          (length * width * height) /
          (modeoftransport === "Road" ? 4500 : 4750);
        volumetricWeight = (
          volumetricWeight * tuc.prices.priceRate.divisor
        ).toFixed(2);

        const chargeableWeight = Math.max(volumetricWeight, actualWeight);
        const baseFreight = unitPrice * chargeableWeight;

        const pr = tuc.prices.priceRate;
        const docketCharge = pr.docketCharges;
        const minCharges = pr.minCharges;
        const greenTax = pr.greenTax;
        const daccCharges = pr.daccCharges;
        const miscCharges = pr.miscellanousCharges;
        const fuelCharges = (pr.fuel / 100) * baseFreight;
        const rovCharges = Math.max(
          (pr.rovCharges.variable / 100) * baseFreight,
          pr.rovCharges.fixed
        );
        const insuaranceCharges = Math.max(
          (pr.insuaranceCharges.variable / 100) * baseFreight,
          pr.insuaranceCharges.fixed
        );
        const odaCharges = destIsOda
          ? pr.odaCharges.fixed + chargeableWeight * (pr.odaCharges.variable / 100)
          : 0;
        const handlingCharges =
          pr.handlingCharges.fixed +
          chargeableWeight * (pr.handlingCharges.variable / 100);
        const fmCharges = Math.max(
          (pr.fmCharges.variable / 100) * baseFreight,
          pr.fmCharges.fixed
        );
        const appointmentCharges = Math.max(
          (pr.appointmentCharges.variable / 100) * baseFreight,
          pr.appointmentCharges.fixed
        );

        const totalCharges =
          baseFreight +
          docketCharge +
          minCharges +
          greenTax +
          daccCharges +
          miscCharges +
          fuelCharges +
          rovCharges +
          insuaranceCharges +
          odaCharges +
          handlingCharges +
          fmCharges +
          appointmentCharges;

        l1 = Math.min(l1, totalCharges);

        return {
          companyId: transporter._id,
          companyName: transporter.companyName,
          originPincode: fromPincode,
          destinationPincode: toPincode,
          estimatedTime: estTime,
          distance: dist,
          chargeableWeight,
          unitPrice,
          baseFreight,
          docketCharge,
          minCharges,
          greenTax,
          daccCharges,
          miscCharges,
          fuelCharges,
          rovCharges,
          insuaranceCharges,
          odaCharges,
          handlingCharges,
          fmCharges,
          appointmentCharges,
          totalCharges,
          isHidden: false,
        };
      })
    );
    const tiedUpResult = tiedUpRaw.filter((r) => r);

    // Build public transporter results, skip zero-price
    const transporterRaw = await Promise.all(
      transporterData.map(async (data) => {
        const customerData = await customerModel.findOne({ _id: customerID });
        if (!customerData) return null;
        const isSubscribed = customerData.isSubscribed;

        const matchedOrigin = data.service.find(
          (entry) => entry.pincode === Number(fromPincode)
        );
        if (!matchedOrigin || matchedOrigin.isOda) return null;

        const matchedDest = data.service.find(
          (entry) => entry.pincode === Number(toPincode)
        );
        if (!matchedDest) return null;

        const originZone = matchedOrigin.zone;
        const destZone = matchedDest.zone;
        const destOda = matchedDest.isOda;

        const priceData = await priceModel.findOne({ companyId: data._id });
        const pr = priceData.priceRate;
        const priceChart = priceData.zoneRates;
        const unitPrice = priceChart.get(originZone)?.[destZone];
        if (!unitPrice) return null;

        // volumetric weight
        let volumetricWeight =
          (length * width * height) /
          (modeoftransport === "Road" ? 4500 : 4750);
        volumetricWeight = (volumetricWeight * pr.divisor).toFixed(2);

        const chargeableWeight = Math.max(volumetricWeight, actualWeight);
        const baseFreight = unitPrice * chargeableWeight;

        const docketCharge = pr.docketCharges;
        const minCharges = pr.minCharges;
        const greenTax = pr.greenTax;
        const daccCharges = pr.daccCharges;
        const miscCharges = pr.miscellanousCharges;
        const fuelCharges = (pr.fuel / 100) * baseFreight;
        const rovCharges = Math.max(
          (pr.rovCharges.variable / 100) * baseFreight,
          pr.rovCharges.fixed
        );
        const insuaranceCharges = Math.max(
          (pr.insuaranceCharges.variable / 100) * baseFreight,
          pr.insuaranceCharges.fixed
        );
        const odaCharges = destOda
          ? pr.odaCharges.fixed + chargeableWeight * (pr.odaCharges.variable / 100)
          : 0;
        const handlingCharges =
          pr.handlingCharges.fixed +
          chargeableWeight * (pr.handlingCharges.variable / 100);
        const fmCharges = Math.max(
          (pr.fmCharges.variable / 100) * baseFreight,
          pr.fmCharges.fixed
        );
        const appointmentCharges = Math.max(
          (pr.appointmentCharges.variable / 100) * baseFreight,
          pr.appointmentCharges.fixed
        );

        const totalCharges =
          baseFreight +
          docketCharge +
          minCharges +
          greenTax +
          daccCharges +
          miscCharges +
          fuelCharges +
          rovCharges +
          insuaranceCharges +
          odaCharges +
          handlingCharges +
          fmCharges +
          appointmentCharges;

        if (l1 < totalCharges) return null;
        if (!isSubscribed) {
          return { totalCharges, isHidden: true };
        }

        return {
          companyId: data._id,
          companyName: data.companyName,
          originPincode: fromPincode,
          destinationPincode: toPincode,
          estimatedTime: estTime,
          distance: dist,
          chargeableWeight,
          unitPrice,
          baseFreight,
          docketCharge,
          minCharges,
          greenTax,
          daccCharges,
          miscCharges,
          fuelCharges,
          rovCharges,
          insuaranceCharges,
          odaCharges,
          handlingCharges,
          fmCharges,
          appointmentCharges,
          totalCharges,
          isHidden: false,
        };
      })
    );
    const transporterResult = transporterRaw.filter((r) => r);

    return res.status(200).json({
      success: true,
      message: "Price calculated successfully",
      tiedUpResult,
      companyResult: transporterResult,
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
    const { customerID, vendorCode, vendorPhone, vendorEmail, gstNo, mode, address, state, pincode, rating, companyName, priceRate, priceChart } = req.body;
    if (!customerID,!vendorCode, !vendorPhone, !vendorEmail, !gstNo,!mode, !address, !state,!pincode, !rating, !companyName, !priceRate, !priceChart) {
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
    
      const ratingData = await ratingModel.findOne({companyId: companyId._id });
      if(!ratingData){
        const ratingPayload = {
          companyId: companyId._id,
          sum: rating,
          noofreviews: 1,
          rating: rating
        }
        const data = await new ratingModel(ratingPayload).save();
      }else{
        let ratingSum = ratingData.sum;
        let ratingReviews = ratingData.noofreviews;
        ratingSum += rating;
        ratingReviews += 1;
        const newRating = ratingSum/ratingReviews;

        ratingData.sum = ratingSum;
        ratingData.noofreviews = ratingReviews;
        ratingData.rating = newRating;
        await ratingData.save();
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
    //console.log(userid)
    const data = await usertransporterrelationshipModel.findOne({customerID: userid});
    //console.log(data);
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
    const { search } = req.query;
    if (!search || typeof search !== 'string' || !search.trim()) {
      return res.status(400).json([]);
    }
    const regex = new RegExp('^' + search, 'i');
    const companies = await transporterModel.find({ companyName: { $regex: regex } })
      .limit(10)
      .select('companyName');
    res.json(companies.map(c => c.companyName));
  } catch (err) {
    console.error('Fetch companies error:', err);
    res.status(500).json([]);
  }
}

export const getAllTransporters = async(req, res) => {
  try {
    const transporters = await transporterModel.find().select("-password -servicableZones -service");
    if (transporters.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No transporters found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Transporters fetched successfully",
      data: transporters,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

export const savePckingList = async(req, res) => {
  try {
    const { customerId, name, modeoftransport, originPincode, destinationPincode, noofboxes, quantity, length, width, height , weight} = req.body;
    if(!customerId || !name || !modeoftransport || !originPincode || !destinationPincode || !noofboxes || !length || !width || !height || !weight){
      return res.status(400).json({
        success: false,
        message: "Please fill all the fields",
      });
    }
    const data = await new packingModel({customerId, name, modeoftransport, originPincode, destinationPincode, noofboxes, length, width, height , weight}).save();
    if(data){
      return res.status(200).json({
        success: true,
        message: "Packing list saved successfully",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server Error"
    })
  }
}

export const getPackingList = async(req, res) => {
  try {
    const {customerId} = req.query;
    //console.log(customerId);
    const data = await packingModel.find({customerId});
    if(data){
      return res.status(200).json({
        success: true,
        message: "Packing list found successfully",
        data: data
      })
    }
    else{
      return res.status(404).json({
        success: false,
        message: "Packing list not found"
      })
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server Error"
    })
  }
}

export const getTrasnporterDetails = async(req, res) => {
  try {
    const {id} = req.params;
    const details = await transporterModel.findOne({_id: id}).select("-password -servicableZones -service");
    if(details){
      return res.status(200).json({
        success: true,
        data: details
      })
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: true,
      message: "Server Error"
    })
  }
}

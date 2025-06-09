import pincodeModel from "../model/pincodeModel.js";
import priceModel from "../model/priceModel.js";
import transporterModel from "../model/transporterModel.js";
//import customerpriceModel from "../model/customerpriceModel.js"

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
      state.trim() === "" ||
      !zone ||
      typeof zone !== "string" ||
      zone.trim() === ""
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
      state: state.trim(),
      zone: zone.trim(),
     
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
    weight
  } = req.body

  // 1) validate
  if (!modeoftransport || !fromPincode || !toPincode ||
      !noofboxes || !quantity ||
      !length || !width || !height || !weight
  ) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields'
    })
  }

  try {
    // 2) compute actual + volumetric weights
    const actualWeight = weight * noofboxes
    const fromData = await pincodeModel.findOne({ pincode: fromPincode })
    const toData   = await pincodeModel.findOne({ pincode: toPincode })

    if (!fromData || !toData) {
      return res.status(404).json({
        success: false,
        message: 'Invalid pincode(s)'
      })
    }

    const fromZone = fromData.zone
    const toZone   = toData.zone

    // load all rate cards (you can scope this to active ones if you like)
    const rateCards = await priceModel.find()

    // we’ll grab the first card’s zoneRates just to pull unitPrice…
    const rawZoneMap = rateCards[0].zoneRates.get(fromZone)
    if (!rawZoneMap) {
      return res.status(404).json({
        success: false,
        message: `No rates defined for zone ${fromZone}`
      })
    }

    // exact match
    let unitPrice = rawZoneMap[toZone]
    if (!unitPrice) {
      // fallback by first‐letter
      const first = toZone.charAt(0)
      const fallback = Object.keys(rawZoneMap).find(z => z.charAt(0) === first)
      if (fallback) {
        console.warn(`No exact rate for ${fromZone}->${toZone}, falling back to ${fallback}`)
        unitPrice = rawZoneMap[fallback]
      } else {
        return res.status(404).json({
          success: false,
          message: `No price from ${fromZone}→${toZone}`
        })
      }
    }

    // compute for each transporter’s card
    const result = await Promise.all(rateCards.map(async rateCard => {
      // base weights
      const divisor = rateCard.charges.divisor || 5000
      const volumetricWeight = (length * width * height) / divisor
      const chargeableWeight = Math.max(actualWeight, volumetricWeight)
      const baseFreight = chargeableWeight * unitPrice

      // docket
      const docketCharge = rateCard.charges.docketCharge || 0

      // fuel
      const fuelSurcharge = (rateCard.charges.fuelPercent / 100) * baseFreight

      // ROV
      const rovCharge = rateCard.charges.rovCharge
        ? Math.max(
            (baseFreight * rateCard.charges.rovCharge.percent) / 100,
            rateCard.charges.rovCharge.min
          )
        : 0

      // insurance
      const insuranceCharge = rateCard.charges.insuranceCharge
        ? Math.max(
            (baseFreight * rateCard.charges.insuranceCharge.percent) / 100,
            rateCard.charges.insuranceCharge.min
          )
        : 0

      // COD
      const codCharge = rateCard.charges.codCharge
        ? Math.max(
            rateCard.charges.codCharge.flat || 0,
            (baseFreight * rateCard.charges.codCharge.percent) / 100
          )
        : 0

      // handling (supports both schemas)
      const hc = rateCard.charges.handlingCharge || {}
      let handlingCharge = 0
      if (hc.benchmark != null) {
        // new style
        handlingCharge = baseFreight < hc.benchmark
          ? baseFreight * hc.below
          : baseFreight * hc.above

      } else if (hc['70-100'] != null || hc.above100 != null) {
        // bracket style
        if (chargeableWeight >= 70 && chargeableWeight <= 100 && hc['70-100']) {
          handlingCharge = hc['70-100']
        } else if (chargeableWeight > 100 && hc.above100) {
          handlingCharge = hc.above100
        }
      }

      // FM charge (per kg)
      const fmCharge = (rateCard.charges.fmCharge.perKg || 0) * chargeableWeight

      // appointment
      const appointmentCharge = rateCard.charges.appointmentCharge
        ? Math.max(
            rateCard.charges.appointmentCharge.perKg * chargeableWeight,
            rateCard.charges.appointmentCharge.perDocket || 0
          )
        : 0

      // check ODA flag on this transporter
      const transporterData = await transporterModel
        .findOne(
          { "service.pincode": toPincode },
          { companyName: 1, "service.$": 1 }
        )
        .lean()

      const isOda = transporterData?.service?.[0]?.oda === true
      let odaCharge = 0
      if (isOda && rateCard.charges.odaCharge) {
        odaCharge = Math.max(
          rateCard.charges.odaCharge.perKg * chargeableWeight,
          rateCard.charges.odaCharge.perDocket || 0
        )
      }

      // final tally
      const totalCharge =
        baseFreight +
        docketCharge +
        fuelSurcharge +
        rovCharge +
        insuranceCharge +
        codCharge +
        handlingCharge +
        fmCharge +
        appointmentCharge +
        odaCharge

      return {
        companyId:        rateCard.companyId,
        companyRateId:    rateCard._id,
        chargeableWeight: chargeableWeight.toFixed(2),
        ratePerKg:        unitPrice.toFixed(2),
        baseFreight:      baseFreight.toFixed(2),
        docketCharge:     docketCharge.toFixed(2),
        fuelSurcharge:    fuelSurcharge.toFixed(2),
        rovCharge:        rovCharge.toFixed(2),
        insuranceCharge:  insuranceCharge.toFixed(2),
        codCharge:        codCharge.toFixed(2),
        handlingCharge:   handlingCharge.toFixed(2),
        fmCharge:         fmCharge.toFixed(2),
        appointmentCharge:appointmentCharge.toFixed(2),
        odaCharge:        odaCharge.toFixed(2),
        isOda,
        totalCharge:      totalCharge.toFixed(2),
      }
    }))

    return res.status(200).json({
      success: true,
      data:    result,
      message: 'Price calculated successfully'
    })

  } catch (err) {
    console.error(err)
    return res.status(500).json({
      success: false,
      message: 'Server error'
    })
  }
}
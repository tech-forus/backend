
import mongoose from "mongoose";
import { Schema } from "mongoose";

const NestedPercentMinSchema = new Schema({
  percent: { type: Number, required: true },
  min:     { type: Number, required: true }
}, { _id: false })

const OdaAppointmentSchema = new Schema({
  perKg:    { type: Number, default: 0 },
  perDocket:{ type: Number, default: 0 }
}, { _id: false })

const ChargeBracketSchema = new Schema({}, { strict: false, _id: false })
// e.g. { "upTo5": 50, "to6-10": 75, "above10": 100 }

const ToZoneRatesSchema = new Schema({
}, { _id: false , strict: false });

const RateCardSchema = new Schema({
  companyId:   { type: mongoose.Schema.Types.ObjectId, ref:"transporters", required: true },
  zoneRates: {
    type: Map,
    of: ToZoneRatesSchema,
    required: true
  },
  charges: {
    divisor:           { type: Number, default: 5000 },
    minCharge:         { type: Number, default: 0 },
    docketCharge:      { type: Number, default: 0 },
    minWeight:         { type: Number, default: 0},
    fuelPercent:       { type: Number, default: 0 },
    rovCharge:         { type: NestedPercentMinSchema, required: false },
    insuranceCharge:   { type: NestedPercentMinSchema, required: false },
    greenTax:         { type: Number, default: 0 },
    collectionCharge:   { type: Number, default: 0 },
    codCharge: {
      flat:    { type: Number, default: 0 },
      percent: { type: Number, default: 0 }
    },
    odaCharge:         { type: OdaAppointmentSchema, required: false },
    appointmentCharge: { type: OdaAppointmentSchema, required: false },
    handlingCharge:    { type: ChargeBracketSchema, required: false },
    fmCharge: {
      perKg:    { type: Number, default: 0 },
      perDocket:{ type: Number, default: 0 }
    },
    miscellaneous: {type: Number, default: 0}
  }
}, { timestamps: true })

export default mongoose.model("prices", RateCardSchema);

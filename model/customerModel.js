import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone:{
    type:Number,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
  },
  companyName: {
    type: String,
    required: true,
    unique: true,
  },
  gstNumber: {
    type: String,
    required: true,
    unique: true,
  },
  businessType: {
    type: String,
    required: true,
  },
  monthlyOrder: {
    type: Number,
    required: true,
  },
  address: {
    type: String,
    required: true,
    unique: true,
  },
  state: {
    type: String,
    required: true,
  },
  pincode: {
    type: Number,
    required: true,
  },
  isSubscribed:{
    type:Boolean,
    default: false,
    required: true
  },
  tokenAvailable: { 
    type: Number,
    default: 10,
    required: true
  }
}, {timestamps: true});

export default mongoose.model("customers", customerSchema);
import mongoose from "mongoose";

const transporterSchema = new mongoose.Schema({
    companyName: {
        type: String,
        required: true,
        unique: true
    },
    service: [{
        pincode: {
            type: Number,
            required: true
        },
        isOda: {
            type: Boolean,
            default: false
        },
        zone: {
            type: String,
            required: true
        }
    }]
}, {timestamps: true});

export default mongoose.model("transporters", transporterSchema);
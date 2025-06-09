import mongoose from 'mongoose';

const pincodeSchema = new mongoose.Schema({
    pincode: {
        type: Number,
        required: true,
        unique: true
    },
    zone: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    }
}, {timestamps: true});

export default mongoose.model("pincodes", pincodeSchema);
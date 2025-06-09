import mongoose from "mongoose";

const usertransporterrelationshipSchema = new mongoose.Schema({
    userid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    prices: [{
        transporterid: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Transporter'
        },
        docket: {
            type: Number,
            required: true
        },
        fuelSurcharge: {
            type: Number,
            required: true
        },
        fovCharge: {
            type: Number,
            required: true
        },
        collectionCharge: {
            type: Number,
            required: true
        },
        greenTax: {
            type: Number,
            required: true
        },
        handlingCharge: {
            type: Number,
            required: true
        },
        daccCharge: {
            type: Number,
            required: true
        },
        miscCharge: {
            type: Number,
            required: true
        }
    }]    
}, {timestamps: true});

export default mongoose.model("usertransporterrelationship", usertransporterrelationshipSchema);
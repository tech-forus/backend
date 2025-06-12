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
    }],
    priceChart: {
        "N1":{
            "N1":{type: Number, default: 0},
            "N2":{type: Number, default: 0},
            "N2":{type: Number, default: 0},
            "N3":{type: Number, default: 0},
            "W1":{type: Number, default: 0},
            "W2":{type: Number, default: 0},
            "S1":{type: Number, default: 0},
            "S2":{type: Number, default: 0},
            "S3":{type: Number, default: 0},
            "E1":{type: Number, default: 0},
            "E2":{type: Number, default: 0},
            "C1":{type: Number, default: 0},
            "C2":{type: Number, default: 0},
            "NE1":{type: Number, default: 0},
            "NE2":{type: Number, default: 0}
        },
        "N2":{
            "N1":{type: Number, default: 0},
            "N2":{type: Number, default: 0},
            "N2":{type: Number, default: 0},
            "N3":{type: Number, default: 0},
            "W1":{type: Number, default: 0},
            "W2":{type: Number, default: 0},
            "S1":{type: Number, default: 0},
            "S2":{type: Number, default: 0},
            "S3":{type: Number, default: 0},
            "E1":{type: Number, default: 0},
            "E2":{type: Number, default: 0},
            "C1":{type: Number, default: 0},
            "C2":{type: Number, default: 0},
            "NE1":{type: Number, default: 0},
            "NE2":{type: Number, default: 0}
        },
        "N3":{
            "N1":{type: Number, default: 0},
            "N2":{type: Number, default: 0},
            "N2":{type: Number, default: 0},
            "N3":{type: Number, default: 0},
            "W1":{type: Number, default: 0},
            "W2":{type: Number, default: 0},
            "S1":{type: Number, default: 0},
            "S2":{type: Number, default: 0},
            "S3":{type: Number, default: 0},
            "E1":{type: Number, default: 0},
            "E2":{type: Number, default: 0},
            "C1":{type: Number, default: 0},
            "C2":{type: Number, default: 0},
            "NE1":{type: Number, default: 0},
            "NE2":{type: Number, default: 0}
        },
        "W1":{
            "N1":{type: Number, default: 0},
            "N2":{type: Number, default: 0},
            "N2":{type: Number, default: 0},
            "N3":{type: Number, default: 0},
            "W1":{type: Number, default: 0},
            "W2":{type: Number, default: 0},
            "S1":{type: Number, default: 0},
            "S2":{type: Number, default: 0},
            "S3":{type: Number, default: 0},
            "E1":{type: Number, default: 0},
            "E2":{type: Number, default: 0},
            "C1":{type: Number, default: 0},
            "C2":{type: Number, default: 0},
            "NE1":{type: Number, default: 0},
            "NE2":{type: Number, default: 0}
        },
        "W2":{
            "N1":{type: Number, default: 0},
            "N2":{type: Number, default: 0},
            "N2":{type: Number, default: 0},
            "N3":{type: Number, default: 0},
            "W1":{type: Number, default: 0},
            "W2":{type: Number, default: 0},
            "S1":{type: Number, default: 0},
            "S2":{type: Number, default: 0},
            "S3":{type: Number, default: 0},
            "E1":{type: Number, default: 0},
            "E2":{type: Number, default: 0},
            "C1":{type: Number, default: 0},
            "C2":{type: Number, default: 0},
            "NE1":{type: Number, default: 0},
            "NE2":{type: Number, default: 0}
        },
        "S1":{
            "N1":{type: Number, default: 0},
            "N2":{type: Number, default: 0},
            "N2":{type: Number, default: 0},
            "N3":{type: Number, default: 0},
            "W1":{type: Number, default: 0},
            "W2":{type: Number, default: 0},
            "S1":{type: Number, default: 0},
            "S2":{type: Number, default: 0},
            "S3":{type: Number, default: 0},
            "E1":{type: Number, default: 0},
            "E2":{type: Number, default: 0},
            "C1":{type: Number, default: 0},
            "C2":{type: Number, default: 0},
            "NE1":{type: Number, default: 0},
            "NE2":{type: Number, default: 0}
        },
        "S2":{
            "N1":{type: Number, default: 0},
            "N2":{type: Number, default: 0},
            "N2":{type: Number, default: 0},
            "N3":{type: Number, default: 0},
            "W1":{type: Number, default: 0},
            "W2":{type: Number, default: 0},
            "S1":{type: Number, default: 0},
            "S2":{type: Number, default: 0},
            "S3":{type: Number, default: 0},
            "E1":{type: Number, default: 0},
            "E2":{type: Number, default: 0},
            "C1":{type: Number, default: 0},
            "C2":{type: Number, default: 0},
            "NE1":{type: Number, default: 0},
            "NE2":{type: Number, default: 0}
        },
        "S3":{
            "N1":{type: Number, default: 0},
            "N2":{type: Number, default: 0},
            "N2":{type: Number, default: 0},
            "N3":{type: Number, default: 0},
            "W1":{type: Number, default: 0},
            "W2":{type: Number, default: 0},
            "S1":{type: Number, default: 0},
            "S2":{type: Number, default: 0},
            "S3":{type: Number, default: 0},
            "E1":{type: Number, default: 0},
            "E2":{type: Number, default: 0},
            "C1":{type: Number, default: 0},
            "C2":{type: Number, default: 0},
            "NE1":{type: Number, default: 0},
            "NE2":{type: Number, default: 0}
        },
        "E1":{
            "N1":{type: Number, default: 0},
            "N2":{type: Number, default: 0},
            "N2":{type: Number, default: 0},
            "N3":{type: Number, default: 0},
            "W1":{type: Number, default: 0},
            "W2":{type: Number, default: 0},
            "S1":{type: Number, default: 0},
            "S2":{type: Number, default: 0},
            "S3":{type: Number, default: 0},
            "E1":{type: Number, default: 0},
            "E2":{type: Number, default: 0},
            "C1":{type: Number, default: 0},
            "C2":{type: Number, default: 0},
            "NE1":{type: Number, default: 0},
            "NE2":{type: Number, default: 0}
        },
        "E2":{
            "N1":{type: Number, default: 0},
            "N2":{type: Number, default: 0},
            "N2":{type: Number, default: 0},
            "N3":{type: Number, default: 0},
            "W1":{type: Number, default: 0},
            "W2":{type: Number, default: 0},
            "S1":{type: Number, default: 0},
            "S2":{type: Number, default: 0},
            "S3":{type: Number, default: 0},
            "E1":{type: Number, default: 0},
            "E2":{type: Number, default: 0},
            "C1":{type: Number, default: 0},
            "C2":{type: Number, default: 0},
            "NE1":{type: Number, default: 0},
            "NE2":{type: Number, default: 0}
        },
        "C1":{
            "N1":{type: Number, default: 0},
            "N2":{type: Number, default: 0},
            "N2":{type: Number, default: 0},
            "N3":{type: Number, default: 0},
            "W1":{type: Number, default: 0},
            "W2":{type: Number, default: 0},
            "S1":{type: Number, default: 0},
            "S2":{type: Number, default: 0},
            "S3":{type: Number, default: 0},
            "E1":{type: Number, default: 0},
            "E2":{type: Number, default: 0},
            "C1":{type: Number, default: 0},
            "C2":{type: Number, default: 0},
            "NE1":{type: Number, default: 0},
            "NE2":{type: Number, default: 0}
        },
        "C2":{
            "N1":{type: Number, default: 0},
            "N2":{type: Number, default: 0},
            "N2":{type: Number, default: 0},
            "N3":{type: Number, default: 0},
            "W1":{type: Number, default: 0},
            "W2":{type: Number, default: 0},
            "S1":{type: Number, default: 0},
            "S2":{type: Number, default: 0},
            "S3":{type: Number, default: 0},
            "E1":{type: Number, default: 0},
            "E2":{type: Number, default: 0},
            "C1":{type: Number, default: 0},
            "C2":{type: Number, default: 0},
            "NE1":{type: Number, default: 0},
            "NE2":{type: Number, default: 0}
        },
        "NE1":{
            "N1":{type: Number, default: 0},
            "N2":{type: Number, default: 0},
            "N2":{type: Number, default: 0},
            "N3":{type: Number, default: 0},
            "W1":{type: Number, default: 0},
            "W2":{type: Number, default: 0},
            "S1":{type: Number, default: 0},
            "S2":{type: Number, default: 0},
            "S3":{type: Number, default: 0},
            "E1":{type: Number, default: 0},
            "E2":{type: Number, default: 0},
            "C1":{type: Number, default: 0},
            "C2":{type: Number, default: 0},
            "NE1":{type: Number, default: 0},
            "NE2":{type: Number, default: 0}
        },
        "NE2":{
            "N1":{type: Number, default: 0},
            "N2":{type: Number, default: 0},
            "N2":{type: Number, default: 0},
            "N3":{type: Number, default: 0},
            "W1":{type: Number, default: 0},
            "W2":{type: Number, default: 0},
            "S1":{type: Number, default: 0},
            "S2":{type: Number, default: 0},
            "S3":{type: Number, default: 0},
            "E1":{type: Number, default: 0},
            "E2":{type: Number, default: 0},
            "C1":{type: Number, default: 0},
            "C2":{type: Number, default: 0},
            "NE1":{type: Number, default: 0},
            "NE2":{type: Number, default: 0}
        }
    }
}, {timestamps: true});

export default mongoose.model("usertransporterrelationship", usertransporterrelationshipSchema);
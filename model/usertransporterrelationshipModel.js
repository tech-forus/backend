import mongoose from "mongoose";

const usertransporterrelationshipSchema = new mongoose.Schema(
  {
    customerID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "customers",
    },
    transporterName: {
      type: String,
      required: true,
    },
    prices: [
      {
        priceRate: {
          minWeight: {
            type: Number,
            required: true,
            default: 0,
          },
          docketCharges: {
            type: Number,
            required: true,
            default: 0,
          },
          fuel: {
            type: Number,
            required: true,
            default: 0,
          },
          rovCharges: {
            variable: {
              type: Number,
              required: true,
              default: 0,
            },
            fixed: {
              type: Number,
              required: true,
              default: 0,
            },
          },
          inuaranceCharges: {
            variable: {
              type: Number,
              required: true,
              default: 0,
            },
            fixed: {
              type: Number,
              required: true,
              default: 0,
            },
          },
          odaCharges: {
            variable: {
              type: Number,
              required: true,
              default: 0,
            },
            fixed: {
              type: Number,
              required: true,
              default: 0,
            },
          },
          codCharges: {
            variable: {
              type: Number,
              required: true,
              default: 0,
            },
            fixed: {
              type: Number,
              required: true,
              default: 0,
            },
          },
          prepaidCharges: {
            variable: {
              type: Number,
              required: true,
              default: 0,
            },
            fixed: {
              type: Number,
              required: true,
              default: 0,
            },
          },
          topayCharges: {
            variable: {
              type: Number,
              required: true,
              default: 0,
            },
            fixed: {
              type: Number,
              required: true,
              default: 0,
            },
          },
          handlingCharges: {
            variable: {
              type: Number,
              required: true,
              default: 0,
            },
            fixed: {
              type: Number,
              required: true,
              default: 0,
            },
          },
          fmCharges: {
            variable: {
              type: Number,
              required: true,
              default: 0,
            },
            fixed: {
              type: Number,
              required: true,
              default: 0,
            },
          },
          appointmentCharges: {
            variable: {
              type: Number,
              required: true,
              default: 0,
            },
            fixed: {
              type: Number,
              required: true,
              default: 0,
            },
          },
          divisor: {
            type: Number,
            required: true,
            default: 1,
          },
          minCharges: {
            type: Number,
            required: true,
            default: 0,
          },
          greenTax: {
            type: Number,
            required: true,
            default: 0,
          },
          daccCharges: {
            type: Number,
            required: true,
            default: 0,
          },
          miscellanousCharges: {
            type: Number,
            required: true,
            default: 0,
          },
        },
      },
    ],
    priceChart: {
    }
  },
  { timestamps: true, strict: false}
);

export default mongoose.model(
  "usertransporterrelationship",
  usertransporterrelationshipSchema
);

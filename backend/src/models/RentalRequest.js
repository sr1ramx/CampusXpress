const mongoose = require("mongoose");

const rentalMessageSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    senderRole: { type: String, enum: ["lender", "renter"], required: true },
    text: { type: String, default: "" },
    offeredPricePerDay: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const rentalRequestSchema = new mongoose.Schema(
  {
    rentItemId: { type: mongoose.Schema.Types.ObjectId, ref: "RentItem", required: true },
    lenderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    renterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    durationDays: { type: Number, required: true },
    negotiatedPricePerDay: { type: Number, default: 0 },
    totalCost: { type: Number, required: true },
    contact: { type: String, default: "" },
    messages: [rentalMessageSchema],
    status: {
      type: String,
      enum: ["Requested", "Approved", "Rejected", "Completed"],
      default: "Requested"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("RentalRequest", rentalRequestSchema);

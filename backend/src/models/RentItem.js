const mongoose = require("mongoose");

const rentItemSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    category: { type: String, default: "Other" },
    condition: { type: String, default: "Good" },
    location: { type: String, default: "Campus" },
    pricePerDay: { type: Number, required: true },
    images: [{ type: String }],
    availability: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("RentItem", rentItemSchema);

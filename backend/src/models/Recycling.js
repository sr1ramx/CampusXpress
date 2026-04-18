const mongoose = require("mongoose");

const recyclingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    material: {
      type: String,
      enum: ["plastic", "paper", "metal"],
      required: true
    },
    itemType: { type: String, default: "" },
    quantity: { type: Number, default: 1 },
    sizeType: { type: String, default: "" },
    weight: { type: Number, default: 0 },
    carbonSaved: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Requested", "Picked", "Processed"],
      default: "Requested"
    },
    scheduledAt: { type: String, default: "Today" },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      address: { type: String, default: "Campus Recycling Point" }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Recycling", recyclingSchema);

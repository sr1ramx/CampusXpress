const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
    recyclingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recycling",
      default: null
    },
    route: {
      start: {
        lat: { type: Number, default: 12.9716 },
        lng: { type: Number, default: 77.5946 }
      },
      stops: [
        {
          kind: { type: String, enum: ["delivery", "recycling"] },
          lat: Number,
          lng: Number,
          address: String
        }
      ]
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "In Transit", "Completed"],
      default: "Pending"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);

const mongoose = require("mongoose");

const orderChatSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    senderRole: { type: String, enum: ["user", "partner", "admin"], required: true },
    text: { type: String, required: true }
  },
  { timestamps: true }
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        name: { type: String, required: true },
        category: { type: String, enum: ["Food", "Grocery", "Stationery", "Library"] },
        price: { type: Number, default: 0 },
        quantity: { type: Number, default: 1 },
        borrowDays: { type: Number, default: 0 },
        returnDate: { type: String, default: "" }
      }
    ],
    status: {
      type: String,
      enum: ["Preparing", "Out for delivery", "Delivered"],
      default: "Preparing"
    },
    priority: { type: Boolean, default: false },
    deliveryType: { type: String, enum: ["Instant", "Scheduled"], default: "Instant" },
    scheduledDate: { type: String, default: "" },
    scheduledTime: { type: String, default: "" },
    preOrderSlot: { type: String, default: "ASAP" },
    paymentMethod: {
      type: String,
      enum: ["UPI", "Card", "Wallet", "Cash"],
      default: "UPI"
    },
    paymentStatus: {
      type: String,
      enum: ["Requested", "Paid"],
      default: "Requested"
    },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      address: { type: String, default: "Campus Zone" },
      block: { type: String, default: "Main Block" },
      room: { type: String, default: "" }
    },
    chatMessages: [orderChatSchema],
    etaMinutes: { type: Number, default: 15 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);

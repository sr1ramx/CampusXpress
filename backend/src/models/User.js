const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    phone: { type: String, default: "" },
    language: { type: String, default: "en" },
    preferences: {
      notifications: { type: Boolean, default: true },
      darkMode: { type: Boolean, default: false },
      accountPreferences: { type: String, default: "" }
    },
    points: { type: Number, default: 0 },
    walletTransactions: [
      {
        type: {
          type: String,
          enum: ["earn", "redeem"],
          required: true
        },
        points: { type: Number, required: true },
        note: { type: String, default: "" },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    role: {
      type: String,
      enum: ["user", "partner", "admin"],
      default: "user"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

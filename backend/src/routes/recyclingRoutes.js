const express = require("express");
const Recycling = require("../models/Recycling");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const { validateRecycleRequest } = require("../middleware/validators");
const { calculateCarbonSaved } = require("../utils/eco");
const { createTaskFromRecycling } = require("../utils/taskEngine");

const router = express.Router();

const pointsPerKg = {
  plastic: 6,
  paper: 4,
  metal: 5
};

const sizePointsMap = {
  plastic: {
    "250ml": 1,
    "500ml": 2,
    "1L": 4
  },
  paper: {
    sheets: 1,
    kg: 4
  },
  metal: {
    can: 2,
    heavy: 5
  }
};

const estimateWeight = (material, sizeType, quantity) => {
  if (material === "plastic") {
    if (sizeType === "250ml") return quantity * 0.05;
    if (sizeType === "500ml") return quantity * 0.1;
    if (sizeType === "1L") return quantity * 0.2;
  }
  if (material === "paper") {
    if (sizeType === "sheets") return quantity * 0.01;
    return quantity;
  }
  if (material === "metal") {
    if (sizeType === "can") return quantity * 0.08;
    return quantity * 0.2;
  }
  return quantity;
};

router.post("/", protect, validateRecycleRequest, async (req, res, next) => {
  try {
    const { material, itemType, quantity, sizeType, weight, scheduledAt, location } = req.body;
    const qty = Number(quantity || 1);

    const derivedWeight = Number(weight || estimateWeight(material, sizeType, qty));
    const carbonSaved = calculateCarbonSaved(material, derivedWeight);

    const sizePoints = sizePointsMap[material]?.[sizeType] || 0;
    const earnedPoints = sizePoints
      ? Math.round(sizePoints * qty)
      : Math.round((pointsPerKg[material] || 0) * derivedWeight);

    const request = await Recycling.create({
      userId: req.user.id,
      material,
      itemType,
      quantity: qty,
      sizeType,
      weight: derivedWeight,
      carbonSaved,
      scheduledAt,
      location
    });

    await User.findByIdAndUpdate(req.user.id, {
      $inc: { points: earnedPoints },
      $push: {
        walletTransactions: {
          type: "earn",
          points: earnedPoints,
          note: `Recycling ${itemType} (${qty} x ${sizeType || material})`
        }
      }
    });
    await createTaskFromRecycling(request);

    res.status(201).json({ ...request.toObject(), earnedPoints });
  } catch (error) {
    next(error);
  }
});

router.get("/mine", protect, async (req, res) => {
  const requests = await Recycling.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json(requests);
});

module.exports = router;

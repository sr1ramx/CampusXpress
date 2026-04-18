const express = require("express");
const User = require("../models/User");
const Recycling = require("../models/Recycling");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/me", protect, async (req, res) => {
  const user = await User.findById(req.user.id);
  const recycling = await Recycling.find({ userId: req.user.id });

  const totalRecycled = recycling.reduce((sum, r) => sum + r.weight, 0);
  const carbonSaved = recycling.reduce((sum, r) => sum + r.carbonSaved, 0);
  const ecoScore = Math.min(100, Math.round(totalRecycled * 2 + carbonSaved + user.points / 5));

  res.json({
    points: user.points,
    totalRecycled,
    carbonSaved: Number(carbonSaved.toFixed(2)),
    ecoScore
  });
});

router.get("/wallet", protect, async (req, res) => {
  const user = await User.findById(req.user.id, "points walletTransactions");
  const transactions = [...(user.walletTransactions || [])].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  res.json({
    points: user.points,
    transactions
  });
});

router.post("/redeem", protect, async (req, res) => {
  const { points = 0 } = req.body;
  const user = await User.findById(req.user.id);

  if (user.points < points) {
    return res.status(400).json({ message: "Insufficient points" });
  }

  user.points -= points;
  user.walletTransactions.push({
    type: "redeem",
    points,
    note: "Checkout points redemption"
  });
  await user.save();

  const discount = Number((points / 100).toFixed(2));
  res.json({ message: "Points redeemed", pointsLeft: user.points, discount });
});

module.exports = router;

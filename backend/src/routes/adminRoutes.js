const express = require("express");
const User = require("../models/User");
const Order = require("../models/Order");
const Recycling = require("../models/Recycling");
const { protect, requireRole } = require("../middleware/auth");

const router = express.Router();

router.use(protect, requireRole("admin"));

router.get("/orders", async (req, res) => {
  const orders = await Order.find().populate("userId", "name email").sort({ createdAt: -1 });
  res.json(orders);
});

router.get("/users", async (req, res) => {
  const users = await User.find({}, "name email role points createdAt").sort({ createdAt: -1 });
  res.json(users);
});

router.patch("/orders/:id/priority", async (req, res) => {
  const order = await Order.findByIdAndUpdate(req.params.id, { priority: true }, { new: true });
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  res.json(order);
});

router.get("/analytics", async (req, res) => {
  const totalOrders = await Order.countDocuments();
  const revenueStats = await Order.aggregate([
    {
      $project: {
        orderTotal: {
          $sum: {
            $map: {
              input: "$items",
              as: "item",
              in: { $multiply: ["$$item.price", "$$item.quantity"] }
            }
          }
        }
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$orderTotal" }
      }
    }
  ]);

  const recyclingStats = await Recycling.aggregate([
    {
      $group: {
        _id: null,
        totalRequests: { $sum: 1 },
        totalWeight: { $sum: "$weight" },
        carbonSaved: { $sum: "$carbonSaved" }
      }
    }
  ]);

  res.json({
    totalOrders,
    totalRevenue: revenueStats[0]?.totalRevenue || 0,
    recycling: recyclingStats[0] || { totalWeight: 0, carbonSaved: 0 }
  });
});

module.exports = router;

const express = require("express");
const Task = require("../models/Task");
const Order = require("../models/Order");
const Recycling = require("../models/Recycling");
const { protect, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/partner", protect, requireRole("partner", "admin"), async (req, res) => {
  const tasks = await Task.find({ status: { $ne: "Completed" } })
    .populate("orderId")
    .populate("recyclingId")
    .sort({ createdAt: -1 });

  res.json(tasks);
});

router.get("/by-order/:orderId", protect, async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  if (req.user.role === "user" && String(order.userId) !== req.user.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const task = await Task.findOne({ orderId: req.params.orderId })
    .populate("recyclingId")
    .populate("assignedTo", "name email");

  if (!task) {
    return res.json({ hasTask: false, ecoOptimized: false });
  }

  return res.json({
    hasTask: true,
    ecoOptimized: Boolean(task.orderId && task.recyclingId),
    task
  });
});

router.post("/:taskId/accept", protect, requireRole("partner", "admin"), async (req, res) => {
  const task = await Task.findByIdAndUpdate(
    req.params.taskId,
    { assignedTo: req.user.id, status: "Accepted" },
    { new: true }
  );

  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  res.json(task);
});

router.patch("/:taskId/status", protect, requireRole("partner", "admin"), async (req, res) => {
  const { status } = req.body;
  const task = await Task.findByIdAndUpdate(req.params.taskId, { status }, { new: true });

  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  if (status === "Completed") {
    if (task.orderId) {
      await Order.findByIdAndUpdate(task.orderId, { status: "Delivered" });
    }
    if (task.recyclingId) {
      await Recycling.findByIdAndUpdate(task.recyclingId, { status: "Processed" });
    }
  }

  res.json(task);
});

module.exports = router;

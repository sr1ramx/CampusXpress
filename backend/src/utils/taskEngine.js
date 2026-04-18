const Task = require("../models/Task");
const Order = require("../models/Order");
const Recycling = require("../models/Recycling");
const { shouldMergeTasks } = require("./routeOptimizer");

const buildStop = (kind, location) => ({
  kind,
  lat: location.lat,
  lng: location.lng,
  address: location.address
});

const createTaskFromOrder = async (order) => {
  const pendingRecycling = await Recycling.findOne({
    userId: order.userId,
    status: "Requested",
    _id: { $nin: await Task.distinct("recyclingId", { recyclingId: { $ne: null } }) }
  }).sort({ createdAt: -1 });

  if (pendingRecycling && shouldMergeTasks(order.location, pendingRecycling.location)) {
    return Task.create({
      orderId: order._id,
      recyclingId: pendingRecycling._id,
      route: {
        stops: [buildStop("delivery", order.location), buildStop("recycling", pendingRecycling.location)]
      }
    });
  }

  return Task.create({
    orderId: order._id,
    route: { stops: [buildStop("delivery", order.location)] }
  });
};

const createTaskFromRecycling = async (recycling) => {
  const pendingOrder = await Order.findOne({
    userId: recycling.userId,
    status: { $ne: "Delivered" },
    _id: { $nin: await Task.distinct("orderId", { orderId: { $ne: null } }) }
  }).sort({ createdAt: -1 });

  if (pendingOrder && shouldMergeTasks(pendingOrder.location, recycling.location)) {
    return Task.create({
      orderId: pendingOrder._id,
      recyclingId: recycling._id,
      route: {
        stops: [buildStop("delivery", pendingOrder.location), buildStop("recycling", recycling.location)]
      }
    });
  }

  return Task.create({
    recyclingId: recycling._id,
    route: { stops: [buildStop("recycling", recycling.location)] }
  });
};

module.exports = {
  createTaskFromOrder,
  createTaskFromRecycling
};

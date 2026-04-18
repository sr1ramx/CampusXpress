const predictEta = ({ distanceKm = 1, activeOrders = 0 }) => {
  // Simulated AI formula required by spec: ETA = Distance x 2 + Active Orders x 5
  const eta = distanceKm * 2 + activeOrders * 5;
  return Math.max(5, Math.round(eta));
};

module.exports = {
  predictEta
};

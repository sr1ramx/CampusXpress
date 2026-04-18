const toRadians = (deg) => (deg * Math.PI) / 180;

const haversineDistanceKm = (from, to) => {
  const earthRadius = 6371;
  const dLat = toRadians((to.lat || 0) - (from.lat || 0));
  const dLng = toRadians((to.lng || 0) - (from.lng || 0));
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(from.lat || 0)) *
      Math.cos(toRadians(to.lat || 0)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
};

const shouldMergeTasks = (deliveryLocation, recyclingLocation, thresholdKm = 1.2) => {
  if (!deliveryLocation || !recyclingLocation) {
    return false;
  }

  const distance = haversineDistanceKm(deliveryLocation, recyclingLocation);
  return distance <= thresholdKm;
};

module.exports = {
  haversineDistanceKm,
  shouldMergeTasks
};

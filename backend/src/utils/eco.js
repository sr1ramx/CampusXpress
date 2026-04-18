const MATERIAL_FACTORS = {
  plastic: 2.5,
  paper: 1.5,
  metal: 3.0
};

const calculateCarbonSaved = (material, weight) => {
  const factor = MATERIAL_FACTORS[material] || 0;
  return Number((factor * Number(weight || 0)).toFixed(2));
};

module.exports = {
  MATERIAL_FACTORS,
  calculateCarbonSaved
};

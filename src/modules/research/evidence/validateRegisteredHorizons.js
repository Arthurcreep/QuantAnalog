const validateRegisteredHorizons = (run) => {
  const registered = run.config?.protocol?.horizons;
  const results = run.metrics?.horizons;
  if (!Array.isArray(registered) || registered.length === 0) return "REGISTERED_HORIZONS_MISSING";
  if (!Array.isArray(results) || results.length !== registered.length) return "HORIZON_RESULTS_INCOMPLETE";
  const labels = new Set();
  for (const horizon of registered) {
    if (typeof horizon.label !== "string" || !horizon.label || !Number.isInteger(horizon.bars) || horizon.bars <= 0 || labels.has(horizon.label)) return "INVALID_REGISTERED_HORIZONS";
    labels.add(horizon.label);
    const matches = results.filter((item) => item.horizon === horizon.label && item.horizonBars === horizon.bars);
    if (matches.length !== 1) return "HORIZON_RESULTS_MISMATCH";
  }
  return null;
};
module.exports = { validateRegisteredHorizons };

const calculateRollingRealizedVolatility = ({ series, windowSize, expectedIntervalMs }) => {
  if (!Array.isArray(series)) throw new Error("INVALID_RETURN_SERIES");
  if (!Number.isInteger(windowSize) || windowSize <= 0) throw new Error("INVALID_VOLATILITY_WINDOW");
  if (!Number.isSafeInteger(expectedIntervalMs) || expectedIntervalMs <= 0) throw new Error("INVALID_EXPECTED_INTERVAL");
  const result = [];
  let sumSquares = 0;
  let segmentStart = 0;
  let previousTime = null;
  for (let index = 0; index < series.length; index += 1) {
    const timestamp = Date.parse(series[index].timestamp);
    const value = Number(series[index].logReturn);
    if (!Number.isFinite(timestamp)) throw new Error("INVALID_SERIES_TIMESTAMP");
    if (!Number.isFinite(value)) throw new Error("INVALID_RETURN_VALUE");
    if (previousTime !== null) {
      const delta = timestamp - previousTime;
      if (delta <= 0 || delta % expectedIntervalMs !== 0) throw new Error("INVALID_SERIES_ORDER_OR_ALIGNMENT");
      if (delta !== expectedIntervalMs) {
        segmentStart = index;
        sumSquares = 0;
      }
    }
    sumSquares += value ** 2;
    if (index - segmentStart >= windowSize) sumSquares -= Number(series[index - windowSize].logReturn) ** 2;
    if (index - segmentStart + 1 >= windowSize) {
      const variance = Math.max(sumSquares, 0);
      result.push({ timestamp: series[index].timestamp, windowSize, realizedVariance: variance, realizedVolatility: Math.sqrt(variance) });
    }
    previousTime = timestamp;
  }
  return result;
};

module.exports = { calculateRollingRealizedVolatility };

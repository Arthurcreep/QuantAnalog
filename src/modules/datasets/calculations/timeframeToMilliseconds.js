const TIMEFRAME_MULTIPLIERS = {
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

const timeframeToMilliseconds = (timeframe) => {
  if (typeof timeframe !== "string") {
    return null;
  }

  const match = timeframe.match(/^(\d+)(m|h|d)$/);

  if (!match) {
    return null;
  }

  const value = Number(match[1]);
  const unit = match[2];

  if (!Number.isInteger(value) || value <= 0) {
    return null;
  }

  return value * TIMEFRAME_MULTIPLIERS[unit];
};

module.exports = {
  timeframeToMilliseconds,
};
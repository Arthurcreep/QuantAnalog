const FEATURES = [
  {
    id:
      "LOG_RETURN",

    family:
      "MARKET",

    version:
      "1.0.0",

    status:
      "IMPLEMENTED",

    source:
      "CANDLES",

    description:
      "Logarithmic return between consecutive valid closes",
  },

  {
    id:
      "ABS_RETURN",

    family:
      "VOLATILITY",

    version:
      "1.0.0",

    status:
      "IMPLEMENTED",

    source:
      "LOG_RETURN",

    description:
      "Absolute logarithmic return",
  },

  {
    id:
      "SQUARED_RETURN",

    family:
      "VOLATILITY",

    version:
      "1.0.0",

    status:
      "IMPLEMENTED",

    source:
      "LOG_RETURN",

    description:
      "Squared logarithmic return",
  },

  {
    id:
      "REALIZED_VOLATILITY",

    family:
      "VOLATILITY",

    version:
      "1.0.0",

    status:
      "IMPLEMENTED",

    source:
      "LOG_RETURN",

    parameters: [
      "windowSize",
    ],

    description:
      "Rolling realized volatility from squared returns",
  },

  {
    id:
      "VOLUME_ZSCORE",

    family:
      "VOLUME",

    version:
      "1.0.0",

    status:
      "IMPLEMENTED",

    source:
      "CANDLES",

    parameters: [
      "windowSizeBars",
      "transform",
      "baselineMode",
      "standardDeviation",
    ],

    description:
      "Gap-safe rolling Z-score of log1p candle volume using only previous completed bars",
  },

  {
    id:
      "CALENDAR_HOUR_UTC",

    family:
      "CALENDAR",

    version:
      "1.0.0",

    status:
      "IMPLEMENTED",

    source:
      "TIMESTAMP",
  },

  {
    id:
      "CALENDAR_WEEKDAY_UTC",

    family:
      "CALENDAR",

    version:
      "1.0.0",

    status:
      "IMPLEMENTED",

    source:
      "TIMESTAMP",
  },

  {
    id:
      "CALENDAR_IS_WEEKEND",

    family:
      "CALENDAR",

    version:
      "1.0.0",

    status:
      "IMPLEMENTED",

    source:
      "TIMESTAMP",
  },

  {
    id:
      "CALENDAR_MONTH_UTC",

    family:
      "CALENDAR",

    version:
      "1.0.0",

    status:
      "IMPLEMENTED",

    source:
      "TIMESTAMP",
  },

  {
    id:
      "BYBIT_FUNDING_RATE",

    family:
      "DERIVATIVES",

    version:
      "1.0.0",

    status:
      "PLANNED",

    source:
      "BYBIT_API",
  },

  {
    id:
      "OPEN_INTEREST_CHANGE",

    family:
      "DERIVATIVES",

    version:
      "1.0.0",

    status:
      "PLANNED",

    source:
      "OPEN_INTEREST",
  },

  {
    id:
      "CROSS_ASSET_LAGGED_RETURN",

    family:
      "CROSS_ASSET",

    version:
      "1.0.0",

    status:
      "PLANNED",

    source:
      "MULTI_ASSET",
  },

  {
    id:
      "LUNAR_PHASE",

    family:
      "EXPERIMENTAL",

    version:
      "1.0.0",

    status:
      "PLANNED",

    source:
      "TIMESTAMP",
  },
];

const getFeatureById = (
  id
) =>
  FEATURES.find(
    (feature) =>
      feature.id ===
      id
  ) ?? null;

const listFeatures = () =>
  FEATURES.map(
    (feature) => ({
      ...feature,
    })
  );

const listFeaturesByFamily = (
  family
) =>
  FEATURES.filter(
    (feature) =>
      feature.family ===
      family
  ).map(
    (feature) => ({
      ...feature,
    })
  );

module.exports = {
  getFeatureById,
  listFeatures,
  listFeaturesByFamily,
};
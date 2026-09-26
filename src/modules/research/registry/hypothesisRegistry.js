const SYSTEM_HYPOTHESES = [
  {
    id: "H_VOL_001",
    version: "1.0.0",

    source: "SYSTEM",
    mode: "CONFIRMATORY",

    family:
      "VOLATILITY_STRUCTURE",

    title:
      "Volatility clustering",

    hypothesis:
      "Absolute and squared returns exhibit persistent serial dependence",

    requiredData: [
      "CANDLES",
    ],

    features: [
      "ABS_RETURN",
      "SQUARED_RETURN",
    ],

    targets: [],

    status:
      "FROZEN",
  },

  {
    id: "H_CAL_001",
    version: "1.0.0",

    source: "SYSTEM",
    mode: "CONFIRMATORY",

    family:
      "CALENDAR",

    title:
      "Hour UTC and future volatility",

    hypothesis:
      "Calendar hour UTC is associated with future realized volatility",

    requiredData: [
      "CANDLES",
    ],

    features: [
      "CALENDAR_HOUR_UTC",
    ],

    targets: [
      "FUTURE_REALIZED_VOLATILITY",
    ],

    modelTimeframes: [
      "1h",
    ],

    horizons: [
      1,
      4,
      6,
      12,
      24,
    ],

    multipleTestingFamily:
      "CALENDAR_FUTURE_RV_V1",

    status:
      "FROZEN",
  },

  {
    id: "H_CAL_002",
    version: "1.0.0",

    source: "SYSTEM",
    mode: "CONFIRMATORY",

    family:
      "CALENDAR",

    title:
      "Weekday UTC and future volatility",

    hypothesis:
      "Calendar weekday UTC is associated with future realized volatility",

    requiredData: [
      "CANDLES",
    ],

    features: [
      "CALENDAR_WEEKDAY_UTC",
    ],

    targets: [
      "FUTURE_REALIZED_VOLATILITY",
    ],

    modelTimeframes: [
      "1h",
    ],

    horizons: [
      1,
      4,
      6,
      12,
      24,
    ],

    multipleTestingFamily:
      "CALENDAR_FUTURE_RV_V1",

    status:
      "TESTED",
  },

  {
    id: "H_CAL_003",
    version: "1.0.0",

    source: "SYSTEM",
    mode: "CONFIRMATORY",

    family:
      "CALENDAR",

    title:
      "Weekend and future volatility",

    hypothesis:
      "Weekend observations differ from weekdays in future realized volatility",

    requiredData: [
      "CANDLES",
    ],

    features: [
      "CALENDAR_IS_WEEKEND",
    ],

    targets: [
      "FUTURE_REALIZED_VOLATILITY",
    ],

    modelTimeframes: [
      "1h",
    ],

    horizons: [
      1,
      4,
      6,
      12,
      24,
    ],

    multipleTestingFamily:
      "CALENDAR_FUTURE_RV_V1",

    status:
      "REGISTERED",
  },

  {
    id: "H_CAL_004",
    version: "1.0.0",

    source: "SYSTEM",
    mode: "CONFIRMATORY",

    family:
      "CALENDAR",

    title:
      "Month UTC and future volatility",

    hypothesis:
      "Calendar month UTC is associated with future realized volatility",

    requiredData: [
      "CANDLES",
    ],

    features: [
      "CALENDAR_MONTH_UTC",
    ],

    targets: [
      "FUTURE_REALIZED_VOLATILITY",
    ],

    modelTimeframes: [
      "1h",
    ],

    horizons: [
      1,
      4,
      6,
      12,
      24,
    ],

    multipleTestingFamily:
      "CALENDAR_FUTURE_RV_V1",

    status:
      "REGISTERED",
  },

  {
    id: "H_RET_001",
    version: "1.0.0",

    source: "SYSTEM",
    mode: "CONFIRMATORY",

    family:
      "RETURN_STRUCTURE",

    title:
      "Lagged return and future return",

    hypothesis:
      "Lagged return contains information about future return",

    requiredData: [
      "CANDLES",
    ],

    features: [
      "LOG_RETURN",
    ],

    targets: [
      "FUTURE_LOG_RETURN",
    ],

    status:
      "REGISTERED",
  },

  {
    id: "H_VOL_002",
    version: "1.0.0",

    source: "SYSTEM",
    mode: "CONFIRMATORY",

    family:
      "VOLATILITY_STRUCTURE",

    title:
      "Current volatility and future volatility",

    hypothesis:
      "Current realized volatility is associated with future realized volatility",

    requiredData: [
      "CANDLES",
    ],

    features: [
      "REALIZED_VOLATILITY",
    ],

    targets: [
      "FUTURE_REALIZED_VOLATILITY",
    ],

    status:
      "REGISTERED",
  },

  {
    id: "H_VOL_003",
    version: "1.0.0",

    source: "SYSTEM",
    mode: "CONFIRMATORY",

    family:
      "VOLATILITY_STRUCTURE",

    title:
      "Absolute return shock and future volatility",

    hypothesis:
      "Large absolute returns are associated with elevated future realized volatility",

    requiredData: [
      "CANDLES",
    ],

    features: [
      "ABS_RETURN",
    ],

    targets: [
      "FUTURE_REALIZED_VOLATILITY",
    ],

    status:
      "REGISTERED",
  },

  {
    id: "H_VOLM_001",
    version: "1.0.0",

    source: "SYSTEM",
    mode: "CONFIRMATORY",

    family:
      "VOLUME",

    title:
      "Volume shock and future volatility",

    hypothesis:
      "Abnormally high volume is associated with future realized volatility",

    requiredData: [
      "CANDLES",
    ],

    features: [
      "VOLUME_ZSCORE",
    ],

    targets: [
      "FUTURE_REALIZED_VOLATILITY",
    ],

    status:
      "REGISTERED",
  },

  {
    id: "H_VOLM_002",
    version: "1.0.0",

    source: "SYSTEM",
    mode: "CONFIRMATORY",

    family:
      "VOLUME",

    title:
      "Volume shock and future return",

    hypothesis:
      "Abnormally high volume is associated with future return",

    requiredData: [
      "CANDLES",
    ],

    features: [
      "VOLUME_ZSCORE",
    ],

    targets: [
      "FUTURE_LOG_RETURN",
    ],

    status:
      "REGISTERED",
  },

  {
    id: "H_FUND_001",
    version: "1.0.0",

    source: "SYSTEM",
    mode: "CONFIRMATORY",

    family:
      "DERIVATIVES_FUNDING",

    title:
      "Funding extreme and future return",

    hypothesis:
      "Extreme perpetual funding rates are associated with future returns",

    requiredData: [
      "CANDLES",
      "FUNDING",
    ],

    features: [
      "BYBIT_FUNDING_RATE",
    ],

    targets: [
      "FUTURE_LOG_RETURN",
    ],

    status:
      "REGISTERED",
  },

  {
    id: "H_FUND_002",
    version: "1.0.0",

    source: "SYSTEM",
    mode: "CONFIRMATORY",

    family:
      "DERIVATIVES_FUNDING",

    title:
      "Funding extreme and future volatility",

    hypothesis:
      "Extreme perpetual funding rates are associated with future realized volatility",

    requiredData: [
      "CANDLES",
      "FUNDING",
    ],

    features: [
      "BYBIT_FUNDING_RATE",
    ],

    targets: [
      "FUTURE_REALIZED_VOLATILITY",
    ],

    status:
      "REGISTERED",
  },

  {
    id: "H_OI_001",
    version: "1.0.0",

    source: "SYSTEM",
    mode: "CONFIRMATORY",

    family:
      "DERIVATIVES_OI",

    title:
      "Open interest change and future return",

    hypothesis:
      "Open interest change is associated with future return",

    requiredData: [
      "CANDLES",
      "OPEN_INTEREST",
    ],

    features: [
      "OPEN_INTEREST_CHANGE",
    ],

    targets: [
      "FUTURE_LOG_RETURN",
    ],

    status:
      "REGISTERED",
  },

  {
    id: "H_OI_002",
    version: "1.0.0",

    source: "SYSTEM",
    mode: "CONFIRMATORY",

    family:
      "DERIVATIVES_OI",

    title:
      "Open interest change and future volatility",

    hypothesis:
      "Open interest change is associated with future realized volatility",

    requiredData: [
      "CANDLES",
      "OPEN_INTEREST",
    ],

    features: [
      "OPEN_INTEREST_CHANGE",
    ],

    targets: [
      "FUTURE_REALIZED_VOLATILITY",
    ],

    status:
      "REGISTERED",
  },

  {
    id: "H_CROSS_001",
    version: "1.0.0",

    source: "SYSTEM",
    mode: "CONFIRMATORY",

    family:
      "CROSS_ASSET",

    title:
      "BTC shock and follower return",

    hypothesis:
      "A BTC return shock contains information about subsequent returns of another asset",

    requiredData: [
      "MULTI_ASSET_CANDLES",
    ],

    features: [
      "CROSS_ASSET_LAGGED_RETURN",
    ],

    targets: [
      "FUTURE_LOG_RETURN",
    ],

    status:
      "REGISTERED",
  },

  {
    id: "H_EXP_001",
    version: "1.0.0",

    source: "SYSTEM",
    mode: "CONFIRMATORY",

    family:
      "EXPERIMENTAL",

    title:
      "Lunar phase and future volatility",

    hypothesis:
      "Lunar phase is associated with future realized volatility",

    requiredData: [
      "CANDLES",
      "TIMESTAMP",
    ],

    features: [
      "LUNAR_PHASE",
    ],

    targets: [
      "FUTURE_REALIZED_VOLATILITY",
    ],

    status:
      "REGISTERED",
  },
];

const getHypothesisById = (
  id
) =>
  SYSTEM_HYPOTHESES.find(
    (hypothesis) =>
      hypothesis.id === id
  ) || null;

const listHypotheses = () =>
  SYSTEM_HYPOTHESES.map(
    (hypothesis) => ({
      ...hypothesis,

      requiredData: [
        ...(hypothesis.requiredData ||
          []),
      ],

      features: [
        ...(hypothesis.features ||
          []),
      ],

      targets: [
        ...(hypothesis.targets ||
          []),
      ],
    })
  );

const listHypothesesByFamily = (
  family
) =>
  listHypotheses().filter(
    (hypothesis) =>
      hypothesis.family ===
      family
  );

module.exports = {
  SYSTEM_HYPOTHESES,
  getHypothesisById,
  listHypotheses,
  listHypothesesByFamily,
};
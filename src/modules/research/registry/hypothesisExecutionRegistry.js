const HYPOTHESIS_EXECUTION_REGISTRY = [
  {
    hypothesisId:
      "H_VOL_001",

    status:
      "IMPLEMENTED",

    executor:
      "VOLATILITY_STRUCTURE_RESEARCH",

    protocol:
      "VOLATILITY_STRUCTURE_V1",

    datasetBinding: {
      capability:
        "CANDLES",

      stage:
        "PREPARED",

      cardinality:
        "MULTIPLE",

      timeframes: [
        "5m",
        "15m",
        "1h",
        "4h",
        "1d",
      ],
    },
  },

  {
    hypothesisId:
      "H_CAL_001",

    status:
      "IMPLEMENTED",

    executor:
      "CATEGORICAL_FACTOR_RESEARCH",

    protocol:
      "CALENDAR_HOUR_FUTURE_RV_V1",

    datasetBinding: {
      capability:
        "CANDLES",

      stage:
        "PREPARED",

      cardinality:
        "SINGLE",

      timeframe:
        "1h",
    },
  },

  {
    hypothesisId:
      "H_CAL_002",

    status:
      "IMPLEMENTED",

    executor:
      "CATEGORICAL_FACTOR_RESEARCH",

    protocol:
      "CALENDAR_WEEKDAY_FUTURE_RV_V1",

    datasetBinding: {
      capability:
        "CANDLES",

      stage:
        "PREPARED",

      cardinality:
        "SINGLE",

      timeframe:
        "1h",
    },
  },

  {
    hypothesisId:
      "H_CAL_003",

    status:
      "IMPLEMENTED",

    executor:
      "CATEGORICAL_FACTOR_RESEARCH",

    protocol:
      "CALENDAR_WEEKEND_FUTURE_RV_V1",

    datasetBinding: {
      capability:
        "CANDLES",

      stage:
        "PREPARED",

      cardinality:
        "SINGLE",

      timeframe:
        "1h",
    },
  },

  {
    hypothesisId:
      "H_CAL_004",

    status:
      "PLANNED",

    reason:
      "Month protocol has not been registered yet",
  },

  {
    hypothesisId:
      "H_RET_001",

    status:
      "PLANNED",

    reason:
      "Future log-return target and continuous evaluator are not implemented yet",
  },

  {
    hypothesisId:
      "H_VOL_002",

    status:
      "PLANNED",

    reason:
      "Continuous volatility factor evaluator is not implemented yet",
  },

  {
    hypothesisId:
      "H_VOL_003",

    status:
      "PLANNED",

    reason:
      "Continuous absolute-return factor evaluator is not implemented yet",
  },

  {
    hypothesisId:
      "H_VOLM_001",

    status:
      "PLANNED",

    reason:
      "Volume Z-score feature is not implemented yet",
  },

  {
    hypothesisId:
      "H_VOLM_002",

    status:
      "PLANNED",

    reason:
      "Volume Z-score and future-return target are not implemented yet",
  },

  {
    hypothesisId:
      "H_FUND_001",

    status:
      "PLANNED",

    reason:
      "Funding acquisition and feature pipeline are not implemented yet",
  },

  {
    hypothesisId:
      "H_FUND_002",

    status:
      "PLANNED",

    reason:
      "Funding acquisition and feature pipeline are not implemented yet",
  },

  {
    hypothesisId:
      "H_OI_001",

    status:
      "PLANNED",

    reason:
      "Open-interest acquisition and feature pipeline are not implemented yet",
  },

  {
    hypothesisId:
      "H_OI_002",

    status:
      "PLANNED",

    reason:
      "Open-interest acquisition and feature pipeline are not implemented yet",
  },

  {
    hypothesisId:
      "H_CROSS_001",

    status:
      "PLANNED",

    reason:
      "Cross-asset synchronized matrix engine is not implemented yet",
  },

  {
    hypothesisId:
      "H_EXP_001",

    status:
      "PLANNED",

    reason:
      "Lunar phase feature is not implemented yet",
  },
];

const getHypothesisExecution = (
  hypothesisId
) =>
  HYPOTHESIS_EXECUTION_REGISTRY.find(
    (item) =>
      item.hypothesisId ===
      hypothesisId
  ) || null;

const isHypothesisImplemented = (
  hypothesisId
) =>
  getHypothesisExecution(
    hypothesisId
  )?.status ===
  "IMPLEMENTED";

module.exports = {
  HYPOTHESIS_EXECUTION_REGISTRY,
  getHypothesisExecution,
  isHypothesisImplemented,
};
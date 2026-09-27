const UNIT_TO_MS =
  Object.freeze({
    m:
      60 * 1000,

    h:
      60 * 60 * 1000,

    d:
      24 *
      60 *
      60 *
      1000,
  });

const parseDurationToMilliseconds =
  (value) => {
    if (
      typeof value !==
      "string"
    ) {
      throw new Error(
        "INVALID_FORECAST_DURATION"
      );
    }

    const normalized =
      value
        .trim()
        .toLowerCase();

    const match =
      normalized.match(
        /^(\d+)(m|h|d)$/
      );

    if (!match) {
      throw new Error(
        `INVALID_FORECAST_DURATION:${value}`
      );
    }

    const amount =
      Number(
        match[1]
      );

    const unit =
      match[2];

    if (
      !Number.isInteger(
        amount
      ) ||
      amount <= 0
    ) {
      throw new Error(
        `INVALID_FORECAST_DURATION_AMOUNT:${value}`
      );
    }

    return (
      amount *
      UNIT_TO_MS[unit]
    );
  };

const resolveForecastHorizon =
  ({
    modelTimeframe,
    horizon,
  }) => {
    const modelTimeframeMs =
      parseDurationToMilliseconds(
        modelTimeframe
      );

    const horizonMs =
      parseDurationToMilliseconds(
        horizon
      );

    if (
      horizonMs <
      modelTimeframeMs
    ) {
      throw new Error(
        "FORECAST_HORIZON_SHORTER_THAN_MODEL_TIMEFRAME"
      );
    }

    if (
      horizonMs %
        modelTimeframeMs !==
      0
    ) {
      throw new Error(
        "FORECAST_HORIZON_NOT_ALIGNED_TO_MODEL_TIMEFRAME"
      );
    }

    const horizonBars =
      horizonMs /
      modelTimeframeMs;

    return {
      modelTimeframe,

      modelTimeframeMs,

      horizon,

      horizonMs,

      horizonBars,
    };
  };

module.exports = {
  parseDurationToMilliseconds,
  resolveForecastHorizon,
};
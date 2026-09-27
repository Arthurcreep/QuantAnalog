const {
  buildFutureRealizedVolatility,
} = require(
  "../../research/targets/volatility/buildFutureRealizedVolatility"
);

const toTimestamp = ({
  value,
  field,
}) => {
  const timestamp =
    new Date(
      value
    ).getTime();

  if (
    !Number.isFinite(
      timestamp
    )
  ) {
    throw new Error(
      `INVALID_FORECAST_OUTCOME_${field}`
    );
  }

  return timestamp;
};

const buildRealizedVolatilityOutcome =
  ({
    series,
    targetWindowStartAt,
    targetWindowEndAt,
    expectedIntervalMs,
  }) => {
    if (
      !Array.isArray(
        series
      )
    ) {
      throw new Error(
        "INVALID_FORECAST_OUTCOME_RETURN_SERIES"
      );
    }

    if (
      !Number.isFinite(
        expectedIntervalMs
      ) ||
      expectedIntervalMs <= 0
    ) {
      throw new Error(
        "INVALID_FORECAST_OUTCOME_INTERVAL"
      );
    }

    const targetStartMs =
      toTimestamp({
        value:
          targetWindowStartAt,

        field:
          "TARGET_START",
      });

    const targetEndMs =
      toTimestamp({
        value:
          targetWindowEndAt,

        field:
          "TARGET_END",
      });

    if (
      targetEndMs <=
      targetStartMs
    ) {
      throw new Error(
        "INVALID_FORECAST_OUTCOME_WINDOW"
      );
    }

    const durationMs =
      targetEndMs -
      targetStartMs;

    if (
      durationMs %
        expectedIntervalMs !==
      0
    ) {
      throw new Error(
        "FORECAST_OUTCOME_WINDOW_NOT_ALIGNED"
      );
    }

    const horizonBars =
      durationMs /
      expectedIntervalMs;

    if (
      !Number.isInteger(
        horizonBars
      ) ||
      horizonBars <= 0
    ) {
      throw new Error(
        "INVALID_FORECAST_OUTCOME_HORIZON"
      );
    }

    /*
     * buildFutureRealizedVolatility()
     * defines future returns relative
     * to an anchor return.
     *
     * If target starts at 13:00 on 1h:
     *
     * anchor return timestamp = 12:00
     * first future return      = 13:00
     */

    const anchorTimestampMs =
      targetStartMs -
      expectedIntervalMs;

    const anchorIndex =
      series.findIndex(
        (row) =>
          new Date(
            row.timestamp
          ).getTime() ===
          anchorTimestampMs
      );

    if (
      anchorIndex < 0
    ) {
      throw new Error(
        "FORECAST_OUTCOME_ANCHOR_NOT_FOUND"
      );
    }

    const requiredLength =
      horizonBars +
      1;

    const targetSeries =
      series.slice(
        anchorIndex,
        anchorIndex +
          requiredLength
      );

    if (
      targetSeries.length !==
      requiredLength
    ) {
      throw new Error(
        "FORECAST_OUTCOME_TARGET_WINDOW_INCOMPLETE"
      );
    }

    const targets =
      buildFutureRealizedVolatility({
        series:
          targetSeries,

        horizonBars,

        expectedIntervalMs,
      });

    if (
      targets.length !== 1
    ) {
      throw new Error(
        "FORECAST_OUTCOME_TARGET_NOT_AVAILABLE"
      );
    }

    const target =
      targets[0];

    const actualTargetStartMs =
      new Date(
        target
          .targetStartTimestamp
      ).getTime();

    const actualLastReturnMs =
      new Date(
        target
          .targetEndTimestamp
      ).getTime();

    const actualWindowEndMs =
      actualLastReturnMs +
      expectedIntervalMs;

    if (
      actualTargetStartMs !==
        targetStartMs ||
      actualWindowEndMs !==
        targetEndMs
    ) {
      throw new Error(
        "FORECAST_OUTCOME_TARGET_WINDOW_MISMATCH"
      );
    }

    return {
      horizonBars,

      targetWindowStartAt:
        new Date(
          targetStartMs
        ).toISOString(),

      targetWindowEndAt:
        new Date(
          targetEndMs
        ).toISOString(),

      firstReturnTimestamp:
        target
          .targetStartTimestamp,

      lastReturnTimestamp:
        target
          .targetEndTimestamp,

      lastReturnAvailableAt:
        new Date(
          actualWindowEndMs
        ).toISOString(),

      actual: {
        target:
          "FUTURE_REALIZED_VOLATILITY",

        value:
          target
            .futureRealizedVolatility,

        varianceValue:
          target
            .futureRealizedVariance,

        unit:
          "REALIZED_VOLATILITY",
      },
    };
  };

module.exports = {
  buildRealizedVolatilityOutcome,
};
const {
  buildFutureRealizedVolatility,
} = require(
  "../../research/targets/volatility/buildFutureRealizedVolatility"
);

const {
  calculateVolatilityForecastScores,
} = require(
  "../evaluation/calculateVolatilityForecastScores"
);

const {
  aggregateVolatilityForecastScores,
} = require(
  "../evaluation/aggregateVolatilityForecastScores"
);

const parseOptionalTimestamp = ({
  value,
  field,
}) => {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

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
      `INVALID_${field}`
    );
  }

  return timestamp;
};

const validatePositiveInteger = ({
  value,
  field,
}) => {
  if (
    !Number.isInteger(
      value
    ) ||
    value <= 0
  ) {
    throw new Error(
      `INVALID_${field}`
    );
  }
};

const evaluateVolatilityForecastModel =
  ({
    series,
    modelDefinition,
    modelConfig,
    historyWindowBars,
    horizonBars,
    expectedIntervalMs,
    evaluationStartAt = null,
    evaluationEndAt = null,
    forecastModel,
  }) => {
    if (
      !Array.isArray(
        series
      )
    ) {
      throw new Error(
        "INVALID_WALK_FORWARD_RETURN_SERIES"
      );
    }

    if (
      !modelDefinition ||
      typeof modelDefinition !==
        "object"
    ) {
      throw new Error(
        "INVALID_WALK_FORWARD_MODEL_DEFINITION"
      );
    }

    if (
      typeof modelDefinition.id !==
        "string" ||
      typeof modelDefinition.version !==
        "string"
    ) {
      throw new Error(
        "INVALID_WALK_FORWARD_MODEL_IDENTITY"
      );
    }

    if (
      !modelConfig ||
      typeof modelConfig !==
        "object" ||
      Array.isArray(
        modelConfig
      )
    ) {
      throw new Error(
        "INVALID_WALK_FORWARD_MODEL_CONFIG"
      );
    }

    if (
      typeof forecastModel !==
      "function"
    ) {
      throw new Error(
        "INVALID_WALK_FORWARD_FORECAST_MODEL"
      );
    }

    validatePositiveInteger({
      value:
        historyWindowBars,

      field:
        "WALK_FORWARD_HISTORY_WINDOW",
    });

    validatePositiveInteger({
      value:
        horizonBars,

      field:
        "WALK_FORWARD_HORIZON",
    });

    if (
      !Number.isFinite(
        expectedIntervalMs
      ) ||
      expectedIntervalMs <= 0
    ) {
      throw new Error(
        "INVALID_WALK_FORWARD_INTERVAL"
      );
    }

    const evaluationStartMs =
      parseOptionalTimestamp({
        value:
          evaluationStartAt,

        field:
          "WALK_FORWARD_START",
      });

    const evaluationEndMs =
      parseOptionalTimestamp({
        value:
          evaluationEndAt,

        field:
          "WALK_FORWARD_END",
      });

    if (
      evaluationStartMs !== null &&
      evaluationEndMs !== null &&
      evaluationEndMs <
        evaluationStartMs
    ) {
      throw new Error(
        "INVALID_WALK_FORWARD_WINDOW"
      );
    }

    /*
     * Actual target construction is
     * shared by all volatility models.
     *
     * Research and Forecasting therefore
     * evaluate exactly the same target.
     */

    const targets =
      buildFutureRealizedVolatility({
        series,

        horizonBars,

        expectedIntervalMs,
      });

    const targetMap =
      new Map(
        targets.map(
          (target) => [
            target.timestamp,
            target,
          ]
        )
      );

    const rows =
      [];

    const scores =
      [];

    let skippedInsufficientLookback =
      0;

    let skippedLookbackGap =
      0;

    let skippedMissingTarget =
      0;

    let skippedOutsideEvaluationWindow =
      0;

    for (
      let index =
        historyWindowBars - 1;
      index <
        series.length;
      index += 1
    ) {
      const anchor =
        series[index];

      const anchorTimestampMs =
        new Date(
          anchor.timestamp
        ).getTime();

      if (
        !Number.isFinite(
          anchorTimestampMs
        )
      ) {
        throw new Error(
          "INVALID_WALK_FORWARD_TIMESTAMP"
        );
      }

      /*
       * Candle timestamp identifies
       * bucket start.
       *
       * Its return becomes available
       * one interval later.
       */

      const issuedAtMs =
        anchorTimestampMs +
        expectedIntervalMs;

      if (
        evaluationStartMs !== null &&
        issuedAtMs <
          evaluationStartMs
      ) {
        skippedOutsideEvaluationWindow +=
          1;

        continue;
      }

      if (
        evaluationEndMs !== null &&
        issuedAtMs >
          evaluationEndMs
      ) {
        skippedOutsideEvaluationWindow +=
          1;

        continue;
      }

      const target =
        targetMap.get(
          anchor.timestamp
        );

      if (!target) {
        skippedMissingTarget +=
          1;

        continue;
      }

      const historyStartIndex =
        index -
        historyWindowBars +
        1;

      if (
        historyStartIndex < 0
      ) {
        skippedInsufficientLookback +=
          1;

        continue;
      }

      /*
       * Critical leakage boundary:
       *
       * forecastModel receives only
       * historical observations ending
       * at the anchor return.
       *
       * Future rows are physically not
       * passed into the model.
       */

      const history =
        series.slice(
          historyStartIndex,
          index + 1
        );

      let modelResult;

      try {
        modelResult =
          forecastModel({
            series:
              history,

            modelConfig,

            horizonBars,

            expectedIntervalMs,

            issuedAt:
              new Date(
                issuedAtMs
              ).toISOString(),

            anchorTimestamp:
              anchor.timestamp,
          });
      } catch (error) {
        if (
          error.message ===
          "FORECAST_LOOKBACK_HAS_GAP"
        ) {
          skippedLookbackGap +=
            1;

          continue;
        }

        if (
          error.message ===
          "INSUFFICIENT_FORECAST_LOOKBACK"
        ) {
          skippedInsufficientLookback +=
            1;

          continue;
        }

        throw error;
      }

      if (
        !modelResult ||
        !modelResult.prediction
      ) {
        throw new Error(
          "WALK_FORWARD_MODEL_PREDICTION_MISSING"
        );
      }

      const forecastVolatility =
        Number(
          modelResult
            .prediction
            .value
        );

      const forecastVariance =
        Number(
          modelResult
            .prediction
            .varianceValue
        );

      const actualVolatility =
        Number(
          target
            .futureRealizedVolatility
        );

      const actualVariance =
        Number(
          target
            .futureRealizedVariance
        );

      const score =
        calculateVolatilityForecastScores({
          forecastVolatility,

          actualVolatility,

          forecastVariance,

          actualVariance,
        });

      scores.push(
        score
      );

      rows.push({
        issuedAt:
          new Date(
            issuedAtMs
          ).toISOString(),

        anchorReturnTimestamp:
          anchor.timestamp,

        targetStartTimestamp:
          target
            .targetStartTimestamp,

        targetEndTimestamp:
          target
            .targetEndTimestamp,

        forecastVolatility,

        forecastVariance,

        actualVolatility,

        actualVariance,

        absoluteError:
          score
            .volatility
            .absoluteError,

        squaredError:
          score
            .volatility
            .squaredError,

        varianceAbsoluteError:
          score
            .variance
            .absoluteError,

        varianceSquaredError:
          score
            .variance
            .squaredError,

        qlike:
          score.qlike,
      });
    }

    return {
      model: {
        id:
          modelDefinition.id,

        version:
          modelDefinition.version,
      },

      config: {
        modelConfig,

        historyWindowBars,

        horizonBars,

        expectedIntervalMs,

        evaluationStartAt,

        evaluationEndAt,
      },

      sample: {
        inputReturns:
          series.length,

        availableTargets:
          targets.length,

        evaluatedForecasts:
          rows.length,

        skippedInsufficientLookback,

        skippedLookbackGap,

        skippedMissingTarget,

        skippedOutsideEvaluationWindow,
      },

      aggregate:
        aggregateVolatilityForecastScores(
          scores
        ),

      rows,
    };
  };

module.exports = {
  evaluateVolatilityForecastModel,
};
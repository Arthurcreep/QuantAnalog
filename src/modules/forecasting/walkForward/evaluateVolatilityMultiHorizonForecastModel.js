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

const normalizeHorizonBarsList = (
  horizonBarsList
) => {
  if (
    !Array.isArray(
      horizonBarsList
    ) ||
    horizonBarsList.length ===
      0
  ) {
    throw new Error(
      "INVALID_MULTI_HORIZON_LIST"
    );
  }

  const normalized =
    [...horizonBarsList]
      .map(
        (value) =>
          Number(
            value
          )
      )
      .sort(
        (a, b) =>
          a - b
      );

  for (
    const horizonBars of
      normalized
  ) {
    validatePositiveInteger({
      value:
        horizonBars,

      field:
        "MULTI_HORIZON_BARS",
    });
  }

  const unique =
    new Set(
      normalized
    );

  if (
    unique.size !==
    normalized.length
  ) {
    throw new Error(
      "DUPLICATE_MULTI_HORIZON_BARS"
    );
  }

  return normalized;
};

const buildHorizonState = ({
  series,
  horizonBars,
  expectedIntervalMs,
}) => {
  const targets =
    buildFutureRealizedVolatility({
      series,

      horizonBars,

      expectedIntervalMs,
    });

  return {
    horizonBars,

    targets,

    targetMap:
      new Map(
        targets.map(
          (target) => [
            target.timestamp,
            target,
          ]
        )
      ),

    rows:
      [],

    scores:
      [],

    skippedInsufficientLookback:
      0,

    skippedLookbackGap:
      0,

    skippedMissingTarget:
      0,
  };
};

const buildForecastRow = ({
  issuedAt,
  anchorTimestamp,
  target,
  prediction,
}) => {
  const forecastVolatility =
    Number(
      prediction.value
    );

  const forecastVariance =
    Number(
      prediction
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

  return {
    score,

    row: {
      issuedAt,

      anchorReturnTimestamp:
        anchorTimestamp,

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
    },
  };
};

const evaluateVolatilityMultiHorizonForecastModel =
  ({
    series,
    modelDefinition,
    modelConfig,
    historyWindowBars,
    horizonBarsList,
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
        "INVALID_MULTI_HORIZON_RETURN_SERIES"
      );
    }

    if (
      !modelDefinition ||
      typeof modelDefinition !==
        "object" ||
      typeof modelDefinition.id !==
        "string" ||
      typeof modelDefinition.version !==
        "string"
    ) {
      throw new Error(
        "INVALID_MULTI_HORIZON_MODEL_DEFINITION"
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
        "INVALID_MULTI_HORIZON_MODEL_CONFIG"
      );
    }

    if (
      typeof forecastModel !==
      "function"
    ) {
      throw new Error(
        "INVALID_MULTI_HORIZON_FORECAST_MODEL"
      );
    }

    validatePositiveInteger({
      value:
        historyWindowBars,

      field:
        "MULTI_HORIZON_HISTORY_WINDOW",
    });

    if (
      !Number.isFinite(
        expectedIntervalMs
      ) ||
      expectedIntervalMs <= 0
    ) {
      throw new Error(
        "INVALID_MULTI_HORIZON_INTERVAL"
      );
    }

    const horizons =
      normalizeHorizonBarsList(
        horizonBarsList
      );

    const evaluationStartMs =
      parseOptionalTimestamp({
        value:
          evaluationStartAt,

        field:
          "MULTI_HORIZON_START",
      });

    const evaluationEndMs =
      parseOptionalTimestamp({
        value:
          evaluationEndAt,

        field:
          "MULTI_HORIZON_END",
      });

    if (
      evaluationStartMs !==
        null &&
      evaluationEndMs !==
        null &&
      evaluationEndMs <
        evaluationStartMs
    ) {
      throw new Error(
        "INVALID_MULTI_HORIZON_WINDOW"
      );
    }

    const horizonStates =
      new Map(
        horizons.map(
          (horizonBars) => [
            horizonBars,

            buildHorizonState({
              series,

              horizonBars,

              expectedIntervalMs,
            }),
          ]
        )
      );

    let skippedOutsideEvaluationWindow =
      0;

    let modelCalls =
      0;

    for (
      let index =
        historyWindowBars -
        1;
      index <
        series.length;
      index += 1
    ) {
      const anchor =
        series[index];

      const anchorTimestampMs =
        Date.parse(
          anchor.timestamp
        );

      if (
        !Number.isFinite(
          anchorTimestampMs
        )
      ) {
        throw new Error(
          "INVALID_MULTI_HORIZON_TIMESTAMP"
        );
      }

      /*
       * Return at bucket-start T becomes
       * available at T + timeframe.
       */
      const issuedAtMs =
        anchorTimestampMs +
        expectedIntervalMs;

      if (
        evaluationStartMs !==
          null &&
        issuedAtMs <
          evaluationStartMs
      ) {
        skippedOutsideEvaluationWindow +=
          1;

        continue;
      }

      if (
        evaluationEndMs !==
          null &&
        issuedAtMs >
          evaluationEndMs
      ) {
        skippedOutsideEvaluationWindow +=
          1;

        continue;
      }

      const availableHorizons =
        [];

      for (
        const horizonBars of
          horizons
      ) {
        const state =
          horizonStates.get(
            horizonBars
          );

        const target =
          state
            .targetMap
            .get(
              anchor.timestamp
            );

        if (!target) {
          state
            .skippedMissingTarget +=
            1;

          continue;
        }

        availableHorizons.push(
          horizonBars
        );
      }

      /*
       * No actual exists for any requested
       * horizon at this issue time.
       *
       * Nothing can be evaluated.
       */
      if (
        availableHorizons.length ===
        0
      ) {
        continue;
      }

      const historyStartIndex =
        index -
        historyWindowBars +
        1;

      if (
        historyStartIndex <
        0
      ) {
        for (
          const horizonBars of
            availableHorizons
        ) {
          horizonStates
            .get(
              horizonBars
            )
            .skippedInsufficientLookback +=
            1;
        }

        continue;
      }

      /*
       * Leakage boundary:
       *
       * model sees only data through
       * current anchor.
       */
      const history =
        series.slice(
          historyStartIndex,
          index + 1
        );

      let modelResult;

      try {
        /*
         * CRITICAL:
         *
         * exactly ONE model invocation
         * per issuedAt.
         *
         * Stateful models advance once.
         */
        modelResult =
          forecastModel({
            series:
              history,

            modelConfig,

            horizonBarsList:
              horizons,

            expectedIntervalMs,

            issuedAt:
              new Date(
                issuedAtMs
              ).toISOString(),

            anchorTimestamp:
              anchor.timestamp,
          });

        modelCalls +=
          1;
      } catch (error) {
        if (
          error.message ===
          "FORECAST_LOOKBACK_HAS_GAP"
        ) {
          for (
            const horizonBars of
              availableHorizons
          ) {
            horizonStates
              .get(
                horizonBars
              )
              .skippedLookbackGap +=
              1;
          }

          continue;
        }

        if (
          error.message ===
          "INSUFFICIENT_FORECAST_LOOKBACK"
        ) {
          for (
            const horizonBars of
              availableHorizons
          ) {
            horizonStates
              .get(
                horizonBars
              )
              .skippedInsufficientLookback +=
              1;
          }

          continue;
        }

        throw error;
      }

      if (
        !modelResult ||
        !modelResult.predictions ||
        typeof modelResult
          .predictions !==
          "object"
      ) {
        throw new Error(
          "MULTI_HORIZON_MODEL_PREDICTIONS_MISSING"
        );
      }

      const issuedAt =
        new Date(
          issuedAtMs
        ).toISOString();

      for (
        const horizonBars of
          availableHorizons
      ) {
        const state =
          horizonStates.get(
            horizonBars
          );

        const target =
          state
            .targetMap
            .get(
              anchor.timestamp
            );

        const horizonResult =
          modelResult
            .predictions[
              String(
                horizonBars
              )
            ];

        if (
          !horizonResult ||
          !horizonResult
            .prediction
        ) {
          throw new Error(
            `MULTI_HORIZON_PREDICTION_MISSING:${horizonBars}`
          );
        }

        const built =
          buildForecastRow({
            issuedAt,

            anchorTimestamp:
              anchor.timestamp,

            target,

            prediction:
              horizonResult
                .prediction,
          });

        state
          .scores
          .push(
            built.score
          );

        state
          .rows
          .push(
            built.row
          );
      }
    }

    const horizonResults =
      {};

    for (
      const horizonBars of
        horizons
    ) {
      const state =
        horizonStates.get(
          horizonBars
        );

      horizonResults[
        String(
          horizonBars
        )
      ] = {
        horizonBars,

        sample: {
          inputReturns:
            series.length,

          availableTargets:
            state
              .targets
              .length,

          evaluatedForecasts:
            state
              .rows
              .length,

          skippedInsufficientLookback:
            state
              .skippedInsufficientLookback,

          skippedLookbackGap:
            state
              .skippedLookbackGap,

          skippedMissingTarget:
            state
              .skippedMissingTarget,

          skippedOutsideEvaluationWindow,
        },

        aggregate:
          aggregateVolatilityForecastScores(
            state.scores
          ),

        rows:
          state.rows,
      };
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

        horizonBarsList:
          horizons,

        expectedIntervalMs,

        evaluationStartAt,

        evaluationEndAt,
      },

      sample: {
        inputReturns:
          series.length,

        modelCalls,

        skippedOutsideEvaluationWindow,
      },

      horizons:
        horizonResults,
    };
  };

module.exports = {
  evaluateVolatilityMultiHorizonForecastModel,
};
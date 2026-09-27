const {
  findForecastById,
} = require(
  "../forecasts/forecast.repository"
);

const {
  findForecastOutcomeByForecastId,
} = require(
  "../outcomes/forecastOutcome.repository"
);

const {
  createForecastEvaluation,
  findForecastEvaluationByKey,
} = require(
  "../evaluations/forecastEvaluation.repository"
);

const {
  calculateVolatilityForecastScores,
} = require(
  "../evaluation/calculateVolatilityForecastScores"
);

const {
  VOLATILITY_FORECAST_EVALUATION_V1,
} = require(
  "../protocols/volatilityForecastEvaluationV1"
);

const {
  calculateObjectChecksum,
} = require(
  "../../../shared/hash/calculateObjectChecksum"
);

const {
  createAppError,
} = require(
  "../../../errors/appError"
);

const ENGINE_VERSION =
  "forecast-evaluation-v1.0";

const buildEvaluationKey = ({
  forecast,
  outcome,
  evaluatorChecksum,
}) =>
  calculateObjectChecksum({
    forecastId:
      forecast.id,

    forecastKey:
      forecast.forecastKey,

    outcomeId:
      outcome.id,

    actualDatasetChecksum:
      outcome
        .actualDatasetChecksum,

    evaluatorId:
      VOLATILITY_FORECAST_EVALUATION_V1
        .id,

    evaluatorVersion:
      VOLATILITY_FORECAST_EVALUATION_V1
        .version,

    evaluatorChecksum,
  });

const assertSupportedTarget = ({
  forecast,
  outcome,
}) => {
  if (
    forecast.target !==
    VOLATILITY_FORECAST_EVALUATION_V1
      .target
  ) {
    throw new Error(
      "FORECAST_EVALUATION_TARGET_NOT_SUPPORTED"
    );
  }

  if (
    outcome.actual.target !==
    forecast.target
  ) {
    throw new Error(
      "FORECAST_EVALUATION_TARGET_MISMATCH"
    );
  }
};

const buildMetrics = ({
  forecast,
  outcome,
}) => {
  const prediction =
    forecast.prediction;

  const actual =
    outcome.actual;

  const score =
    calculateVolatilityForecastScores({
      forecastVolatility:
        prediction.value,

      actualVolatility:
        actual.value,

      forecastVariance:
        prediction
          .varianceValue,

      actualVariance:
        actual
          .varianceValue,

      varianceFloor:
        VOLATILITY_FORECAST_EVALUATION_V1
          .qlike
          .varianceFloor,
    });

  return {
    volatility: {
      forecast:
        score
          .volatility
          .forecast,

      actual:
        score
          .volatility
          .actual,

      error:
        score
          .volatility
          .error,

      absoluteError:
        score
          .volatility
          .absoluteError,

      squaredError:
        score
          .volatility
          .squaredError,
    },

    variance: {
      forecast:
        score
          .variance
          .forecast,

      actual:
        score
          .variance
          .actual,

      error:
        score
          .variance
          .error,

      absoluteError:
        score
          .variance
          .absoluteError,

      squaredError:
        score
          .variance
          .squaredError,

      ratio:
        score
          .variance
          .ratio,

      floor:
        score
          .variance
          .floor,
    },

    qlike:
      score.qlike,
  };
};

const assertExistingEvaluationMatches =
  ({
    existing,
    metrics,
  }) => {
    const existingChecksum =
      calculateObjectChecksum(
        existing.metrics
      );

    const requestedChecksum =
      calculateObjectChecksum(
        metrics
      );

    if (
      existingChecksum !==
      requestedChecksum
    ) {
      throw new Error(
        "FORECAST_EVALUATION_KEY_METRICS_CONFLICT"
      );
    }
  };

const evaluateForecast =
  async ({
    forecastId,
  }, options = {}) => {
    const forecast =
      await findForecastById(
        forecastId,
        options
      );

    if (!forecast) {
      throw createAppError({
        statusCode:
          404,

        code:
          "FORECAST_NOT_FOUND",

        message:
          `Forecast ${forecastId} not found`,
      });
    }

    const outcome =
      await findForecastOutcomeByForecastId(
        forecast.id,
        options
      );

    if (!outcome) {
      throw createAppError({
        statusCode:
          409,

        code:
          "FORECAST_OUTCOME_NOT_AVAILABLE",

        message:
          `Forecast ${forecastId} has not matured`,
      });
    }

    assertSupportedTarget({
      forecast,
      outcome,
    });

    const evaluatorChecksum =
      calculateObjectChecksum(
        VOLATILITY_FORECAST_EVALUATION_V1
      );

    const metrics =
      buildMetrics({
        forecast,
        outcome,
      });

    const evaluationKey =
      buildEvaluationKey({
        forecast,
        outcome,
        evaluatorChecksum,
      });

    const existing =
      await findForecastEvaluationByKey(
        evaluationKey,
        options
      );

    if (existing) {
      assertExistingEvaluationMatches({
        existing,

        metrics,
      });

      return {
        created:
          false,

        engineVersion:
          ENGINE_VERSION,

        forecast,

        outcome,

        evaluation:
          existing,
      };
    }

    const evaluation =
      await createForecastEvaluation(
        {
          forecastId:
            forecast.id,

          outcomeId:
            outcome.id,

          evaluationKey,

          evaluatorId:
            VOLATILITY_FORECAST_EVALUATION_V1
              .id,

          evaluatorVersion:
            VOLATILITY_FORECAST_EVALUATION_V1
              .version,

          evaluatorChecksum,

          metrics,
        },
        options
      );

    return {
      created:
        true,

      engineVersion:
        ENGINE_VERSION,

      forecast,

      outcome,

      evaluation,
    };
  };

module.exports = {
  ENGINE_VERSION,
  buildEvaluationKey,
  evaluateForecast,
};
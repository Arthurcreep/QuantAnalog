const {
  GARCH_NORMAL_V1,
} = require(
  "../protocols/garchNormalV1"
);

const {
  createGarchNormalWalkForwardForecaster,
} = require(
  "../models/createGarchNormalWalkForwardForecaster"
);

const {
  evaluateVolatilityForecastModel,
} = require(
  "./evaluateVolatilityForecastModel"
);

const MODEL_DEFINITION =
  Object.freeze({
    id:
      GARCH_NORMAL_V1
        .modelId,

    version:
      GARCH_NORMAL_V1
        .modelVersion,

    protocolId:
      GARCH_NORMAL_V1.id,

    protocolVersion:
      GARCH_NORMAL_V1
        .version,

    target:
      GARCH_NORMAL_V1
        .target,

    distribution:
      GARCH_NORMAL_V1
        .distribution,

    meanModel:
      GARCH_NORMAL_V1
        .meanModel,

    varianceEquation:
      GARCH_NORMAL_V1
        .varianceEquation,
  });

const evaluateGarchNormalV1 =
  ({
    series,
    expectedIntervalMs,
    evaluationStartAt = null,
    evaluationEndAt = null,
  }) => {
    const forecaster =
      createGarchNormalWalkForwardForecaster();

    const modelConfig = {
      trainingWindowBars:
        GARCH_NORMAL_V1
          .trainingWindowBars,

      refitEveryForecasts:
        GARCH_NORMAL_V1
          .refitEveryForecasts,

      distribution:
        GARCH_NORMAL_V1
          .distribution,

      meanModel:
        GARCH_NORMAL_V1
          .meanModel,
    };

    const result =
      evaluateVolatilityForecastModel({
        series,

        modelDefinition:
          MODEL_DEFINITION,

        modelConfig,

        historyWindowBars:
          GARCH_NORMAL_V1
            .trainingWindowBars,

        horizonBars:
          GARCH_NORMAL_V1
            .horizonBars,

        expectedIntervalMs,

        evaluationStartAt,

        evaluationEndAt,

        forecastModel:
          forecaster.forecast,
      });

    return {
      ...result,

      protocol: {
        id:
          GARCH_NORMAL_V1.id,

        version:
          GARCH_NORMAL_V1
            .version,

        definition:
          GARCH_NORMAL_V1,
      },

      diagnostics:
        forecaster
          .getDiagnostics(),
    };
  };

module.exports = {
  MODEL_DEFINITION,
  evaluateGarchNormalV1,
};
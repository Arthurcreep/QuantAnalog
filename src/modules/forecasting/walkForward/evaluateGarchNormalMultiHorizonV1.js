const {
  GARCH_NORMAL_MULTI_HORIZON_V1,
} = require(
  "../protocols/garchNormalMultiHorizonV1"
);

const {
  createGarchNormalMultiHorizonForecaster,
} = require(
  "../models/createGarchNormalMultiHorizonForecaster"
);

const {
  evaluateVolatilityMultiHorizonForecastModel,
} = require(
  "./evaluateVolatilityMultiHorizonForecastModel"
);

const MODEL_DEFINITION =
  Object.freeze({
    id:
      GARCH_NORMAL_MULTI_HORIZON_V1
        .modelId,

    version:
      GARCH_NORMAL_MULTI_HORIZON_V1
        .modelVersion,

    protocolId:
      GARCH_NORMAL_MULTI_HORIZON_V1.id,

    protocolVersion:
      GARCH_NORMAL_MULTI_HORIZON_V1
        .version,

    target:
      GARCH_NORMAL_MULTI_HORIZON_V1
        .target,

    meanModel:
      GARCH_NORMAL_MULTI_HORIZON_V1
        .meanModel,

    distribution:
      GARCH_NORMAL_MULTI_HORIZON_V1
        .distribution,

    oneStepVarianceEquation:
      GARCH_NORMAL_MULTI_HORIZON_V1
        .oneStepVarianceEquation,

    multiStepVarianceEquation:
      GARCH_NORMAL_MULTI_HORIZON_V1
        .multiStepVarianceEquation,

    aggregation:
      GARCH_NORMAL_MULTI_HORIZON_V1
        .aggregation,

    targetSemantics:
      GARCH_NORMAL_MULTI_HORIZON_V1
        .targetSemantics,
  });

const evaluateGarchNormalMultiHorizonV1 =
  ({
    series,
    horizonBarsList,
    expectedIntervalMs,
    evaluationStartAt = null,
    evaluationEndAt = null,
  }) => {
    if (
      !Array.isArray(
        horizonBarsList
      ) ||
      horizonBarsList.length ===
        0
    ) {
      throw new Error(
        "GARCH_MULTI_HORIZON_LIST_REQUIRED"
      );
    }

    for (
      const horizonBars of
        horizonBarsList
    ) {
      if (
        !GARCH_NORMAL_MULTI_HORIZON_V1
          .supportedHorizonBars
          .includes(
            horizonBars
          )
      ) {
        throw new Error(
          `UNSUPPORTED_GARCH_MULTI_HORIZON:${horizonBars}`
        );
      }
    }

    const forecaster =
      createGarchNormalMultiHorizonForecaster();

    const modelConfig = {
      trainingWindowBars:
        GARCH_NORMAL_MULTI_HORIZON_V1
          .trainingWindowBars,

      refitEveryForecasts:
        GARCH_NORMAL_MULTI_HORIZON_V1
          .refitEveryForecasts,

      distribution:
        GARCH_NORMAL_MULTI_HORIZON_V1
          .distribution,

      meanModel:
        GARCH_NORMAL_MULTI_HORIZON_V1
          .meanModel,
    };

    const result =
      evaluateVolatilityMultiHorizonForecastModel({
        series,

        modelDefinition:
          MODEL_DEFINITION,

        modelConfig,

        historyWindowBars:
          GARCH_NORMAL_MULTI_HORIZON_V1
            .trainingWindowBars,

        horizonBarsList,

        expectedIntervalMs,

        evaluationStartAt,

        evaluationEndAt,

        forecastModel:
          forecaster
            .forecastMany,
      });

    return {
      ...result,

      protocol: {
        id:
          GARCH_NORMAL_MULTI_HORIZON_V1.id,

        version:
          GARCH_NORMAL_MULTI_HORIZON_V1
            .version,

        definition:
          GARCH_NORMAL_MULTI_HORIZON_V1,
      },

      diagnostics:
        forecaster
          .getDiagnostics(),
    };
  };

module.exports = {
  MODEL_DEFINITION,
  evaluateGarchNormalMultiHorizonV1,
};
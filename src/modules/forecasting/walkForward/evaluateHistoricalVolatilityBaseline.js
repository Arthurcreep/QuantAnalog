const {
  MODEL_DEFINITION,
  forecastHistoricalVolatilityBaseline,
} = require(
  "../models/historicalVolatilityBaselineV1"
);

const {
  evaluateVolatilityForecastModel,
} = require(
  "./evaluateVolatilityForecastModel"
);

const evaluateHistoricalVolatilityBaseline =
  ({
    series,
    lookbackBars,
    horizonBars,
    expectedIntervalMs,
    evaluationStartAt = null,
    evaluationEndAt = null,
  }) => {
    const result =
      evaluateVolatilityForecastModel({
        series,

        modelDefinition:
          MODEL_DEFINITION,

        modelConfig: {
          lookbackBars,
        },

        historyWindowBars:
          lookbackBars,

        horizonBars,

        expectedIntervalMs,

        evaluationStartAt,

        evaluationEndAt,

        forecastModel:
          ({
            series:
              history,

            modelConfig,

            horizonBars:
              forecastHorizonBars,

            expectedIntervalMs:
              forecastIntervalMs,
          }) =>
            forecastHistoricalVolatilityBaseline({
              series:
                history,

              lookbackBars:
                modelConfig
                  .lookbackBars,

              horizonBars:
                forecastHorizonBars,

              expectedIntervalMs:
                forecastIntervalMs,
            }),
      });

    return {
      ...result,

      config: {
        ...result.config,

        lookbackBars,

        horizonBars,

        expectedIntervalMs,

        evaluationStartAt,

        evaluationEndAt,
      },
    };
  };

module.exports = {
  evaluateHistoricalVolatilityBaseline,
};
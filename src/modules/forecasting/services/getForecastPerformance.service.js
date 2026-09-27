const {
  getForecastSeries,
} = require(
  "./getForecastSeries.service"
);

const {
  calculateForecastPerformance,
} = require(
  "../calculations/calculateForecastPerformance"
);

const ENGINE_VERSION =
  "forecast-performance-v1.0";

const getForecastPerformance =
  async ({
    forecastRunId,
    rollingWindow = 30,
    rollingMinObservations = 5,
  }, options = {}) => {
    const series =
      await getForecastSeries(
        {
          forecastRunId,
        },
        options
      );

    const performance =
      calculateForecastPerformance({
        series,

        rollingWindow,

        rollingMinObservations,
      });

    return {
      engineVersion:
        ENGINE_VERSION,

      context:
        series.context,

      model:
        series.model,

      protocol:
        series.protocol,

      firstIssuedAt:
        series.firstIssuedAt,

      lastIssuedAt:
        series.lastIssuedAt,

      runCount:
        series.runCount,

      ...performance,
    };
  };

module.exports = {
  ENGINE_VERSION,
  getForecastPerformance,
};
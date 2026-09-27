const {
  compareForecastSeries,
} = require(
  "./compareForecastSeries.service"
);

const {
  calculateRollingForecastComparison,
} = require(
  "../calculations/calculateRollingForecastComparison"
);

const ENGINE_VERSION =
  "forecast-comparison-performance-v1.0";

const getForecastComparisonPerformance =
  async ({
    candidateForecastRunId,
    benchmarkForecastRunId,
    rollingWindow = 30,
  }, options = {}) => {
    const comparison =
      await compareForecastSeries(
        {
          candidateForecastRunId,

          benchmarkForecastRunId,
        },
        options
      );

    const performance =
      calculateRollingForecastComparison({
        comparison,

        rollingWindow,
      });

    return {
      engineVersion:
        ENGINE_VERSION,

      context:
        comparison.context,

      candidate:
        comparison.candidate,

      benchmark:
        comparison.benchmark,

      commonIssueCount:
        comparison
          .commonIssueCount,

      firstCommonIssuedAt:
        comparison
          .firstCommonIssuedAt,

      lastCommonIssuedAt:
        comparison
          .lastCommonIssuedAt,

      ...performance,
    };
  };

module.exports = {
  ENGINE_VERSION,
  getForecastComparisonPerformance,
};
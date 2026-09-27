const {
  compareForecastSeries,
} = require(
  "./compareForecastSeries.service"
);

const {
  calculateForecastComparisonInference,
} = require(
  "../calculations/calculateForecastComparisonInference"
);

const ENGINE_VERSION =
  "forecast-comparison-inference-v1.0";

const getForecastComparisonInference =
  async ({
    candidateForecastRunId,
    benchmarkForecastRunId,
  }, options = {}) => {
    const comparison =
      await compareForecastSeries(
        {
          candidateForecastRunId,

          benchmarkForecastRunId,
        },
        options
      );

    const inference =
      calculateForecastComparisonInference({
        comparison,
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

      ...inference,
    };
  };

module.exports = {
  ENGINE_VERSION,
  getForecastComparisonInference,
};
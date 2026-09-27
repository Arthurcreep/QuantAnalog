const {
  getForecastSeries,
} = require(
  "./getForecastSeries.service"
);

const {
  compareForecastSeries,
} = require(
  "../calculations/compareForecastSeries"
);

const ENGINE_VERSION =
  "forecast-series-comparison-v1.0";

const compareForecastSeriesService =
  async ({
    candidateForecastRunId,
    benchmarkForecastRunId,
  }, options = {}) => {
    const [
      candidate,
      benchmark,
    ] =
      await Promise.all([
        getForecastSeries(
          {
            forecastRunId:
              candidateForecastRunId,
          },
          options
        ),

        getForecastSeries(
          {
            forecastRunId:
              benchmarkForecastRunId,
          },
          options
        ),
      ]);

    const comparison =
      compareForecastSeries({
        candidate,
        benchmark,
      });

    return {
      engineVersion:
        ENGINE_VERSION,

      context:
        candidate.context,

      candidate: {
        model:
          candidate.model,

        protocol:
          candidate.protocol,

        runCount:
          candidate.runCount,
      },

      benchmark: {
        model:
          benchmark.model,

        protocol:
          benchmark.protocol,

        runCount:
          benchmark.runCount,
      },

      ...comparison,
    };
  };

module.exports = {
  ENGINE_VERSION,
  compareForecastSeries:
    compareForecastSeriesService,
};
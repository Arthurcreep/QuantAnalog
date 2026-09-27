const {
  getForecastRunHistory,
} = require(
  "./getForecastRunHistory.service"
);

const ENGINE_VERSION =
  "forecast-run-evaluation-read-v1.0";

const getLatestEvaluation = (
  evaluations
) => {
  if (
    !Array.isArray(
      evaluations
    ) ||
    evaluations.length ===
      0
  ) {
    return null;
  }

  return evaluations[
    evaluations.length -
    1
  ];
};

const getForecastRunEvaluation =
  async ({
    forecastRunId,
  }, options = {}) => {
    const historyResult =
      await getForecastRunHistory(
        {
          forecastRunId,
        },
        options
      );

    const evaluations =
      historyResult
        .history
        .map(
          (item) => ({
            position:
              item.position,

            horizon:
              item.horizon,

            horizonBars:
              item.horizonBars,

            status:
              item.status,

            forecastId:
              item
                .forecast
                .id,

            targetWindowStartAt:
              item
                .forecast
                .targetWindowStartAt,

            targetWindowEndAt:
              item
                .forecast
                .targetWindowEndAt,

            prediction:
              item
                .forecast
                .prediction,

            actual:
              item.outcome
                ? item
                    .outcome
                    .actual
                : null,

            evaluation:
              getLatestEvaluation(
                item.evaluations
              ),
          })
        );

    return {
      engineVersion:
        ENGINE_VERSION,

      forecastRunId,

      model: {
        id:
          historyResult
            .forecastRun
            .modelId,

        version:
          historyResult
            .forecastRun
            .modelVersion,

        checksum:
          historyResult
            .forecastRun
            .modelChecksum,
      },

      protocol: {
        id:
          historyResult
            .forecastRun
            .protocolId,

        version:
          historyResult
            .forecastRun
            .protocolVersion,

        checksum:
          historyResult
            .forecastRun
            .protocolChecksum,
      },

      summary:
        historyResult
          .summary,

      evaluations,
    };
  };

module.exports = {
  ENGINE_VERSION,
  getForecastRunEvaluation,
};
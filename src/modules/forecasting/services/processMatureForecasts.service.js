const {
  findIncompleteMatureForecasts,
} = require(
  "../forecasts/forecast.repository"
);

const {
  processMatureForecast,
} = require(
  "./processMatureForecast.service"
);

const ENGINE_VERSION =
  "mature-forecast-batch-v1.0";

const DEFAULT_LIMIT =
  100;

const processMatureForecasts =
  async ({
    observedAt =
      new Date(),
    limit =
      DEFAULT_LIMIT,
  } = {}) => {
    const observedAtMs =
      new Date(
        observedAt
      ).getTime();

    if (
      !Number.isFinite(
        observedAtMs
      )
    ) {
      throw new Error(
        "INVALID_FORECAST_BATCH_OBSERVED_AT"
      );
    }

    if (
      !Number.isInteger(
        limit
      ) ||
      limit <= 0 ||
      limit > 1000
    ) {
      throw new Error(
        "INVALID_FORECAST_BATCH_LIMIT"
      );
    }

    const observedAtDate =
      new Date(
        observedAtMs
      );

    const candidates =
      await findIncompleteMatureForecasts({
        observedAt:
          observedAtDate,

        limit,
      });

    const results =
      [];

    for (
      const forecast of
        candidates
    ) {
      try {
        const result =
          await processMatureForecast({
            forecastId:
              forecast.id,

            observedAt:
              observedAtDate,
          });

        results.push(
          result
        );
      } catch (error) {
        results.push({
          forecastId:
            forecast.id,

          horizon:
            forecast.horizon,

          status:
            "FAILED",

          outcomeCreated:
            false,

          evaluationCreated:
            false,

          error: {
            code:
              error.code ||
              "FORECAST_PROCESSING_ERROR",

            message:
              error.message,
          },
        });
      }
    }

    const counts =
      results.reduce(
        (
          result,
          item
        ) => {
          result[
            item.status
          ] =
            (
              result[
                item.status
              ] ||
              0
            ) +
            1;

          return result;
        },
        {}
      );

    return {
      engineVersion:
        ENGINE_VERSION,

      observedAt:
        observedAtDate
          .toISOString(),

      candidateCount:
        candidates.length,

      processedCount:
        results.length,

      counts,

      results,
    };
  };

module.exports = {
  ENGINE_VERSION,
  DEFAULT_LIMIT,
  processMatureForecasts,
};
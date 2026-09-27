const {
  findForecastRunById,
} = require(
  "../runs/forecastRun.repository"
);

const {
  createAppError,
} = require(
  "../../../errors/appError"
);

const ENGINE_VERSION =
  "forecast-run-read-v1.0";

const getForecastRun =
  async ({
    forecastRunId,
  }, options = {}) => {
    const forecastRun =
      await findForecastRunById(
        forecastRunId,
        options
      );

    if (!forecastRun) {
      throw createAppError({
        statusCode:
          404,

        code:
          "FORECAST_RUN_NOT_FOUND",

        message:
          `ForecastRun ${forecastRunId} not found`,
      });
    }

    return {
      engineVersion:
        ENGINE_VERSION,

      forecastRun:
        forecastRun.get({
          plain:
            true,
        }),
    };
  };

module.exports = {
  ENGINE_VERSION,
  getForecastRun,
};
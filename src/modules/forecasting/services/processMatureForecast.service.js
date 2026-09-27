const sequelize = require(
  "../../../config/database"
);

const {
  findForecastById,
} = require(
  "../forecasts/forecast.repository"
);

const {
  findForecastOutcomeByForecastId,
} = require(
  "../outcomes/forecastOutcome.repository"
);

const {
  resolveActualDataset,
} = require(
  "./resolveActualDataset.service"
);

const {
  matureForecast,
} = require(
  "./matureForecast.service"
);

const {
  evaluateForecast,
} = require(
  "./evaluateForecast.service"
);

const {
  createAppError,
} = require(
  "../../../errors/appError"
);

const ENGINE_VERSION =
  "mature-forecast-processor-v1.0";

const processCore =
  async ({
    forecastId,
    observedAt,
  }, options) => {
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
        "INVALID_MATURE_FORECAST_OBSERVED_AT"
      );
    }

    /*
     * Row lock prevents two scheduler
     * instances processing the same
     * forecast simultaneously.
     */
    const forecast =
      await findForecastById(
        forecastId,
        {
          ...options,

          lock:
            options
              .transaction
              .LOCK
              .UPDATE,
        }
      );

    if (!forecast) {
      throw createAppError({
        statusCode:
          404,

        code:
          "FORECAST_NOT_FOUND",

        message:
          `Forecast ${forecastId} not found`,
      });
    }

    const targetWindowEndMs =
      new Date(
        forecast
          .targetWindowEndAt
      ).getTime();

    if (
      targetWindowEndMs >
      observedAtMs
    ) {
      return {
        engineVersion:
          ENGINE_VERSION,

        forecastId:
          forecast.id,

        horizon:
          forecast.horizon,

        status:
          "NOT_MATURE",

        outcomeCreated:
          false,

        evaluationCreated:
          false,
      };
    }

    let outcome =
      await findForecastOutcomeByForecastId(
        forecast.id,
        options
      );

    let outcomeCreated =
      false;

    let actualDataset =
      null;

    if (!outcome) {
      const resolution =
        await resolveActualDataset(
          {
            forecast,
          },
          options
        );

      if (
        !resolution.resolved
      ) {
        return {
          engineVersion:
            ENGINE_VERSION,

          forecastId:
            forecast.id,

          horizon:
            forecast.horizon,

          status:
            "WAITING_FOR_ACTUAL_DATASET",

          outcomeCreated:
            false,

          evaluationCreated:
            false,

          coverage:
            resolution.coverage,

          candidateCount:
            resolution
              .candidateCount,

          compatibleCandidateCount:
            resolution
              .compatibleCandidateCount,
        };
      }

      actualDataset =
        resolution
          .actualDataset;

      const maturity =
        await matureForecast(
          {
            forecastId:
              forecast.id,

            actualDatasetId:
              actualDataset.id,

            observedAt:
              new Date(
                observedAtMs
              ),
          },
          options
        );

      outcome =
        maturity.outcome;

      outcomeCreated =
        maturity.created;
    }

    const evaluation =
      await evaluateForecast(
        {
          forecastId:
            forecast.id,
        },
        options
      );

    return {
      engineVersion:
        ENGINE_VERSION,

      forecastId:
        forecast.id,

      horizon:
        forecast.horizon,

      status:
        (
          outcomeCreated ||
          evaluation.created
        )
          ? "EVALUATED"
          : "ALREADY_EVALUATED",

      outcomeCreated,

      evaluationCreated:
        evaluation.created,

      outcomeId:
        outcome.id,

      evaluationId:
        evaluation
          .evaluation
          .id,

      actualDatasetId:
        outcome
          .actualDatasetId,
    };
  };

const processMatureForecast =
  async ({
    forecastId,
    observedAt,
  }, options = {}) => {
    if (
      options.transaction
    ) {
      return processCore(
        {
          forecastId,
          observedAt,
        },
        options
      );
    }

    return sequelize.transaction(
      async (
        transaction
      ) =>
        processCore(
          {
            forecastId,
            observedAt,
          },
          {
            ...options,

            transaction,
          }
        )
    );
  };

module.exports = {
  ENGINE_VERSION,
  processMatureForecast,
};
const sequelize = require(
  "../../../config/database"
);

const {
  getForecastRunHistory,
} = require(
  "./getForecastRunHistory.service"
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

const ENGINE_VERSION =
  "forecast-run-lifecycle-v1.0";

const parseTimestamp = ({
  value,
  field,
}) => {
  const timestamp =
    new Date(
      value
    ).getTime();

  if (
    !Number.isFinite(
      timestamp
    )
  ) {
    throw new Error(
      `INVALID_FORECAST_LIFECYCLE_${field}`
    );
  }

  return timestamp;
};

const processCore =
  async ({
    forecastRunId,
    observedAt,
    actualDatasetId,
  }, options) => {
    const observedAtMs =
      parseTimestamp({
        value:
          observedAt,

        field:
          "OBSERVED_AT",
      });

    const before =
      await getForecastRunHistory(
        {
          forecastRunId,
        },
        options
      );

    const results =
      [];

    for (
      const item of
        before.history
    ) {
      const targetWindowEndMs =
        parseTimestamp({
          value:
            item
              .forecast
              .targetWindowEndAt,

          field:
            "TARGET_WINDOW_END_AT",
        });

      if (
        targetWindowEndMs >
        observedAtMs
      ) {
        results.push({
          forecastId:
            item
              .forecast
              .id,

          horizon:
            item.horizon,

          status:
            "SKIPPED_NOT_MATURE",

          outcomeCreated:
            false,

          evaluationCreated:
            false,
        });

        continue;
      }

      /*
       * Already fully processed.
       *
       * No need to invoke writes again,
       * although underlying services are
       * independently idempotent.
       */
      if (
        item.status ===
        "EVALUATED"
      ) {
        results.push({
          forecastId:
            item
              .forecast
              .id,

          horizon:
            item.horizon,

          status:
            "ALREADY_EVALUATED",

          outcomeCreated:
            false,

          evaluationCreated:
            false,
        });

        continue;
      }

      const maturity =
        await matureForecast(
          {
            forecastId:
              item
                .forecast
                .id,

            actualDatasetId,

            observedAt:
              new Date(
                observedAtMs
              ),
          },
          options
        );

      const evaluation =
        await evaluateForecast(
          {
            forecastId:
              item
                .forecast
                .id,
          },
          options
        );

      results.push({
        forecastId:
          item
            .forecast
            .id,

        horizon:
          item.horizon,

        status:
          "EVALUATED",

        outcomeCreated:
          maturity.created,

        evaluationCreated:
          evaluation.created,

        outcomeId:
          maturity
            .outcome
            .id,

        evaluationId:
          evaluation
            .evaluation
            .id,
      });
    }

    const after =
      await getForecastRunHistory(
        {
          forecastRunId,
        },
        options
      );

    return {
      engineVersion:
        ENGINE_VERSION,

      forecastRunId,

      observedAt:
        new Date(
          observedAtMs
        ).toISOString(),

      actualDatasetId,

      before:
        before.summary,

      after:
        after.summary,

      results,
    };
  };

const processForecastRunLifecycle =
  async ({
    forecastRunId,
    observedAt,
    actualDatasetId,
  }, options = {}) => {
    if (
      typeof actualDatasetId !==
        "string" ||
      actualDatasetId.length ===
        0
    ) {
      throw new Error(
        "FORECAST_LIFECYCLE_ACTUAL_DATASET_ID_REQUIRED"
      );
    }

    if (
      options.transaction
    ) {
      return processCore(
        {
          forecastRunId,

          observedAt,

          actualDatasetId,
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
            forecastRunId,

            observedAt,

            actualDatasetId,
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
  processForecastRunLifecycle,
};
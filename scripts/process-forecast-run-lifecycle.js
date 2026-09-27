const sequelize = require(
  "../src/config/database"
);

const {
  processForecastRunLifecycle,
} = require(
  "../src/modules/forecasting/services/processForecastRunLifecycle.service"
);

const FORECAST_RUN_ID =
  process.argv[2];

const ACTUAL_DATASET_ID =
  process.argv[3];

const OBSERVED_AT =
  process.argv[4] ||
  new Date()
    .toISOString();

const run = async () => {
  try {
    if (
      !FORECAST_RUN_ID
    ) {
      throw new Error(
        "FORECAST_RUN_ID_REQUIRED"
      );
    }

    if (
      !ACTUAL_DATASET_ID
    ) {
      throw new Error(
        "ACTUAL_DATASET_ID_REQUIRED"
      );
    }

    await sequelize.authenticate();

    const result =
      await processForecastRunLifecycle({
        forecastRunId:
          FORECAST_RUN_ID,

        actualDatasetId:
          ACTUAL_DATASET_ID,

        observedAt:
          OBSERVED_AT,
      });

    console.log(
      "ForecastRun lifecycle processed."
    );

    console.log({
      forecastRunId:
        result.forecastRunId,

      observedAt:
        result.observedAt,

      actualDatasetId:
        result.actualDatasetId,

      before:
        result.before,

      after:
        result.after,
    });

    console.table(
      result.results.map(
        (item) => ({
          horizon:
            item.horizon,

          status:
            item.status,

          outcomeCreated:
            item.outcomeCreated,

          evaluationCreated:
            item
              .evaluationCreated,
        })
      )
    );
  } catch (error) {
    console.error(
      "ForecastRun lifecycle processing failed:",
      error
    );

    process.exitCode =
      1;
  } finally {
    await sequelize.close();
  }
};

run();
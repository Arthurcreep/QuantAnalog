const sequelize = require(
  "../src/config/database"
);

const {
  processMatureForecasts,
} = require(
  "../src/modules/forecasting/services/processMatureForecasts.service"
);

const OBSERVED_AT =
  process.argv[2] ||
  new Date()
    .toISOString();

const LIMIT =
  process.argv[3]
    ? Number(
        process.argv[3]
      )
    : 100;

const run = async () => {
  try {
    await sequelize.authenticate();

    const result =
      await processMatureForecasts({
        observedAt:
          OBSERVED_AT,

        limit:
          LIMIT,
      });

    console.log(
      "Mature forecast batch processed."
    );

    console.log({
      observedAt:
        result.observedAt,

      candidateCount:
        result.candidateCount,

      processedCount:
        result.processedCount,

      counts:
        result.counts,
    });

    if (
      result.results.length >
      0
    ) {
      console.table(
        result.results.map(
          (item) => ({
            forecastId:
              item.forecastId,

            horizon:
              item.horizon,

            status:
              item.status,

            outcomeCreated:
              item.outcomeCreated,

            evaluationCreated:
              item
                .evaluationCreated,

            actualDatasetId:
              item
                .actualDatasetId ||
              null,

            error:
              item.error
                ? item
                    .error
                    .message
                : null,
          })
        )
      );
    }
  } catch (error) {
    console.error(
      "Mature forecast batch failed:",
      error
    );

    process.exitCode =
      1;
  } finally {
    await sequelize.close();
  }
};

run();
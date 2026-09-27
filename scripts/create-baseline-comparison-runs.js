const sequelize = require(
  "../src/config/database"
);

const {
  runHistoricalVolatilityMultiHorizonForecast,
} = require(
  "../src/modules/forecasting/services/runHistoricalVolatilityMultiHorizonForecast.service"
);

const DATASET_ID =
  "f10885c8-f99e-494e-9ad4-fc0f5c385f26";

const SOURCE_ANALYSIS_RUN_ID =
  "828053be-6334-4475-a18b-a837439c8161";

const ISSUE_DATES = [
  "2026-09-15T00:00:00.000Z",
  "2026-09-16T00:00:00.000Z",
];

const run = async () => {
  try {
    await sequelize.authenticate();

    for (
      const issuedAt of
        ISSUE_DATES
    ) {
      const result =
        await runHistoricalVolatilityMultiHorizonForecast({
          datasetId:
            DATASET_ID,

          issuedAt,

          sourceAnalysisRunId:
            SOURCE_ANALYSIS_RUN_ID,
        });

      console.log({
        issuedAt,

        forecastRunId:
          result
            .forecastRun
            .run
            .id,

        created:
          result
            .forecastRun
            .created,

        forecasts:
          result
            .forecasts
            .map(
              (item) => ({
                horizon:
                  item.horizon,

                created:
                  item.created,
              })
            ),
      });
    }
  } catch (error) {
    console.error(
      "Baseline ForecastRun creation failed:",
      error
    );

    process.exitCode =
      1;
  } finally {
    await sequelize.close();
  }
};

run();
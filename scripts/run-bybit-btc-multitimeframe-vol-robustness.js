const sequelize = require(
  "../src/config/database"
);

const {
  runVolatilityRobustnessResearch,
} = require(
  "../src/modules/research/services/runVolatilityRobustnessResearch.service"
);

const DATASETS = [
  {
    timeframe: "5m",
    datasetId:
      "7e6def5c-ea04-46cf-b7aa-f06b3102d0a3",
  },
  {
    timeframe: "15m",
    datasetId:
      "dd79a94f-898a-4c28-a7ac-dd477b72976c",
  },
  {
    timeframe: "1h",
    datasetId:
      "f10885c8-f99e-494e-9ad4-fc0f5c385f26",
  },
  {
    timeframe: "4h",
    datasetId:
      "da08ebbc-9e71-47ad-99e6-117b88deeb3f",
  },
  {
    timeframe: "1d",
    datasetId:
      "1b40b756-002a-4abb-89c4-44ae395af1d8",
  },
];

const run = async () => {
  try {
    await sequelize.authenticate();

    const rows = [];

    for (
      const dataset of
      DATASETS
    ) {
      console.log(
        `\n[ROBUSTNESS] BTCUSDT ${dataset.timeframe}`
      );

      const startedAt =
        Date.now();

      const result =
        await runVolatilityRobustnessResearch({
          datasetId:
            dataset.datasetId,
        });

      for (
        const year of
        result.metrics.yearly
      ) {
        rows.push({
          TF:
            dataset.timeframe,

          Year:
            year.year,

          N:
            year.sampleSize,

          "|r| ACF1":
            year
              .absoluteReturnAcf ??
            null,

          "r² ACF1":
            year
              .squaredReturnAcf ??
            null,

          "ARCH R²":
            year
              .archLm
              ?.rSquared ??
            null,

          Status:
            year.status,
        });
      }

      console.log({
        timeframe:
          dataset.timeframe,

        years:
          result.metrics
            .yearly.length,

        seconds:
          (
            (
              Date.now() -
              startedAt
            ) /
            1000
          ).toFixed(2),

        analysisRunId:
          result.analysisRunId,
      });
    }

    console.log(
      "\n===== BTCUSDT YEARLY VOLATILITY ROBUSTNESS ====="
    );

    console.table(
      rows
    );

    console.log(
      "\nBTCUSDT yearly robustness completed"
    );
  } catch (error) {
    console.error(
      "BTCUSDT yearly robustness failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();
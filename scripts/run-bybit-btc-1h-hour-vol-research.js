const sequelize = require(
  "../src/config/database"
);

const {
  runCalendarHourVolatilityResearch,
} = require(
  "../src/modules/research/services/runCalendarHourVolatilityResearch.service"
);

const DATASET_ID =
  "f10885c8-f99e-494e-9ad4-fc0f5c385f26";

const buildTable = ({
  development,
  validation,
}) => {
  const validationByHour =
    new Map(
      validation.map(
        (item) => [
          item.category,
          item,
        ]
      )
    );

  return development.map(
    (dev) => {
      const val =
        validationByHour.get(
          dev.category
        );

      return {
        Hour:
          dev.category,

        "DEV N":
          dev.count,

        "DEV Mean RV":
          dev.mean,

        "DEV Ratio":
          dev.ratioToOverallMean,

        "VAL N":
          val?.count ?? null,

        "VAL Mean RV":
          val?.mean ?? null,

        "VAL Ratio":
          val
            ?.ratioToOverallMean ??
          null,
      };
    }
  );
};

const run = async () => {
  try {
    await sequelize.authenticate();

    console.log(
      "Running BTCUSDT 1h hour-of-day factor research..."
    );

    const result =
      await runCalendarHourVolatilityResearch({
        datasetId:
          DATASET_ID,
      });

    console.log(
      "\n===== HOUR -> FUTURE RV 24H ====="
    );

    console.table(
      buildTable({
        development:
          result.metrics
            .development
            .profile,

        validation:
          result.metrics
            .retrospectiveValidation
            .profile,
      })
    );

    console.log(
      "\n===== PROFILE STABILITY ====="
    );

    console.log(
      result.metrics.stability
    );

    console.log(
      "\n===== RUN ====="
    );

    console.log({
      analysisRunId:
        result.analysisRunId,

      matrixRows:
        result.metrics
          .sample
          .matrixRows,

      developmentRows:
        result.metrics
          .sample
          .developmentRows,

      validationRows:
        result.metrics
          .sample
          .validationRows,
    });
  } catch (error) {
    console.error(
      "Hour factor research failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();
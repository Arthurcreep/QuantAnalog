const sequelize = require(
  "../src/config/database"
);

const {
  runCalendarHourBootstrapResearch,
} = require(
  "../src/modules/research/services/runCalendarHourBootstrapResearch.service"
);

const DATASET_ID =
  "f10885c8-f99e-494e-9ad4-fc0f5c385f26";

const toPercent = (
  value
) =>
  value * 100;

const run = async () => {
  try {
    await sequelize.authenticate();

    console.log(
      "Running BTCUSDT calendar-hour block bootstrap..."
    );

    const result =
      await runCalendarHourBootstrapResearch({
        datasetId:
          DATASET_ID,
      });

    const rows =
      result.metrics.results.map(
        (item) => {
          const observed =
            item.bootstrap
              .observed;

          const relative =
            item.bootstrap
              .fixedContrast
              .relativeDifference;

          const span =
            item.bootstrap
              .descriptiveSpan;

          return {
            Horizon:
              item.horizon,

            "DEV Low":
              item.development
                .frozenLowHour,

            "DEV High":
              item.development
                .frozenHighHour,

            "VAL Diff %":
              toPercent(
                observed
                  .relativeDifference
              ),

            "95% CI Low":
              toPercent(
                relative.lower
              ),

            "95% CI High":
              toPercent(
                relative.upper
              ),

            "Bootstrap Span %":
              toPercent(
                span.median
              ),

            "Span CI Low":
              toPercent(
                span.lower
              ),

            "Span CI High":
              toPercent(
                span.upper
              ),
          };
        }
      );

    console.log(
      "\n===== VALIDATION BLOCK BOOTSTRAP ====="
    );

    console.table(
      rows
    );

    console.log(
      "\n===== RUN ====="
    );

    console.log({
      analysisRunId:
        result.analysisRunId,

      engineVersion:
        result.engineVersion,

      blockSizeHours:
        result.metrics
          .blockSizeHours,

      iterations:
        result.metrics
          .iterations,
    });
  } catch (error) {
    console.error(
      "Block bootstrap failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();
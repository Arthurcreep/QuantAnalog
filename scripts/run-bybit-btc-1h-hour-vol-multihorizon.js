const sequelize = require(
  "../src/config/database"
);

const {
  runCalendarHourMultiHorizonResearch,
} = require(
  "../src/modules/research/services/runCalendarHourMultiHorizonResearch.service"
);

const DATASET_ID =
  "f10885c8-f99e-494e-9ad4-fc0f5c385f26";

const toPercent = (
  value
) =>
  value === null ||
  value === undefined
    ? null
    : value * 100;

const run = async () => {
  try {
    await sequelize.authenticate();

    console.log(
      "Running BTCUSDT hour-of-day multi-horizon research..."
    );

    const result =
      await runCalendarHourMultiHorizonResearch({
        datasetId:
          DATASET_ID,
      });

    const rows =
      result.metrics.horizons.map(
        (item) => ({
          Horizon:
            item.horizon,

          "DEV N":
            item.development
              .rowCount,

          "VAL N":
            item
              .retrospectiveValidation
              .rowCount,

          "DEV Low Hour":
            item.development
              .summary
              .minimumHour,

          "DEV High Hour":
            item.development
              .summary
              .maximumHour,

          "DEV Span %":
            toPercent(
              item.development
                .summary
                .ratioSpan
            ),

          "VAL Low Hour":
            item
              .retrospectiveValidation
              .summary
              .minimumHour,

          "VAL High Hour":
            item
              .retrospectiveValidation
              .summary
              .maximumHour,

          "VAL Span %":
            toPercent(
              item
                .retrospectiveValidation
                .summary
                .ratioSpan
            ),

          "DEV→VAL Corr":
            item
              .stability
              .profileCorrelation,
        })
      );

    console.log(
      "\n===== HOUR -> FUTURE RV MULTI-HORIZON ====="
    );

    console.table(
      rows
    );

    console.log(
      "\n===== OVERALL RV ====="
    );

    console.table(
      result.metrics.horizons.map(
        (item) => ({
          Horizon:
            item.horizon,

          "DEV Mean RV %":
            toPercent(
              item.development
                .overall
                .mean
            ),

          "VAL Mean RV %":
            toPercent(
              item
                .retrospectiveValidation
                .overall
                .mean
            ),
        })
      )
    );

    console.log(
      "\n===== RUN ====="
    );

    console.log({
      analysisRunId:
        result.analysisRunId,

      protocolId:
        result.protocolId,

      protocolVersion:
        result.protocolVersion,

      protocolChecksum:
        result.protocolChecksum,

      forwardOos:
        result.metrics
          .forwardOos
          .status,
    });
  } catch (error) {
    console.error(
      "Multi-horizon hour research failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();
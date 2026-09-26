const sequelize = require(
  "../src/config/database"
);

const {
  runCalendarHourFactorResearch,
} = require(
  "../src/modules/research/services/runCalendarHourFactorResearch.service"
);

const DATASET_ID =
  "f10885c8-f99e-494e-9ad4-fc0f5c385f26";

const formatPValue = (
  value
) =>
  value === 0
    ? "< numerical precision"
    : value;

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
      "Running calendar-hour through generic categorical engine..."
    );

    const result =
      await runCalendarHourFactorResearch({
        datasetId:
          DATASET_ID,
      });

    console.log(
      "\n===== GENERIC CALENDAR HOUR FACTOR ====="
    );

    console.table(
      result
        .metrics
        .horizons
        .map(
          (item) => ({
            Horizon:
              item.horizon,

            "DEV Low":
              item
                .evaluation
                .frozenContrast
                .lowCategory,

            "DEV High":
              item
                .evaluation
                .frozenContrast
                .highCategory,

            "DEV→VAL Corr":
              item
                .evaluation
                .stability
                .profileCorrelation,

            "DEV HAC p":
              formatPValue(
                item
                  .evaluation
                  .development
                  .hac
                  .pValue
              ),

            "DEV BH p":
              item
                .multipleTesting
                .developmentAdjustedPValue,

            "VAL HAC p":
              formatPValue(
                item
                  .evaluation
                  .retrospectiveValidation
                  .hac
                  .pValue
              ),

            "VAL BH p":
              item
                .multipleTesting
                .validationAdjustedPValue,

            "VAL Diff %":
              toPercent(
                item
                  .bootstrap
                  .observed
                  .relativeDifference
              ),

            "CI Low %":
              toPercent(
                item
                  .bootstrap
                  .fixedContrast
                  .relativeDifference
                  .lower
              ),

            "CI High %":
              toPercent(
                item
                  .bootstrap
                  .fixedContrast
                  .relativeDifference
                  .upper
              ),
          })
        )
    );

    console.log(
      "\n===== ANALYSIS RUN ====="
    );

    console.log({
      analysisRunId:
        result.analysisRunId,

      datasetId:
        result.datasetId,

      engineVersion:
        result.engineVersion,

      protocolId:
        result.protocolId,

      protocolVersion:
        result.protocolVersion,

      protocolChecksum:
        result.protocolChecksum,

      forwardOos:
        result
          .metrics
          .forwardOos
          .status,
    });
  } catch (error) {
    console.error(
      "Generic calendar-hour factor research failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();
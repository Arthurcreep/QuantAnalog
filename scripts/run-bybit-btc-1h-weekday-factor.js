const sequelize = require(
  "../src/config/database"
);

const {
  runCategoricalFactorResearch,
} = require(
  "../src/modules/research/services/runCategoricalFactorResearch.service"
);

const {
  CALENDAR_WEEKDAY_FUTURE_RV_V1,
} = require(
  "../src/modules/research/protocols/calendarWeekdayFutureRvV1"
);

const DATASET_ID =
  "f10885c8-f99e-494e-9ad4-fc0f5c385f26";

const WEEKDAYS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

const toPercent = (
  value
) =>
  value * 100;

const formatPValue = ({
  value,
  underflow,
}) => {
  if (underflow) {
    return "< numerical precision";
  }

  return value;
};

const run = async () => {
  try {
    await sequelize.authenticate();

    console.log(
      "Running universal categorical factor research..."
    );

    console.log({
      feature:
        CALENDAR_WEEKDAY_FUTURE_RV_V1
          .feature
          .name,

      target:
        CALENDAR_WEEKDAY_FUTURE_RV_V1
          .target
          .name,
    });

    const result =
      await runCategoricalFactorResearch({
        datasetId:
          DATASET_ID,

        protocol:
          CALENDAR_WEEKDAY_FUTURE_RV_V1,
      });

    const table =
      result.metrics.horizons.map(
        (item) => {
          const evaluation =
            item.evaluation;

          const bootstrap =
            item.bootstrap;

          const low =
            evaluation
              .frozenContrast
              .lowCategory;

          const high =
            evaluation
              .frozenContrast
              .highCategory;

          return {
            Horizon:
              item.horizon,

            "DEV Low":
              WEEKDAYS[low],

            "DEV High":
              WEEKDAYS[high],

            "DEV→VAL Corr":
              evaluation
                .stability
                .profileCorrelation,

            "DEV HAC p":
              formatPValue({
                value:
                  evaluation
                    .development
                    .hac
                    .pValue,

                underflow:
                  evaluation
                    .development
                    .hac
                    .pValueUnderflow,
              }),

            "DEV BH p":
              item
                .multipleTesting
                .developmentAdjustedPValue,

            "VAL HAC p":
              formatPValue({
                value:
                  evaluation
                    .retrospectiveValidation
                    .hac
                    .pValue,

                underflow:
                  evaluation
                    .retrospectiveValidation
                    .hac
                    .pValueUnderflow,
              }),

            "VAL BH p":
              item
                .multipleTesting
                .validationAdjustedPValue,

            "VAL Diff %":
              toPercent(
                bootstrap
                  .observed
                  .relativeDifference
              ),

            "CI Low %":
              toPercent(
                bootstrap
                  .fixedContrast
                  .relativeDifference
                  .lower
              ),

            "CI High %":
              toPercent(
                bootstrap
                  .fixedContrast
                  .relativeDifference
                  .upper
              ),
          };
        }
      );

    console.log(
      "\n===== UNIVERSAL WEEKDAY FACTOR RESEARCH ====="
    );

    console.table(
      table
    );

    console.log(
      "\n===== ANALYSIS RUN ====="
    );

    console.log({
      analysisRunId:
        result.analysisRunId,

      engineVersion:
        result.engineVersion,

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
      "Weekday factor research failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();
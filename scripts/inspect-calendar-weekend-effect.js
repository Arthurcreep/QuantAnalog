const sequelize = require(
  "../src/config/database"
);

const {
  buildResearchReport,
} = require(
  "../src/modules/research/reports/buildResearchReport.service"
);

const findCategory = (
  profile,
  category
) =>
  profile?.find(
    (item) =>
      item.category === category
  ) || null;

const percentDifference = (
  weekend,
  weekday
) => {
  if (
    typeof weekend !== "number" ||
    typeof weekday !== "number" ||
    weekday === 0
  ) {
    return null;
  }

  return (
    (
      weekend /
      weekday
    ) -
    1
  ) * 100;
};

const run = async () => {
  try {
    const researchBatchId =
      process.argv[2];

    if (!researchBatchId) {
      throw new Error(
        "RESEARCH_BATCH_ID_REQUIRED"
      );
    }

    await sequelize.authenticate();

    const report =
      await buildResearchReport({
        researchBatchId,
      });

    const hypothesis =
      report.hypotheses.find(
        (item) =>
          item.hypothesisId ===
          "H_CAL_003"
      );

    if (!hypothesis) {
      throw new Error(
        "H_CAL_003_NOT_FOUND"
      );
    }

    const analysisRun =
      hypothesis.analysisRuns[0];

    if (!analysisRun) {
      throw new Error(
        "H_CAL_003_ANALYSIS_RUN_NOT_FOUND"
      );
    }

    const horizons =
      analysisRun
        .metrics
        ?.horizons ||
      [];

    console.log(
      "===== H_CAL_003 WEEKEND EFFECT ====="
    );

    console.log({
      researchBatchId,

      analysisRunId:
        analysisRun.analysisRunId,

      evidenceLevel:
        hypothesis
          .evidence
          .level,

      evidenceLabel:
        hypothesis
          .evidence
          .label,

      forwardValidated:
        hypothesis
          .evidence
          .forwardOos
          ?.validated ??
        false,
    });

    const rows =
      horizons.map(
        (item) => {
          const devProfile =
            item
              .evaluation
              ?.development
              ?.profile;

          const validationProfile =
            item
              .evaluation
              ?.retrospectiveValidation
              ?.profile;

          const devWeekday =
            findCategory(
              devProfile,
              0
            );

          const devWeekend =
            findCategory(
              devProfile,
              1
            );

          const valWeekday =
            findCategory(
              validationProfile,
              0
            );

          const valWeekend =
            findCategory(
              validationProfile,
              1
            );

          const devDifferencePct =
            percentDifference(
              devWeekend?.mean,
              devWeekday?.mean
            );

          const validationDifferencePct =
            percentDifference(
              valWeekend?.mean,
              valWeekday?.mean
            );

          const bootstrapCi =
            item
              .bootstrap
              ?.fixedContrast
              ?.relativeDifference;

          return {
            Horizon:
              item.horizon,

            DevWeekday:
              devWeekday?.mean,

            DevWeekend:
              devWeekend?.mean,

            DevWeekendVsWeekdayPct:
              devDifferencePct,

            ValidationWeekday:
              valWeekday?.mean,

            ValidationWeekend:
              valWeekend?.mean,

            ValidationWeekendVsWeekdayPct:
              validationDifferencePct,

            DevLowCategory:
              item
                .evaluation
                ?.frozenContrast
                ?.lowCategory,

            DevHighCategory:
              item
                .evaluation
                ?.frozenContrast
                ?.highCategory,

            BootstrapLower:
              bootstrapCi?.lower,

            BootstrapUpper:
              bootstrapCi?.upper,

            DevP:
              item
                .evaluation
                ?.development
                ?.hac
                ?.pValue,

            ValidationP:
              item
                .evaluation
                ?.retrospectiveValidation
                ?.hac
                ?.pValue,
          };
        }
      );

    console.log(
      "\n0 = WEEKDAY, 1 = WEEKEND\n"
    );

    console.table(
      rows
    );
  } catch (error) {
    console.error(
      "Weekend effect inspection failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();
const sequelize = require(
  "../src/config/database"
);

const {
  buildResearchReport,
} = require(
  "../src/modules/research/reports/buildResearchReport.service"
);

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const findProfileCategory = (
  profile,
  category
) =>
  profile?.find(
    (item) =>
      item.category ===
      category
  ) || null;

const findBootstrapCategory = (
  profile,
  category
) =>
  profile?.find(
    (item) =>
      item.category ===
      category
  ) || null;

const buildMonthRows = ({
  horizon,
}) => {
  const development =
    horizon
      .evaluation
      ?.development;

  const validation =
    horizon
      .evaluation
      ?.retrospectiveValidation;

  const bootstrapProfile =
    horizon
      .bootstrap
      ?.profile;

  return MONTH_NAMES.map(
    (
      month,
      category
    ) => {
      const dev =
        findProfileCategory(
          development?.profile,
          category
        );

      const val =
        findProfileCategory(
          validation?.profile,
          category
        );

      const bootstrap =
        findBootstrapCategory(
          bootstrapProfile,
          category
        );

      return {
        Month:
          month,

        Category:
          category,

        DevMean:
          dev?.mean,

        DevVsOverall:
          dev?.ratioToOverallMean,

        ValidationMean:
          val?.mean,

        ValidationVsOverall:
          val?.ratioToOverallMean,

        BootstrapLower:
          bootstrap
            ?.confidenceInterval
            ?.lower,

        BootstrapMedian:
          bootstrap
            ?.confidenceInterval
            ?.median,

        BootstrapUpper:
          bootstrap
            ?.confidenceInterval
            ?.upper,
      };
    }
  );
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
          "H_CAL_004"
      );

    if (!hypothesis) {
      throw new Error(
        "H_CAL_004_NOT_FOUND"
      );
    }

    const analysisRun =
      hypothesis.analysisRuns[0];

    if (!analysisRun) {
      throw new Error(
        "H_CAL_004_ANALYSIS_RUN_NOT_FOUND"
      );
    }

    const horizons =
      analysisRun
        .metrics
        ?.horizons ||
      [];

    console.log(
      "===== H_CAL_004 MONTH EFFECT ====="
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

      supportedHorizons:
        hypothesis
          .evidence
          .supportedHorizons,

      unsupportedHorizons:
        hypothesis
          .evidence
          .unsupportedHorizons,

      forwardOos:
        hypothesis
          .evidence
          .forwardOos,
    });

    console.log(
      "\n===== EVIDENCE BY HORIZON ====="
    );

    console.table(
      hypothesis
        .evidence
        .horizons
        .map(
          (item) => ({
            Horizon:
              item.horizon,

            DevP:
              item
                .developmentPValue,

            DevAdjustedP:
              item
                .developmentAdjustedPValue,

            ValidationP:
              item
                .validationPValue,

            ValidationAdjustedP:
              item
                .validationAdjustedPValue,

            ProfileCorrelation:
              item
                .profileCorrelation,

            BootstrapSupported:
              item
                .bootstrapSupported,

            OosSupported:
              item
                .oosSupported,

            RobustSupported:
              item
                .robustSupported,
          })
        )
    );

    for (
      const horizon of
      horizons
    ) {
      console.log(
        `\n===== ${horizon.horizon} MONTH PROFILE =====`
      );

      console.log({
        frozenLowCategory:
          horizon
            .evaluation
            ?.frozenContrast
            ?.lowCategory,

        frozenLowMonth:
          MONTH_NAMES[
            horizon
              .evaluation
              ?.frozenContrast
              ?.lowCategory
          ],

        frozenHighCategory:
          horizon
            .evaluation
            ?.frozenContrast
            ?.highCategory,

        frozenHighMonth:
          MONTH_NAMES[
            horizon
              .evaluation
              ?.frozenContrast
              ?.highCategory
          ],

        bootstrapAttempts:
          horizon
            .bootstrap
            ?.config
            ?.attempts,

        rejectedBootstrapIterations:
          horizon
            .bootstrap
            ?.config
            ?.rejectedIterations,
      });

      console.table(
        buildMonthRows({
          horizon,
        })
      );
    }
  } catch (error) {
    console.error(
      "Month effect inspection failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();
const sequelize = require(
  "../src/config/database"
);

const {
  buildResearchReport,
} = require(
  "../src/modules/research/reports/buildResearchReport.service"
);

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

    console.log(
      "\n===== ENGINE ====="
    );

    console.log({
      reportEngineVersion:
        report
          .reportEngineVersion,

      evidenceEngineVersion:
        report
          .evidence
          .engineVersion,

      evidencePolicy:
        report
          .evidence
          .policy,
    });

    console.log(
      "\n===== RESEARCH FAMILIES ====="
    );

    console.table(
      report
        .familyMultipleTesting
        .families
        .map(
          (family) => ({
            Family:
              family.familyId,

            Hypotheses:
              family
                .hypothesisIds
                .join(", "),

            HypothesisCount:
              family
                .hypothesisCount,

            DevTests:
              family
                .developmentTestCount,

            ValTests:
              family
                .validationTestCount,
          })
        )
    );

    console.log(
      "\n===== EVIDENCE AFTER FAMILY BH ====="
    );

    console.table(
      report
        .hypotheses
        .map(
          (item) => ({
            Hypothesis:
              item
                .hypothesisId,

            Family:
              item.family,

            EvidenceStatus:
              item
                .evidence
                ?.status,

            Level:
              item
                .evidence
                ?.level ??
              "",

            Label:
              item
                .evidence
                ?.label ||
              "",

            WithinBH:
              item
                .evidence
                ?.criteria
                ?.withinHypothesisAdjustedHorizons ??
              "",

            FamilyBH:
              item
                .evidence
                ?.criteria
                ?.familyAdjustedHorizons ??
              "",

            OOS:
              item
                .evidence
                ?.criteria
                ?.oosSupportedHorizons ??
              "",

            Robust:
              item
                .evidence
                ?.criteria
                ?.robustSupportedHorizons ??
              "",
          })
        )
    );

    for (
      const hypothesis of
      report.hypotheses
    ) {
      const horizons =
        hypothesis
          .evidence
          ?.horizons;

      if (
        !Array.isArray(
          horizons
        ) ||
        horizons.length === 0
      ) {
        continue;
      }

      console.log(
        `\n===== ${hypothesis.hypothesisId} =====`
      );

      console.table(
        horizons.map(
          (item) => ({
            Horizon:
              item.horizon,

            RawDev:
              item
                .developmentPValue,

            WithinDev:
              item
                .developmentWithinAdjustedPValue,

            FamilyDev:
              item
                .developmentFamilyAdjustedPValue,

            RawVal:
              item
                .validationPValue,

            WithinVal:
              item
                .validationWithinAdjustedPValue,

            FamilyVal:
              item
                .validationFamilyAdjustedPValue,
          })
        )
      );
    }
  } catch (error) {
    console.error(
      "Family multiple testing inspection failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();
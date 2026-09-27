const assert = require(
  "assert"
);

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

    const hypothesis =
      report
        .hypotheses
        .find(
          (item) =>
            item.hypothesisId ===
            "H_VOL_003"
        );

    assert.ok(
      hypothesis,
      "H_VOL_003_NOT_FOUND"
    );

    assert.strictEqual(
      hypothesis.executionStatus,
      "COMPLETED"
    );

    assert.ok(
      hypothesis.evidence,
      "H_VOL_003_EVIDENCE_MISSING"
    );

    assert.strictEqual(
      hypothesis
        .evidence
        .status,
      "EVALUATED"
    );

    const evidence =
      hypothesis.evidence;

    console.log(
      "H_VOL_003 evidence inspection passed."
    );

    console.log(
      "\n===== H_VOL_003 SUMMARY ====="
    );

    console.log({
      hypothesisId:
        hypothesis.hypothesisId,

      executionStatus:
        hypothesis.executionStatus,

      evidenceStatus:
        evidence.status,

      level:
        evidence.level,

      label:
        evidence.label,

      supportedHorizons:
        evidence
          .supportedHorizons,

      robustSupportedHorizons:
        evidence
          .robustSupportedHorizons,

      forwardValidated:
        evidence
          .forwardOos
          ?.validated,

      robustnessEvidenceEligible:
        evidence
          .criteria
          ?.robustnessEvidenceEligible,

      requiredSupportingHorizons:
        evidence
          .criteria
          ?.requiredSupportingHorizons,

      developmentSignificantHorizons:
        evidence
          .criteria
          ?.developmentSignificantHorizons,

      multipleTestingAdjustedHorizons:
        evidence
          .criteria
          ?.multipleTestingAdjustedHorizons,

      oosSupportedHorizons:
        evidence
          .criteria
          ?.oosSupportedHorizons,

      bootstrapSupportedHorizons:
        evidence
          .criteria
          ?.bootstrapSupportedHorizons,

      yearlySupportedHorizons:
        evidence
          .criteria
          ?.yearlySupportedHorizons,

      robustSupportedCount:
        evidence
          .criteria
          ?.robustSupportedHorizons,
    });

    console.log(
      "\n===== HORIZONS ====="
    );

    console.table(
      evidence
        .horizons
        .map(
          (item) => ({
            Horizon:
              item.horizon,

            DevBeta:
              item
                .developmentBeta,

            DevP:
              item
                .developmentPValue,

            DevAdjP:
              item
                .developmentAdjustedPValue,

            ValBeta:
              item
                .validationBeta,

            ValP:
              item
                .validationPValue,

            ValAdjP:
              item
                .validationAdjustedPValue,

            SignStable:
              item
                .signStable,

            OosSupported:
              item
                .oosSupported,

            Bootstrap:
              item
                .bootstrapSupported,

            Yearly:
              item
                .yearlySupported,

            Robust:
              item
                .robustSupported,

            DevR2:
              item
                .developmentR2,

            ValR2:
              item
                .validationR2,
          })
        )
    );

    console.log(
      "\n===== NOTES ====="
    );

    for (
      const note of
      evidence.notes || []
    ) {
      console.log(
        `- ${note}`
      );
    }
  } catch (error) {
    console.error(
      "H_VOL_003 evidence inspection failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();
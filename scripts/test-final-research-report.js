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

const CURRENT_POLICY_CHECKSUM =
  "069ea724f59356bb09f887a188211b1b8afb4f4c931720b99a3b87fac48b9c0f";

const findHypothesis = (
  report,
  hypothesisId
) =>
  report
    .hypotheses
    .find(
      (item) =>
        item.hypothesisId ===
        hypothesisId
    );

const findFamily = (
  report,
  familyId
) =>
  report
    .familyMultipleTesting
    .families
    .find(
      (item) =>
        item.familyId ===
        familyId
    );

const assertEvidenceLevel = ({
  report,
  hypothesisId,
  level,
  label,
}) => {
  const hypothesis =
    findHypothesis(
      report,
      hypothesisId
    );

  assert.ok(
    hypothesis,
    `${hypothesisId}_MISSING`
  );

  assert.strictEqual(
    hypothesis
      .evidence
      .status,
    "EVALUATED"
  );

  assert.strictEqual(
    hypothesis
      .evidence
      .level,
    level
  );

  assert.strictEqual(
    hypothesis
      .evidence
      .label,
    label
  );

  return hypothesis;
};

const assertFamily = ({
  report,
  familyId,
  hypothesisIds,
  developmentTestCount,
  validationTestCount,
}) => {
  const family =
    findFamily(
      report,
      familyId
    );

  assert.ok(
    family,
    `${familyId}_MISSING`
  );

  assert.deepStrictEqual(
    family.hypothesisIds,
    hypothesisIds
  );

  assert.strictEqual(
    family.hypothesisCount,
    hypothesisIds.length
  );

  assert.strictEqual(
    family.developmentTestCount,
    developmentTestCount
  );

  assert.strictEqual(
    family.validationTestCount,
    validationTestCount
  );

  return family;
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

    /*
     * Report / evidence versions.
     */

    assert.strictEqual(
      report.schemaVersion,
      "RESEARCH_REPORT_V1"
    );

    assert.strictEqual(
      report.reportEngineVersion,
      "research-report-v1.5"
    );

    assert.strictEqual(
      report
        .evidence
        .engineVersion,
      "evidence-v1.2"
    );

    assert.strictEqual(
      report
        .evidence
        .policy
        .id,
      "EVIDENCE_POLICY"
    );

    assert.strictEqual(
      report
        .evidence
        .policy
        .version,
      "1.1.0"
    );

    assert.strictEqual(
      report
        .evidence
        .policy
        .checksum,
      CURRENT_POLICY_CHECKSUM
    );

    /*
     * Batch-level canonical state.
     */

    assert.strictEqual(
      report
        .researchBatch
        .status,
      "COMPLETED"
    );

    assert.strictEqual(
      report
        .evidence
        .status,
      "EVALUATED"
    );

    assert.strictEqual(
      report
        .evidence
        .evaluatedHypotheses,
      10
    );

    assert.strictEqual(
      report
        .evidence
        .notEvaluatedHypotheses,
      6
    );

    assert.strictEqual(
      report
        .evidence
        .failedHypotheses,
      0
    );

    /*
     * Research-family multiple testing.
     */

    assert.strictEqual(
      report
        .familyMultipleTesting
        .engineVersion,
      "research-family-multiple-testing-v1.1"
    );

    assert.strictEqual(
      report
        .familyMultipleTesting
        .method,
      "BENJAMINI_HOCHBERG"
    );

    assert.strictEqual(
      report
        .familyMultipleTesting
        .scope,
      "EVALUATED_FACTOR_HORIZON_TESTS_WITHIN_SNAPSHOT_MULTIPLE_TESTING_FAMILY"
    );

    assert.strictEqual(
      report
        .familyMultipleTesting
        .families
        .length,
      4
    );

    assertFamily({
      report,

      familyId:
        "CALENDAR_FUTURE_RV_V1",

      hypothesisIds: [
        "H_CAL_001",
        "H_CAL_002",
        "H_CAL_003",
        "H_CAL_004",
      ],

      developmentTestCount:
        20,

      validationTestCount:
        20,
    });

    assertFamily({
      report,

      familyId:
        "RETURN_STRUCTURE",

      hypothesisIds: [
        "H_RET_001",
      ],

      developmentTestCount:
        5,

      validationTestCount:
        5,
    });

    assertFamily({
      report,

      familyId:
        "VOLATILITY_STRUCTURE",

      hypothesisIds: [
        "H_VOL_002",
        "H_VOL_003",
      ],

      developmentTestCount:
        10,

      validationTestCount:
        10,
    });

    assertFamily({
      report,

      familyId:
        "VOLUME",

      hypothesisIds: [
        "H_VOLM_001",
        "H_VOLM_002",
      ],

      developmentTestCount:
        10,

      validationTestCount:
        10,
    });

    /*
     * Canonical evidence levels.
     */

    const volatilityClustering =
      assertEvidenceLevel({
        report,

        hypothesisId:
          "H_VOL_001",

        level:
          2,

        label:
          "Statistical Candidate",
      });

    const hour =
      assertEvidenceLevel({
        report,

        hypothesisId:
          "H_CAL_001",

        level:
          5,

        label:
          "Robust Candidate",
      });

    assertEvidenceLevel({
      report,

      hypothesisId:
        "H_CAL_002",

      level:
        5,

      label:
        "Robust Candidate",
    });

    const weekend =
      assertEvidenceLevel({
        report,

        hypothesisId:
          "H_CAL_003",

        level:
          5,

        label:
          "Robust Candidate",
      });

    assertEvidenceLevel({
      report,

      hypothesisId:
        "H_CAL_004",

      level:
        4,

      label:
        "OOS Candidate",
    });

    const laggedReturn =
      assertEvidenceLevel({
        report,

        hypothesisId:
          "H_RET_001",

        level:
          1,

        label:
          "Descriptive",
      });

    const currentRv =
      assertEvidenceLevel({
        report,

        hypothesisId:
          "H_VOL_002",

        level:
          4,

        label:
          "OOS Candidate",
      });

    const absoluteReturn =
      assertEvidenceLevel({
        report,

        hypothesisId:
          "H_VOL_003",

        level:
          5,

        label:
          "Robust Candidate",
      });

    const volumeRv =
      assertEvidenceLevel({
        report,

        hypothesisId:
          "H_VOLM_001",

        level:
          5,

        label:
          "Robust Candidate",
      });

    const volumeReturn =
      assertEvidenceLevel({
        report,

        hypothesisId:
          "H_VOLM_002",

        level:
          1,

        label:
          "Descriptive",
      });

    /*
     * Snapshot statistical-family semantics.
     */

    assert.strictEqual(
      hour
        .multipleTestingFamily,
      "CALENDAR_FUTURE_RV_V1"
    );

    assert.strictEqual(
      hour
        .multipleTestingFamilySource,
      "EXPLICIT"
    );

    assert.strictEqual(
      currentRv
        .multipleTestingFamily,
      "VOLATILITY_STRUCTURE"
    );

    assert.strictEqual(
      currentRv
        .multipleTestingFamilySource,
      "RESEARCH_FAMILY_FALLBACK"
    );

    assert.strictEqual(
      absoluteReturn
        .multipleTestingFamily,
      "VOLATILITY_STRUCTURE"
    );

    assert.strictEqual(
      absoluteReturn
        .multipleTestingFamilySource,
      "RESEARCH_FAMILY_FALLBACK"
    );

    assert.strictEqual(
      volumeRv
        .multipleTestingFamily,
      "VOLUME"
    );

    assert.strictEqual(
      volumeRv
        .multipleTestingFamilySource,
      "RESEARCH_FAMILY_FALLBACK"
    );

    assert.strictEqual(
      volumeReturn
        .multipleTestingFamily,
      "VOLUME"
    );

    assert.strictEqual(
      volumeReturn
        .multipleTestingFamilySource,
      "RESEARCH_FAMILY_FALLBACK"
    );

    /*
     * H_VOL_001 has the same semantic
     * research family but must not be
     * included in factor-family BH.
     */

    assert.strictEqual(
      volatilityClustering
        .executor,
      "VOLATILITY_STRUCTURE_RESEARCH"
    );

    assert.deepStrictEqual(
      findFamily(
        report,
        "VOLATILITY_STRUCTURE"
      ).hypothesisIds,
      [
        "H_VOL_002",
        "H_VOL_003",
      ]
    );

    /*
     * Evidence gates after family BH.
     */

    assert.strictEqual(
      hour
        .evidence
        .criteria
        .withinHypothesisAdjustedHorizons,
      4
    );

    assert.strictEqual(
      hour
        .evidence
        .criteria
        .familyAdjustedHorizons,
      4
    );

    assert.strictEqual(
      laggedReturn
        .evidence
        .criteria
        .withinHypothesisAdjustedHorizons,
      0
    );

    assert.strictEqual(
      laggedReturn
        .evidence
        .criteria
        .familyAdjustedHorizons,
      0
    );

    assert.strictEqual(
      currentRv
        .evidence
        .criteria
        .familyAdjustedHorizons,
      5
    );

    assert.strictEqual(
      absoluteReturn
        .evidence
        .criteria
        .familyAdjustedHorizons,
      5
    );

    assert.strictEqual(
      volumeRv
        .evidence
        .criteria
        .familyAdjustedHorizons,
      5
    );

    /*
     * H_VOLM_002:
     *
     * Volume z-score -> future return
     * is now evaluated but no registered
     * horizon survives the statistical
     * gates.
     */

    assert.strictEqual(
      volumeReturn
        .evidence
        .criteria
        .withinHypothesisAdjustedHorizons,
      0
    );

    assert.strictEqual(
      volumeReturn
        .evidence
        .criteria
        .familyAdjustedHorizons,
      0
    );

    assert.strictEqual(
      volumeReturn
        .evidence
        .criteria
        .oosSupportedHorizons,
      0
    );

    assert.strictEqual(
      volumeReturn
        .evidence
        .criteria
        .robustSupportedHorizons,
      0
    );

    /*
     * Robustness preregistration
     * eligibility.
     */

    assert.strictEqual(
      absoluteReturn
        .evidence
        .criteria
        .robustnessEvidenceEligible,
      true
    );

    assert.strictEqual(
      volumeRv
        .evidence
        .criteria
        .robustnessEvidenceEligible,
      true
    );

    assert.strictEqual(
      volumeReturn
        .evidence
        .criteria
        .robustnessEvidenceEligible,
      true
    );

    assert.strictEqual(
      currentRv
        .evidence
        .criteria
        .robustnessEvidenceEligible,
      false
    );

    /*
     * Verify family BH performs the
     * registered family-wide correction.
     */

    const weekend24h =
      weekend
        .evidence
        .horizons
        .find(
          (item) =>
            item.horizon ===
            "24h"
        );

    assert.ok(
      weekend24h
    );

    assert.ok(
      weekend24h
        .developmentFamilyAdjustedPValue >=
      weekend24h
        .developmentWithinAdjustedPValue
    );

    assert.ok(
      weekend24h
        .validationFamilyAdjustedPValue >=
      weekend24h
        .validationWithinAdjustedPValue
    );

    const laggedReturn4h =
      laggedReturn
        .evidence
        .horizons
        .find(
          (item) =>
            item.horizon ===
            "4h"
        );

    assert.ok(
      laggedReturn4h
    );

    assert.ok(
      laggedReturn4h
        .developmentPValue <
      0.05
    );

    assert.ok(
      laggedReturn4h
        .developmentFamilyAdjustedPValue >
      0.05
    );

    /*
     * All H_VOLM_001 horizons survive
     * the complete current VOLUME
     * family gate.
     */

    for (
      const horizon of
      volumeRv
        .evidence
        .horizons
    ) {
      assert.strictEqual(
        horizon
          .developmentFamilyAdjusted,
        true
      );

      assert.strictEqual(
        horizon
          .validationFamilyAdjusted,
        true
      );

      assert.strictEqual(
        horizon
          .oosSupported,
        true
      );

      assert.strictEqual(
        horizon
          .robustSupported,
        true
      );
    }

    /*
     * H_VOLM_002 must remain a negative
     * registered result across all
     * current horizons.
     */

    for (
      const horizon of
      volumeReturn
        .evidence
        .horizons
    ) {
      assert.strictEqual(
        horizon
          .developmentFamilyAdjusted,
        false
      );

      assert.strictEqual(
        horizon
          .validationFamilyAdjusted,
        false
      );

      assert.strictEqual(
        horizon
          .oosSupported,
        false
      );

      assert.strictEqual(
        horizon
          .robustSupported,
        false
      );
    }

    console.log(
      "Final research report regression test passed."
    );

    console.log(
      "\n===== CANONICAL REPORT ====="
    );

    console.log({
      researchBatchId:
        report
          .researchBatch
          .id,

      schemaVersion:
        report.schemaVersion,

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

      evaluatedHypotheses:
        report
          .evidence
          .evaluatedHypotheses,

      notEvaluatedHypotheses:
        report
          .evidence
          .notEvaluatedHypotheses,

      familyMultipleTestingEngine:
        report
          .familyMultipleTesting
          .engineVersion,
    });

    console.log(
      "\n===== FAMILIES ====="
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
      "\n===== EVIDENCE ====="
    );

    console.table(
      report
        .hypotheses
        .map(
          (item) => ({
            Hypothesis:
              item.hypothesisId,

            MultipleTestingFamily:
              item
                .multipleTestingFamily ||
              "",

            EvidenceStatus:
              item
                .evidence
                ?.status ||
              "",

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
  } catch (error) {
    console.error(
      "Final research report regression test failed:",
      error
    );

    process.exitCode =
      1;
  } finally {
    await sequelize.close();
  }
};

run();
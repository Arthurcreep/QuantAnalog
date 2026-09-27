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

const {
  evaluateEconomicEligibility,
} = require(
  "../src/modules/economics/eligibility/evaluateEconomicEligibility"
);

const findEligibility = (
  results,
  hypothesisId
) =>
  results.find(
    (item) =>
      item.hypothesisId ===
      hypothesisId
  );

const assertStatus = ({
  results,
  hypothesisId,
  status,
}) => {
  const result =
    findEligibility(
      results,
      hypothesisId
    );

  assert.ok(
    result,
    `${hypothesisId}_ELIGIBILITY_MISSING`
  );

  assert.strictEqual(
    result.status,
    status
  );

  return result;
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

    const results =
      report
        .hypotheses
        .map(
          (hypothesis) =>
            evaluateEconomicEligibility(
              hypothesis
            )
        );

    /*
     * Diagnostic-only research.
     */

    assertStatus({
      results,

      hypothesisId:
        "H_VOL_001",

      status:
        "NOT_APPLICABLE",
    });

    /*
     * Robust volatility candidates:
     * evidence is sufficient, but there
     * is intentionally no registered
     * trading decision rule yet.
     */

    assertStatus({
      results,

      hypothesisId:
        "H_CAL_001",

      status:
        "DECISION_RULE_REQUIRED",
    });

    assertStatus({
      results,

      hypothesisId:
        "H_CAL_002",

      status:
        "DECISION_RULE_REQUIRED",
    });

    assertStatus({
      results,

      hypothesisId:
        "H_CAL_003",

      status:
        "DECISION_RULE_REQUIRED",
    });

    assertStatus({
      results,

      hypothesisId:
        "H_VOL_003",

      status:
        "DECISION_RULE_REQUIRED",
    });

    const volumeRv =
      assertStatus({
        results,

        hypothesisId:
          "H_VOLM_001",

        status:
          "DECISION_RULE_REQUIRED",
      });

    assert.strictEqual(
      volumeRv
        .economicMode,
      "VOLATILITY_CONDITIONAL"
    );

    assert.strictEqual(
      volumeRv
        .evidenceLevel,
      5
    );

    /*
     * These hypotheses have not reached
     * the minimum evidence level for
     * economic evaluation.
     */

    assertStatus({
      results,

      hypothesisId:
        "H_CAL_004",

      status:
        "INSUFFICIENT_EVIDENCE",
    });

    assertStatus({
      results,

      hypothesisId:
        "H_RET_001",

      status:
        "INSUFFICIENT_EVIDENCE",
    });

    assertStatus({
      results,

      hypothesisId:
        "H_VOL_002",

      status:
        "INSUFFICIENT_EVIDENCE",
    });

    const volumeReturn =
      assertStatus({
        results,

        hypothesisId:
          "H_VOLM_002",

        status:
          "INSUFFICIENT_EVIDENCE",
      });

    assert.strictEqual(
      volumeReturn
        .economicMode,
      "DIRECTIONAL_RETURN"
    );

    assert.strictEqual(
      volumeReturn
        .evidenceLevel,
      1
    );

    /*
     * Planned hypotheses have no
     * evaluated research evidence yet.
     */

    for (
      const hypothesisId of
      [
        "H_FUND_001",
        "H_FUND_002",
        "H_OI_001",
        "H_OI_002",
        "H_CROSS_001",
        "H_EXP_001",
      ]
    ) {
      assertStatus({
        results,

        hypothesisId,

        status:
          "NOT_EVALUATED",
      });
    }

    const eligible =
      results.filter(
        (item) =>
          item.status ===
          "ELIGIBLE"
      );

    assert.strictEqual(
      eligible.length,
      0
    );

    console.log(
      "Economic eligibility test passed."
    );

    console.log(
      "\n===== ECONOMIC ELIGIBILITY ====="
    );

    console.table(
      results.map(
        (item) => ({
          Hypothesis:
            item.hypothesisId,

          Status:
            item.status,

          Mode:
            item.economicMode ||
            "",

          Evidence:
            item.evidenceLevel ??
            "",

          Minimum:
            item.minimumEvidenceLevel ??
            "",

          DecisionRule:
            item.decisionRuleId ||
            "",

          Reason:
            item.reason,
        })
      )
    );

    console.log({
      eligibleHypotheses:
        eligible.length,
    });
  } catch (error) {
    console.error(
      "Economic eligibility test failed:",
      error
    );

    process.exitCode =
      1;
  } finally {
    await sequelize.close();
  }
};

run();
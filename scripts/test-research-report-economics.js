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

const assertEconomicStatus = ({
  report,
  hypothesisId,
  status,
  mode,
  evidenceLevel,
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

  assert.ok(
    hypothesis.economics,
    `${hypothesisId}_ECONOMICS_MISSING`
  );

  assert.strictEqual(
    hypothesis
      .economics
      .eligibility
      .status,
    status
  );

  assert.strictEqual(
    hypothesis
      .economics
      .eligibility
      .economicMode,
    mode
  );

  assert.strictEqual(
    hypothesis
      .economics
      .eligibility
      .evidenceLevel,
    evidenceLevel
  );

  assert.strictEqual(
    hypothesis
      .economics
      .evaluation,
    null
  );

  return hypothesis;
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

    assert.strictEqual(
      report
        .reportEngineVersion,
      "research-report-v1.5"
    );

    assert.ok(
      report.economics,
      "REPORT_ECONOMICS_MISSING"
    );

    assert.strictEqual(
      report
        .economics
        .eligibilityEngineVersion,
      "economic-eligibility-v1.0"
    );

    assert.strictEqual(
      report
        .economics
        .status,
      "ELIGIBILITY_EVALUATED"
    );

    assert.strictEqual(
      report
        .economics
        .evaluatedHypotheses,
      16
    );

    assert.strictEqual(
      report
        .economics
        .eligibleHypotheses,
      0
    );

    assert.deepStrictEqual(
      report
        .economics
        .statusCounts,
      {
        NOT_APPLICABLE:
          1,

        DECISION_RULE_REQUIRED:
          5,

        INSUFFICIENT_EVIDENCE:
          4,

        NOT_EVALUATED:
          6,
      }
    );

    assertEconomicStatus({
      report,

      hypothesisId:
        "H_VOL_001",

      status:
        "NOT_APPLICABLE",

      mode:
        "DIAGNOSTIC_ONLY",

      evidenceLevel:
        2,
    });

    assertEconomicStatus({
      report,

      hypothesisId:
        "H_CAL_001",

      status:
        "DECISION_RULE_REQUIRED",

      mode:
        "VOLATILITY_CONDITIONAL",

      evidenceLevel:
        5,
    });

    assertEconomicStatus({
      report,

      hypothesisId:
        "H_CAL_002",

      status:
        "DECISION_RULE_REQUIRED",

      mode:
        "VOLATILITY_CONDITIONAL",

      evidenceLevel:
        5,
    });

    assertEconomicStatus({
      report,

      hypothesisId:
        "H_CAL_003",

      status:
        "DECISION_RULE_REQUIRED",

      mode:
        "VOLATILITY_CONDITIONAL",

      evidenceLevel:
        5,
    });

    assertEconomicStatus({
      report,

      hypothesisId:
        "H_VOL_003",

      status:
        "DECISION_RULE_REQUIRED",

      mode:
        "VOLATILITY_CONDITIONAL",

      evidenceLevel:
        5,
    });

    const volumeRv =
      assertEconomicStatus({
        report,

        hypothesisId:
          "H_VOLM_001",

        status:
          "DECISION_RULE_REQUIRED",

        mode:
          "VOLATILITY_CONDITIONAL",

        evidenceLevel:
          5,
      });

    assert.strictEqual(
      volumeRv
        .economics
        .eligibility
        .minimumEvidenceLevel,
      5
    );

    assert.strictEqual(
      volumeRv
        .economics
        .eligibility
        .decisionRuleId,
      null
    );

    const volumeReturn =
      assertEconomicStatus({
        report,

        hypothesisId:
          "H_VOLM_002",

        status:
          "INSUFFICIENT_EVIDENCE",

        mode:
          "DIRECTIONAL_RETURN",

        evidenceLevel:
          1,
      });

    assert.strictEqual(
      volumeReturn
        .economics
        .eligibility
        .minimumEvidenceLevel,
      5
    );

    assertEconomicStatus({
      report,

      hypothesisId:
        "H_RET_001",

      status:
        "INSUFFICIENT_EVIDENCE",

      mode:
        "DIRECTIONAL_RETURN",

      evidenceLevel:
        1,
    });

    assertEconomicStatus({
      report,

      hypothesisId:
        "H_CAL_004",

      status:
        "INSUFFICIENT_EVIDENCE",

      mode:
        "VOLATILITY_CONDITIONAL",

      evidenceLevel:
        4,
    });

    assertEconomicStatus({
      report,

      hypothesisId:
        "H_VOL_002",

      status:
        "INSUFFICIENT_EVIDENCE",

      mode:
        "VOLATILITY_CONDITIONAL",

      evidenceLevel:
        4,
    });

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
          .economics
          .eligibility
          .status,
        "NOT_EVALUATED"
      );

      assert.strictEqual(
        hypothesis
          .economics
          .evaluation,
        null
      );
    }

    console.log(
      "Research report economics integration test passed."
    );

    console.log(
      "\n===== REPORT ECONOMICS ====="
    );

    console.log(
      report.economics
    );

    console.log(
      "\n===== HYPOTHESES ====="
    );

    console.table(
      report
        .hypotheses
        .map(
          (item) => ({
            Hypothesis:
              item.hypothesisId,

            Evidence:
              item
                .evidence
                ?.level ??
              "",

            EconomicStatus:
              item
                .economics
                .eligibility
                .status,

            EconomicMode:
              item
                .economics
                .eligibility
                .economicMode ||
              "",

            DecisionRule:
              item
                .economics
                .eligibility
                .decisionRuleId ||
              "",
          })
        )
    );
  } catch (error) {
    console.error(
      "Research report economics integration test failed:",
      error
    );

    process.exitCode =
      1;
  } finally {
    await sequelize.close();
  }
};

run();
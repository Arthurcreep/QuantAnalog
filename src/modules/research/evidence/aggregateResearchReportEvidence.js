const {
  evaluateHypothesisEvidence,
} = require(
  "./evaluateHypothesisEvidence"
);

const aggregateResearchReportEvidence =
  ({
    report,
  }) => {
    if (
      !report ||
      !Array.isArray(
        report.hypotheses
      )
    ) {
      throw new Error(
        "INVALID_RESEARCH_REPORT"
      );
    }

    const hypotheses =
      report.hypotheses.map(
        (hypothesis) => ({
          ...hypothesis,

          evidence:
            evaluateHypothesisEvidence({
              hypothesis,
            }),
        })
      );

    const evaluated =
      hypotheses.filter(
        (item) =>
          item
            .evidence
            ?.status ===
          "EVALUATED"
      );

    const notEvaluated =
      hypotheses.filter(
        (item) =>
          item
            .evidence
            ?.status ===
          "NOT_EVALUATED"
      );

    const failed =
      hypotheses.filter(
        (item) =>
          [
            "EVIDENCE_EVALUATION_FAILED",
            "EVIDENCE_EVALUATOR_NOT_IMPLEMENTED",
          ].includes(
            item
              .evidence
              ?.status
          )
      );

    const levelCounts =
      {};

    for (
      const hypothesis of
      evaluated
    ) {
      const level =
        hypothesis
          .evidence
          .level;

      levelCounts[
        level
      ] =
        (
          levelCounts[
            level
          ] || 0
        ) + 1;
    }

    return {
      ...report,

      hypotheses,

      evidence: {
        status:
          failed.length > 0
            ? "PARTIAL"
            : "EVALUATED",

        evaluatedHypotheses:
          evaluated.length,

        notEvaluatedHypotheses:
          notEvaluated.length,

        failedHypotheses:
          failed.length,

        levelCounts,
      },
    };
  };

module.exports = {
  aggregateResearchReportEvidence,
};
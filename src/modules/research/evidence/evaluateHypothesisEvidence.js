const {
  evaluateCategoricalFactorEvidence,
} = require(
  "./evaluateCategoricalFactorEvidence"
);

const {
  evaluateContinuousFactorEvidence,
} = require(
  "./evaluateContinuousFactorEvidence"
);

const {
  evaluateVolatilityStructureEvidence,
} = require(
  "./evaluateVolatilityStructureEvidence"
);

const evaluateHypothesisEvidence =
  ({
    hypothesis,
  }) => {
    if (
      hypothesis
        .executionStatus !==
      "COMPLETED"
    ) {
      return (
        hypothesis.evidence || {
          status:
            "NOT_EVALUATED",

          reason:
            "RESEARCH_NOT_COMPLETED",
        }
      );
    }

    if (
      hypothesis.hypothesisId ===
      "H_VOL_001"
    ) {
      return evaluateVolatilityStructureEvidence({
        hypothesis,
      });
    }

    if (
      hypothesis.executor ===
      "CATEGORICAL_FACTOR_RESEARCH"
    ) {
      return evaluateCategoricalFactorEvidence({
        hypothesis,
      });
    }

    if (
      hypothesis.executor ===
      "CONTINUOUS_FACTOR_RESEARCH"
    ) {
      return evaluateContinuousFactorEvidence({
        hypothesis,
      });
    }

    return {
      status:
        "EVIDENCE_EVALUATOR_NOT_IMPLEMENTED",

      reason:
        `No evidence evaluator for ${hypothesis.hypothesisId}`,
    };
  };

module.exports = {
  evaluateHypothesisEvidence,
};
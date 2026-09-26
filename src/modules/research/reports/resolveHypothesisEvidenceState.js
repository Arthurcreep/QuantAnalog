const resolveHypothesisEvidenceState =
  ({
    planStatus,
    executionStatus,
    error = null,
  }) => {
    if (
      executionStatus ===
      "COMPLETED"
    ) {
      return {
        status:
          "PENDING_EVIDENCE_AGGREGATION",

        reason:
          null,
      };
    }

    if (
      executionStatus ===
      "FAILED"
    ) {
      return {
        status:
          "EVIDENCE_EVALUATION_FAILED",

        reason:
          error ||
          "RESEARCH_EXECUTION_FAILED",
      };
    }

    if (
      executionStatus ===
      "SKIPPED"
    ) {
      return {
        status:
          "NOT_EVALUATED",

        reason:
          error ||
          "RESEARCH_EXECUTION_SKIPPED",
      };
    }

    if (
      planStatus ===
      "NOT_IMPLEMENTED"
    ) {
      return {
        status:
          "NOT_EVALUATED",

        reason:
          "IMPLEMENTATION_NOT_AVAILABLE",
      };
    }

    if (
      planStatus ===
      "NEED_ACQUISITION"
    ) {
      return {
        status:
          "NOT_EVALUATED",

        reason:
          "DATA_ACQUISITION_REQUIRED",
      };
    }

    if (
      planStatus ===
      "NEED_ACQUISITION_AND_IMPLEMENTATION"
    ) {
      return {
        status:
          "NOT_EVALUATED",

        reason:
          "DATA_AND_IMPLEMENTATION_REQUIRED",
      };
    }

    if (
      planStatus ===
      "UNAVAILABLE"
    ) {
      return {
        status:
          "NOT_EVALUATED",

        reason:
          "REQUIRED_DATA_UNAVAILABLE",
      };
    }

    return {
      status:
        "NOT_EVALUATED",

      reason:
        "RESEARCH_NOT_EXECUTED",
    };
  };

module.exports = {
  resolveHypothesisEvidenceState,
};
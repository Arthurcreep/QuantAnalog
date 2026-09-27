const {
  getEconomicEligibilityConfig,
} = require(
  "./economicEligibilityRegistry"
);

const {
  getDecisionRule,
} = require(
  "../rules/decisionRuleRegistry"
);

const ECONOMIC_ELIGIBILITY_STATUSES =
  Object.freeze({
    NOT_EVALUATED:
      "NOT_EVALUATED",

    NOT_CONFIGURED:
      "NOT_CONFIGURED",

    NOT_APPLICABLE:
      "NOT_APPLICABLE",

    INSUFFICIENT_EVIDENCE:
      "INSUFFICIENT_EVIDENCE",

    DECISION_RULE_REQUIRED:
      "DECISION_RULE_REQUIRED",

    DECISION_RULE_NOT_IMPLEMENTED:
      "DECISION_RULE_NOT_IMPLEMENTED",

    ELIGIBLE:
      "ELIGIBLE",
  });

const buildResult = ({
  hypothesisId,
  status,
  config = null,
  decisionRule = null,
  evidenceLevel = null,
  reason,
}) => ({
  hypothesisId,

  status,

  economicMode:
    config
      ?.economicMode ??
    null,

  minimumEvidenceLevel:
    config
      ?.minimumEvidenceLevel ??
    null,

  evidenceLevel,

  decisionRuleId:
    config
      ?.decisionRuleId ??
    null,

  decisionRuleStatus:
    decisionRule
      ?.status ??
    null,

  reason,
});

const evaluateEconomicEligibility = (
  hypothesisResult
) => {
  if (
    !hypothesisResult ||
    typeof hypothesisResult !==
      "object"
  ) {
    throw new Error(
      "INVALID_HYPOTHESIS_RESULT"
    );
  }

  const hypothesisId =
    hypothesisResult
      .hypothesisId;

  if (
    typeof hypothesisId !==
      "string" ||
    hypothesisId.length ===
      0
  ) {
    throw new Error(
      "HYPOTHESIS_ID_REQUIRED"
    );
  }

  const evidence =
    hypothesisResult
      .evidence;

  if (
    !evidence ||
    evidence.status !==
      "EVALUATED"
  ) {
    return buildResult({
      hypothesisId,

      status:
        ECONOMIC_ELIGIBILITY_STATUSES
          .NOT_EVALUATED,

      reason:
        "RESEARCH_EVIDENCE_NOT_EVALUATED",
    });
  }

  const config =
    getEconomicEligibilityConfig(
      hypothesisId
    );

  if (!config) {
    return buildResult({
      hypothesisId,

      status:
        ECONOMIC_ELIGIBILITY_STATUSES
          .NOT_CONFIGURED,

      evidenceLevel:
        evidence.level ?? null,

      reason:
        "ECONOMIC_ELIGIBILITY_NOT_CONFIGURED",
    });
  }

  if (
    config.economicMode ===
    "DIAGNOSTIC_ONLY"
  ) {
    return buildResult({
      hypothesisId,

      status:
        ECONOMIC_ELIGIBILITY_STATUSES
          .NOT_APPLICABLE,

      config,

      evidenceLevel:
        evidence.level ?? null,

      reason:
        config.reason ||
        "DIAGNOSTIC_HYPOTHESIS_HAS_NO_DIRECT_ECONOMIC_ACTION",
    });
  }

  const evidenceLevel =
    evidence.level;

  if (
    typeof evidenceLevel !==
      "number"
  ) {
    return buildResult({
      hypothesisId,

      status:
        ECONOMIC_ELIGIBILITY_STATUSES
          .INSUFFICIENT_EVIDENCE,

      config,

      evidenceLevel:
        null,

      reason:
        "NUMERIC_EVIDENCE_LEVEL_REQUIRED",
    });
  }

  if (
    evidenceLevel <
    config.minimumEvidenceLevel
  ) {
    return buildResult({
      hypothesisId,

      status:
        ECONOMIC_ELIGIBILITY_STATUSES
          .INSUFFICIENT_EVIDENCE,

      config,

      evidenceLevel,

      reason:
        "MINIMUM_EVIDENCE_LEVEL_NOT_REACHED",
    });
  }

  if (
    !config.decisionRuleId
  ) {
    return buildResult({
      hypothesisId,

      status:
        ECONOMIC_ELIGIBILITY_STATUSES
          .DECISION_RULE_REQUIRED,

      config,

      evidenceLevel,

      reason:
        "REGISTERED_DECISION_RULE_REQUIRED",
    });
  }

  const decisionRule =
    getDecisionRule(
      config.decisionRuleId
    );

  if (
    !decisionRule ||
    decisionRule.status !==
      "IMPLEMENTED"
  ) {
    return buildResult({
      hypothesisId,

      status:
        ECONOMIC_ELIGIBILITY_STATUSES
          .DECISION_RULE_NOT_IMPLEMENTED,

      config,

      decisionRule,

      evidenceLevel,

      reason:
        "REGISTERED_DECISION_RULE_NOT_IMPLEMENTED",
    });
  }

  return buildResult({
    hypothesisId,

    status:
      ECONOMIC_ELIGIBILITY_STATUSES
        .ELIGIBLE,

    config,

    decisionRule,

    evidenceLevel,

    reason:
      "ECONOMIC_EVALUATION_ALLOWED",
  });
};

module.exports = {
  ECONOMIC_ELIGIBILITY_STATUSES,
  evaluateEconomicEligibility,
};
const EVIDENCE_POLICY_V1 =
  Object.freeze({
    id:
      "EVIDENCE_POLICY",

    version:
      "1.0.0",

    statistical: {
      alpha:
        0.05,
    },

    categoricalFactor: {
      minimumProfileCorrelation:
        0.5,

      supportRule:
        "MAJORITY_OF_REGISTERED_HORIZONS",

      requireDevelopmentSignificance:
        true,

      requireMultipleTestingAdjustment:
        true,

      requireRetrospectiveValidation:
        true,

      requireProfileStability:
        true,

      requireBootstrapSupport:
        true,

      forwardValidationRequiredForLevel7:
        true,
    },

    volatilityStructure: {
      supportRule:
        "MAJORITY_OF_REGISTERED_TIMEFRAMES",

      requirePositiveAbsoluteReturnAcf1:
        true,

      requirePositiveSquaredReturnAcf1:
        true,

      minimumSignificantDiagnosticRatio:
        0.5,

      requireLjungBoxSquared:
        true,

      requireArchLm:
        true,

      multipleTestingAdjustment:
        "NOT_IMPLEMENTED",

      maximumEvidenceLevel:
        2,

      maximumEvidenceLevelReason:
        "MULTIPLE_TESTING_ADJUSTMENT_NOT_IMPLEMENTED",
    },

    semantics: {
      retrospectiveValidation:
        "RETROSPECTIVE_HOLDOUT",

      forwardValidation:
        "PROSPECTIVE_FORWARD_OOS",

      economicEvidence:
        "NOT_EVALUATED_FOR_CURRENT_DIAGNOSTIC_HYPOTHESES",
    },
  });

module.exports = {
  EVIDENCE_POLICY_V1,
};
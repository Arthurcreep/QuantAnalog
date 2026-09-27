const {
  buildEvidenceLevel,
} = require(
  "./evidenceLadder"
);

const {
  EVIDENCE_POLICY_V1,
} = require(
  "./policies/evidencePolicyV1"
);

const getRequiredSupportCount = ({
  total,
  rule,
}) => {
  if (
    rule ===
    "MAJORITY_OF_REGISTERED_HORIZONS"
  ) {
    return Math.ceil(
      total / 2
    );
  }

  throw new Error(
    `UNSUPPORTED_CATEGORICAL_SUPPORT_RULE:${rule}`
  );
};

const isSignificant = (
  value
) =>
  typeof value ===
    "number" &&
  Number.isFinite(value) &&
  value <=
    EVIDENCE_POLICY_V1
      .statistical
      .alpha;

const confidenceIntervalExcludesZero =
  ({
    lower,
    upper,
  }) => {
    if (
      typeof lower !==
        "number" ||
      typeof upper !==
        "number"
    ) {
      return false;
    }

    return (
      lower > 0 ||
      upper < 0
    );
  };

const evaluateHorizon = (
  item
) => {
  const policy =
    EVIDENCE_POLICY_V1
      .categoricalFactor;

  const developmentPValue =
    item
      .evaluation
      ?.development
      ?.hac
      ?.pValue;

  const validationPValue =
    item
      .evaluation
      ?.retrospectiveValidation
      ?.hac
      ?.pValue;

  const developmentWithinAdjustedPValue =
    item
      .multipleTesting
      ?.developmentAdjustedPValue;

  const validationWithinAdjustedPValue =
    item
      .multipleTesting
      ?.validationAdjustedPValue;

  const developmentFamilyAdjustedPValue =
    item
      .familyMultipleTesting
      ?.developmentAdjustedPValue;

  const validationFamilyAdjustedPValue =
    item
      .familyMultipleTesting
      ?.validationAdjustedPValue;

  const developmentAdjustedPValue =
    policy
      .requireResearchFamilyAdjustment
      ? developmentFamilyAdjustedPValue
      : developmentWithinAdjustedPValue;

  const validationAdjustedPValue =
    policy
      .requireResearchFamilyAdjustment
      ? validationFamilyAdjustedPValue
      : validationWithinAdjustedPValue;

  const profileCorrelation =
    item
      .evaluation
      ?.stability
      ?.profileCorrelation;

  const relativeDifference =
    item
      .bootstrap
      ?.observed
      ?.relativeDifference;

  const confidenceInterval =
    item
      .bootstrap
      ?.fixedContrast
      ?.relativeDifference;

  const developmentSignificant =
    isSignificant(
      developmentPValue
    );

  const developmentWithinAdjusted =
    isSignificant(
      developmentWithinAdjustedPValue
    );

  const developmentFamilyAdjusted =
    isSignificant(
      developmentFamilyAdjustedPValue
    );

  const developmentAdjusted =
    isSignificant(
      developmentAdjustedPValue
    );

  const validationSignificant =
    isSignificant(
      validationPValue
    );

  const validationWithinAdjusted =
    isSignificant(
      validationWithinAdjustedPValue
    );

  const validationFamilyAdjusted =
    isSignificant(
      validationFamilyAdjustedPValue
    );

  const validationAdjusted =
    isSignificant(
      validationAdjustedPValue
    );

  const stableProfile =
    typeof profileCorrelation ===
      "number" &&
    profileCorrelation >=
      policy
        .minimumProfileCorrelation;

  const bootstrapSupported =
    confidenceIntervalExcludesZero({
      lower:
        confidenceInterval?.lower,

      upper:
        confidenceInterval?.upper,
    });

  const developmentGate =
    policy
      .requireDevelopmentSignificance
      ? developmentSignificant
      : true;

  const multipleTestingGate =
    policy
      .requireMultipleTestingAdjustment
      ? developmentAdjusted
      : developmentGate;

  const retrospectiveValidationGate =
    policy
      .requireRetrospectiveValidation
      ? validationAdjusted
      : true;

  const stabilityGate =
    policy
      .requireProfileStability
      ? stableProfile
      : true;

  const bootstrapGate =
    policy
      .requireBootstrapSupport
      ? bootstrapSupported
      : true;

  const oosSupported =
    multipleTestingGate &&
    retrospectiveValidationGate;

  const robustSupported =
    oosSupported &&
    stabilityGate &&
    bootstrapGate;

  return {
    horizon:
      item.horizon,

    horizonBars:
      item.horizonBars,

    familyId:
      item
        .familyMultipleTesting
        ?.familyId ??
      null,

    developmentPValue,

    developmentWithinAdjustedPValue,

    developmentFamilyAdjustedPValue,

    developmentAdjustedPValue,

    validationPValue,

    validationWithinAdjustedPValue,

    validationFamilyAdjustedPValue,

    validationAdjustedPValue,

    profileCorrelation,

    relativeDifference,

    confidenceInterval:
      confidenceInterval
        ? {
            lower:
              confidenceInterval.lower,

            upper:
              confidenceInterval.upper,
          }
        : null,

    developmentSignificant,

    developmentWithinAdjusted,

    developmentFamilyAdjusted,

    developmentAdjusted,

    validationSignificant,

    validationWithinAdjusted,

    validationFamilyAdjusted,

    validationAdjusted,

    stableProfile,

    bootstrapSupported,

    developmentGate,

    multipleTestingGate,

    retrospectiveValidationGate,

    oosSupported,

    robustSupported,
  };
};

const evaluateCategoricalFactorEvidence =
  ({
    hypothesis,
  }) => {
    const policy =
      EVIDENCE_POLICY_V1
        .categoricalFactor;

    const run =
      hypothesis
        .analysisRuns?.[0];

    if (!run) {
      return {
        status:
          "EVIDENCE_EVALUATION_FAILED",

        reason:
          "CATEGORICAL_ANALYSIS_RUN_MISSING",
      };
    }

    const horizons =
      run
        .metrics
        ?.horizons ||
      [];

    if (
      horizons.length === 0
    ) {
      return {
        status:
          "EVIDENCE_EVALUATION_FAILED",

        reason:
          "CATEGORICAL_HORIZON_RESULTS_MISSING",
      };
    }

    const horizonEvidence =
      horizons.map(
        evaluateHorizon
      );

    const requiredCount =
      getRequiredSupportCount({
        total:
          horizonEvidence.length,

        rule:
          policy.supportRule,
      });

    const developmentSignificantCount =
      horizonEvidence.filter(
        (item) =>
          item
            .developmentGate
      ).length;

    const withinAdjustedCount =
      horizonEvidence.filter(
        (item) =>
          item
            .developmentWithinAdjusted
      ).length;

    const familyAdjustedCount =
      horizonEvidence.filter(
        (item) =>
          item
            .developmentFamilyAdjusted
      ).length;

    const adjustedCount =
      horizonEvidence.filter(
        (item) =>
          item
            .multipleTestingGate
      ).length;

    const oosSupportedCount =
      horizonEvidence.filter(
        (item) =>
          item
            .oosSupported
      ).length;

    const robustSupportedCount =
      horizonEvidence.filter(
        (item) =>
          item
            .robustSupported
      ).length;

    let level = 1;

    if (
      developmentSignificantCount >=
      requiredCount
    ) {
      level = 2;
    }

    if (
      adjustedCount >=
      requiredCount
    ) {
      level = 3;
    }

    if (
      oosSupportedCount >=
      requiredCount
    ) {
      level = 4;
    }

    if (
      robustSupportedCount >=
      requiredCount
    ) {
      level = 5;
    }

    const definition =
      buildEvidenceLevel(
        level
      );

    const forwardOosStatus =
      run
        .metrics
        ?.forwardOos
        ?.status ||
      "UNKNOWN";

    return {
      status:
        "EVALUATED",

      ...definition,

      validationMode:
        EVIDENCE_POLICY_V1
          .semantics
          .retrospectiveValidation,

      forwardOos: {
        status:
          forwardOosStatus,

        validated:
          false,
      },

      criteria: {
        alpha:
          EVIDENCE_POLICY_V1
            .statistical
            .alpha,

        minimumProfileCorrelation:
          policy
            .minimumProfileCorrelation,

        supportRule:
          policy
            .supportRule,

        requireResearchFamilyAdjustment:
          policy
            .requireResearchFamilyAdjustment,

        totalHorizons:
          horizonEvidence.length,

        requiredSupportingHorizons:
          requiredCount,

        developmentSignificantHorizons:
          developmentSignificantCount,

        withinHypothesisAdjustedHorizons:
          withinAdjustedCount,

        familyAdjustedHorizons:
          familyAdjustedCount,

        multipleTestingAdjustedHorizons:
          adjustedCount,

        oosSupportedHorizons:
          oosSupportedCount,

        robustSupportedHorizons:
          robustSupportedCount,
      },

      supportedHorizons:
        horizonEvidence
          .filter(
            (item) =>
              item
                .robustSupported
          )
          .map(
            (item) =>
              item.horizon
          ),

      unsupportedHorizons:
        horizonEvidence
          .filter(
            (item) =>
              !item
                .robustSupported
          )
          .map(
            (item) =>
              item.horizon
          ),

      horizons:
        horizonEvidence,

      notes: [
        "OOS level refers to retrospective holdout validation, not prospective forward validation.",
        "Within-hypothesis BH and research-family BH are reported separately.",
        "Evidence Level 3+ uses research-family adjusted p-values.",
        "Forward OOS remains separate from the current Evidence Ladder result.",
        "Economic significance has not been evaluated for this diagnostic hypothesis.",
      ],
    };
  };

module.exports = {
  evaluateCategoricalFactorEvidence,
};
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
    `UNSUPPORTED_CONTINUOUS_SUPPORT_RULE:${rule}`
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

const getSign = (
  value
) => {
  if (
    typeof value !==
      "number" ||
    !Number.isFinite(value)
  ) {
    return 0;
  }

  if (value > 0) {
    return 1;
  }

  if (value < 0) {
    return -1;
  }

  return 0;
};

const evaluateHorizon = (
  item
) => {
  const policy =
    EVIDENCE_POLICY_V1
      .continuousFactor;

  const development =
    item
      .evaluation
      ?.development
      ?.hac;

  const validation =
    item
      .evaluation
      ?.retrospectiveValidation
      ?.hac;

  const developmentPValue =
    development
      ?.pValue;

  const validationPValue =
    validation
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

  const developmentBeta =
    development
      ?.beta;

  const validationBeta =
    validation
      ?.beta;

  const developmentSign =
    getSign(
      developmentBeta
    );

  const validationSign =
    getSign(
      validationBeta
    );

  const signStable =
    developmentSign !== 0 &&
    developmentSign ===
      validationSign;

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

  const directionGate =
    policy
      .requireDirectionStabilityForOos
      ? signStable
      : true;

  const oosSupported =
    multipleTestingGate &&
    retrospectiveValidationGate &&
    directionGate;

  const bootstrapSupported =
    item
      .robustness
      ?.gates
      ?.bootstrapSupported ===
    true;

  const yearlySupported =
    item
      .robustness
      ?.gates
      ?.yearlySupported ===
    true;

  const robustnessSupported =
    item
      .robustness
      ?.gates
      ?.robustSupported ===
    true;

  const robustSupported =
    oosSupported &&
    (
      policy
        .requireBootstrapSupportForLevel5
        ? bootstrapSupported
        : true
    ) &&
    (
      policy
        .requireYearlyDirectionStabilityForLevel5
        ? yearlySupported
        : true
    ) &&
    robustnessSupported;

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

    developmentBeta,

    validationBeta,

    developmentPValue,

    developmentWithinAdjustedPValue,

    developmentFamilyAdjustedPValue,

    developmentAdjustedPValue,

    validationPValue,

    validationWithinAdjustedPValue,

    validationFamilyAdjustedPValue,

    validationAdjustedPValue,

    developmentSignificant,

    developmentWithinAdjusted,

    developmentFamilyAdjusted,

    developmentAdjusted,

    validationSignificant,

    validationWithinAdjusted,

    validationFamilyAdjusted,

    validationAdjusted,

    developmentSign,

    validationSign,

    signStable,

    developmentGate,

    multipleTestingGate,

    retrospectiveValidationGate,

    directionGate,

    oosSupported,

    bootstrapSupported,

    yearlySupported,

    robustnessSupported,

    robustSupported,

    developmentR2:
      development
        ?.rSquared ??
      null,

    validationR2:
      validation
        ?.rSquared ??
      null,
  };
};

const evaluateContinuousFactorEvidence =
  ({
    hypothesis,
  }) => {
    const policy =
      EVIDENCE_POLICY_V1
        .continuousFactor;

    const run =
      hypothesis
        .analysisRuns?.[0];

    if (!run) {
      return {
        status:
          "EVIDENCE_EVALUATION_FAILED",

        reason:
          "CONTINUOUS_ANALYSIS_RUN_MISSING",
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
          "CONTINUOUS_HORIZON_RESULTS_MISSING",
      };
    }

    const robustnessEvidenceEligible =
      run
        .metrics
        ?.robustnessEvidence
        ?.eligible ===
      true;

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

    const signStableCount =
      horizonEvidence.filter(
        (item) =>
          item
            .signStable
      ).length;

    const bootstrapSupportedCount =
      horizonEvidence.filter(
        (item) =>
          item
            .bootstrapSupported
      ).length;

    const yearlySupportedCount =
      horizonEvidence.filter(
        (item) =>
          item
            .yearlySupported
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
      level >= 4 &&
      robustnessEvidenceEligible &&
      robustSupportedCount >=
        requiredCount
    ) {
      level = 5;
    }

    level =
      Math.min(
        level,
        policy
          .maximumEvidenceLevel
      );

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

    const notes = [
      "OOS level refers to retrospective holdout validation, not prospective forward validation.",
      "Direction must remain consistent between development and retrospective validation.",
      "Within-hypothesis BH and research-family BH are reported separately.",
      "Evidence Level 3+ uses research-family adjusted p-values.",
      "Level 5 requires pre-registered continuous robustness eligibility.",
      "Continuous robustness requires moving-block bootstrap support and yearly direction stability.",
      "Economic significance has not been evaluated.",
    ];

    if (
      !robustnessEvidenceEligible
    ) {
      notes.push(
        "This analysis run was not pre-registered as robustness-evidence eligible, so robustness cannot raise it above Level 4."
      );
    }

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

        signStableHorizons:
          signStableCount,

        bootstrapSupportedHorizons:
          bootstrapSupportedCount,

        yearlySupportedHorizons:
          yearlySupportedCount,

        robustSupportedHorizons:
          robustSupportedCount,

        robustnessEvidenceEligible,

        requireDirectionStabilityForOos:
          policy
            .requireDirectionStabilityForOos,

        requirePreRegisteredRobustnessForLevel5:
          policy
            .requirePreRegisteredRobustnessForLevel5,

        maximumEvidenceLevel:
          policy
            .maximumEvidenceLevel,

        maximumEvidenceLevelReason:
          policy
            .maximumEvidenceLevelReason,
      },

      supportedHorizons:
        horizonEvidence
          .filter(
            (item) =>
              item
                .oosSupported
          )
          .map(
            (item) =>
              item.horizon
          ),

      robustSupportedHorizons:
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
                .oosSupported
          )
          .map(
            (item) =>
              item.horizon
          ),

      horizons:
        horizonEvidence,

      notes,
    };
  };

module.exports = {
  evaluateContinuousFactorEvidence,
};
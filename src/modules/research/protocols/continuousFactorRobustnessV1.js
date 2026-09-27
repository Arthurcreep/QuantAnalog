const CONTINUOUS_FACTOR_ROBUSTNESS_V1 = {
  id:
    "CONTINUOUS_FACTOR_ROBUSTNESS",

  version:
    "1.0.0",

  bootstrap: {
    blockSizeBars:
      168,

    iterations:
      2000,

    seed:
      20261001,

    requireConfidenceIntervalExcludesZero:
      true,
  },

  yearly: {
    minimumSampleSize:
      1000,

    minimumValidYears:
      3,

    minimumDirectionAgreementRatio:
      0.75,

    requireDirectionStability:
      true,
  },

  supportRule:
    "BOOTSTRAP_AND_YEARLY_DIRECTION",

  evidenceUse: {
    existingHypotheses:
      "SUPPLEMENTARY_ONLY",

    futurePreRegisteredHypotheses:
      "ELIGIBLE_FOR_ROBUSTNESS_GATE",
  },
};

module.exports = {
  CONTINUOUS_FACTOR_ROBUSTNESS_V1,
};
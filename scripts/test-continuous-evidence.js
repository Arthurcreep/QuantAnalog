const assert = require(
  "assert"
);

const {
  evaluateHypothesisEvidence,
} = require(
  "../src/modules/research/evidence/evaluateHypothesisEvidence"
);

const buildHorizon = ({
  horizon,
  bars,
  devBeta,
  devP,
  devAdjustedP,
  validationBeta,
  validationP,
  validationAdjustedP,
}) => ({
  horizon,

  horizonBars:
    bars,

  evaluation: {
    development: {
      hac: {
        beta:
          devBeta,

        pValue:
          devP,

        rSquared:
          0.0001,
      },
    },

    retrospectiveValidation: {
      hac: {
        beta:
          validationBeta,

        pValue:
          validationP,

        rSquared:
          0.0001,
      },
    },
  },

  multipleTesting: {
    developmentAdjustedPValue:
      devAdjustedP,

    validationAdjustedPValue:
      validationAdjustedP,
  },
});

const run = () => {
  const hypothesis = {
    hypothesisId:
      "H_RET_001",

    executor:
      "CONTINUOUS_FACTOR_RESEARCH",

    executionStatus:
      "COMPLETED",

    analysisRuns: [
      {
        metrics: {
          horizons: [
            buildHorizon({
              horizon:
                "1h",

              bars:
                1,

              devBeta:
                -0.0059188,

              devP:
                0.461,

              devAdjustedP:
                0.576,

              validationBeta:
                -0.0079631,

              validationP:
                0.566,

              validationAdjustedP:
                0.774,
            }),

            buildHorizon({
              horizon:
                "4h",

              bars:
                4,

              devBeta:
                -0.0353617,

              devP:
                0.0203,

              devAdjustedP:
                0.1017,

              validationBeta:
                -0.0012558,

              validationP:
                0.956,

              validationAdjustedP:
                0.956,
            }),

            buildHorizon({
              horizon:
                "6h",

              bars:
                6,

              devBeta:
                -0.0310819,

              devP:
                0.0707,

              devAdjustedP:
                0.1767,

              validationBeta:
                -0.0136104,

              validationP:
                0.593,

              validationAdjustedP:
                0.774,
            }),

            buildHorizon({
              horizon:
                "12h",

              bars:
                12,

              devBeta:
                0.0069099,

              devP:
                0.769,

              devAdjustedP:
                0.769,

              validationBeta:
                -0.0171481,

              validationP:
                0.619,

              validationAdjustedP:
                0.774,
            }),

            buildHorizon({
              horizon:
                "24h",

              bars:
                24,

              devBeta:
                -0.0294883,

              devP:
                0.360,

              devAdjustedP:
                0.576,

              validationBeta:
                -0.0827287,

              validationP:
                0.0849,

              validationAdjustedP:
                0.4247,
            }),
          ],

          forwardOos: {
            status:
              "PENDING_FUTURE_DATA",
          },
        },
      },
    ],
  };

  hypothesis.analysisRuns[0].config = { protocol: { horizons: hypothesis.analysisRuns[0].metrics.horizons.map((item) => ({ label: item.horizon, bars: item.horizonBars })) } };

  const evidence =
    evaluateHypothesisEvidence({
      hypothesis,
    });

  assert.strictEqual(
    evidence.status,
    "EVALUATED"
  );

  assert.strictEqual(
    evidence.level,
    1
  );

  assert.strictEqual(
    evidence.criteria
      .totalHorizons,
    5
  );

  assert.strictEqual(
    evidence.criteria
      .requiredSupportingHorizons,
    3
  );

  assert.strictEqual(
    evidence.criteria
      .developmentSignificantHorizons,
    1
  );

  assert.strictEqual(
    evidence.criteria
      .multipleTestingAdjustedHorizons,
    0
  );

  assert.strictEqual(
    evidence.criteria
      .oosSupportedHorizons,
    0
  );

  assert.deepStrictEqual(
    evidence
      .supportedHorizons,
    []
  );

  console.log(
    "Continuous evidence test passed."
  );

  console.log({
    level:
      evidence.level,

    label:
      evidence.label,

    requiredSupportingHorizons:
      evidence
        .criteria
        .requiredSupportingHorizons,

    developmentSignificantHorizons:
      evidence
        .criteria
        .developmentSignificantHorizons,

    multipleTestingAdjustedHorizons:
      evidence
        .criteria
        .multipleTestingAdjustedHorizons,

    oosSupportedHorizons:
      evidence
        .criteria
        .oosSupportedHorizons,

    supportedHorizons:
      evidence
        .supportedHorizons,
  });
};

run();
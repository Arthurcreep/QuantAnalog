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
    "MAJORITY_OF_REGISTERED_TIMEFRAMES"
  ) {
    return Math.floor(
      total / 2
    ) + 1;
  }

  throw new Error(
    `UNSUPPORTED_VOLATILITY_SUPPORT_RULE:${rule}`
  );
};

const getPValue = (
  item
) => {
  if (
    typeof item?.pValue ===
    "number"
  ) {
    return item.pValue;
  }

  if (
    typeof item?.p ===
    "number"
  ) {
    return item.p;
  }

  return null;
};

const significantRatio = (
  tests
) => {
  if (
    !Array.isArray(tests) ||
    tests.length === 0
  ) {
    return 0;
  }

  const alpha =
    EVIDENCE_POLICY_V1
      .statistical
      .alpha;

  const valid =
    tests
      .map(
        getPValue
      )
      .filter(
        (value) =>
          typeof value ===
          "number"
      );

  if (
    valid.length === 0
  ) {
    return 0;
  }

  const significant =
    valid.filter(
      (value) =>
        value <= alpha
    ).length;

  return (
    significant /
    valid.length
  );
};

const findAcfLag = (
  values,
  lag
) =>
  values?.find(
    (item) =>
      item.lag === lag
  )?.value ?? null;

const evaluatePeriod = (
  metrics
) => {
    const policy =
      EVIDENCE_POLICY_V1
        .volatilityStructure;

    const absoluteAcf1 =
      findAcfLag(
        metrics
          ?.acf
          ?.absoluteReturns,
        1
      );

    const squaredAcf1 =
      findAcfLag(
        metrics
          ?.acf
          ?.squaredReturns,
        1
      );

    const ljungBoxSquaredRatio =
      significantRatio(
        metrics
          ?.ljungBoxSquaredReturns
      );

    const archLmRatio =
      significantRatio(
        metrics
          ?.archLm
      );

    const absoluteAcfGate =
      policy
        .requirePositiveAbsoluteReturnAcf1
        ? (
            typeof absoluteAcf1 ===
              "number" &&
            absoluteAcf1 > 0
          )
        : true;

    const squaredAcfGate =
      policy
        .requirePositiveSquaredReturnAcf1
        ? (
            typeof squaredAcf1 ===
              "number" &&
            squaredAcf1 > 0
          )
        : true;

    const ljungBoxGate =
      policy
        .requireLjungBoxSquared
        ? (
            ljungBoxSquaredRatio >=
            policy
              .minimumSignificantDiagnosticRatio
          )
        : true;

    const archLmGate =
      policy
        .requireArchLm
        ? (
            archLmRatio >=
            policy
              .minimumSignificantDiagnosticRatio
          )
        : true;

    const descriptiveSupport =
      absoluteAcfGate &&
      squaredAcfGate;

    const statisticalSupport =
      ljungBoxGate &&
      archLmGate;

    return {
      sampleSize:
        metrics?.sampleSize ||
        null,

      absoluteAcf1,

      squaredAcf1,

      ljungBoxSquaredSignificantRatio:
        ljungBoxSquaredRatio,

      archLmSignificantRatio:
        archLmRatio,

      absoluteAcfGate,

      squaredAcfGate,

      ljungBoxGate,

      archLmGate,

      descriptiveSupport,

      statisticalSupport,
    };
  };

const evaluateVolatilityStructureEvidence =
  ({
    hypothesis,
  }) => {
    const policy =
      EVIDENCE_POLICY_V1
        .volatilityStructure;

    const runs =
      hypothesis
        .analysisRuns ||
      [];

    if (
      runs.length === 0
    ) {
      return {
        status:
          "EVIDENCE_EVALUATION_FAILED",

        reason:
          "VOLATILITY_ANALYSIS_RUNS_MISSING",
      };
    }

    const timeframes =
      runs.map(
        (run) => {
          const development =
            evaluatePeriod(
              run
                .metrics
                ?.development
            );

          const validation =
            evaluatePeriod(
              run
                .metrics
                ?.retrospectiveValidation
            );

          return {
            timeframe:
              run.timeframe,

            development,

            retrospectiveValidation:
              validation,

            developmentSupported:
              development
                .statisticalSupport,

            validationSupported:
              validation
                .statisticalSupport,

            persistentSupport:
              development
                .statisticalSupport &&
              validation
                .statisticalSupport,
          };
        }
      );

    const requiredCount =
      getRequiredSupportCount({
        total:
          timeframes.length,

        rule:
          policy.supportRule,
      });

    const descriptiveCount =
      timeframes.filter(
        (item) =>
          item
            .development
            .descriptiveSupport
      ).length;

    const developmentSupportedCount =
      timeframes.filter(
        (item) =>
          item
            .developmentSupported
      ).length;

    const validationSupportedCount =
      timeframes.filter(
        (item) =>
          item
            .validationSupported
      ).length;

    const persistentSupportedCount =
      timeframes.filter(
        (item) =>
          item
            .persistentSupport
      ).length;

    let level = 0;

    if (
      descriptiveCount >=
      requiredCount
    ) {
      level = 1;
    }

    if (
      developmentSupportedCount >=
      requiredCount
    ) {
      level = 2;
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

    const forwardStatuses =
      [
        ...new Set(
          runs.map(
            (run) =>
              run
                .metrics
                ?.forwardOos
                ?.status ||
              "UNKNOWN"
          )
        ),
      ];

    return {
      status:
        "EVALUATED",

      ...definition,

      validationMode:
        EVIDENCE_POLICY_V1
          .semantics
          .retrospectiveValidation,

      forwardOos: {
        statuses:
          forwardStatuses,

        validated:
          false,
      },

      criteria: {
        alpha:
          EVIDENCE_POLICY_V1
            .statistical
            .alpha,

        supportRule:
          policy.supportRule,

        totalTimeframes:
          timeframes.length,

        requiredSupportingTimeframes:
          requiredCount,

        minimumSignificantDiagnosticRatio:
          policy
            .minimumSignificantDiagnosticRatio,

        descriptiveTimeframes:
          descriptiveCount,

        developmentSupportedTimeframes:
          developmentSupportedCount,

        retrospectiveValidationSupportedTimeframes:
          validationSupportedCount,

        persistentSupportedTimeframes:
          persistentSupportedCount,

        multipleTestingAdjustment:
          policy
            .multipleTestingAdjustment,

        levelCap:
          policy
            .maximumEvidenceLevel,

        levelCapReason:
          policy
            .maximumEvidenceLevelReason,
      },

      supportedTimeframes:
        timeframes
          .filter(
            (item) =>
              item
                .persistentSupport
          )
          .map(
            (item) =>
              item.timeframe
          ),

      unsupportedTimeframes:
        timeframes
          .filter(
            (item) =>
              !item
                .persistentSupport
          )
          .map(
            (item) =>
              item.timeframe
          ),

      timeframes,

      notes: [
        "Retrospective validation is evaluated separately from prospective forward OOS.",
        "Cross-timeframe persistence may be present, but Evidence Ladder is capped until multiple-testing adjustment is implemented for this hypothesis family.",
      ],
    };
  };

module.exports = {
  evaluateVolatilityStructureEvidence,
};
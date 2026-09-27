const {
  calculateContinuousHacRegression,
} = require(
  "../calculations/factors/calculateContinuousHacRegression"
);

const validateRows = ({
  rows,
  name,
}) => {
  if (
    !Array.isArray(rows) ||
    rows.length < 3
  ) {
    throw new Error(
      `INSUFFICIENT_CONTINUOUS_FACTOR_SAMPLE: ${name}`
    );
  }
};

const validateFeature = (
  feature
) => {
  if (
    !feature ||
    feature.kind !==
      "CONTINUOUS" ||
    typeof feature.field !==
      "string"
  ) {
    throw new Error(
      "INVALID_CONTINUOUS_FEATURE"
    );
  }
};

const validateTarget = (
  target
) => {
  if (
    !target ||
    typeof target.field !==
      "string"
  ) {
    throw new Error(
      "INVALID_CONTINUOUS_TARGET"
    );
  }
};

const getSign = (
  value
) => {
  if (value > 0) {
    return 1;
  }

  if (value < 0) {
    return -1;
  }

  return 0;
};

const evaluateContinuousFactor =
  ({
    developmentRows,
    validationRows,
    feature,
    target,
    hacLag,
  }) => {
    validateRows({
      rows:
        developmentRows,

      name:
        "DEVELOPMENT",
    });

    validateRows({
      rows:
        validationRows,

      name:
        "RETROSPECTIVE_VALIDATION",
    });

    validateFeature(
      feature
    );

    validateTarget(
      target
    );

    const developmentHac =
      calculateContinuousHacRegression({
        rows:
          developmentRows,

        featureField:
          feature.field,

        targetField:
          target.field,

        hacLag,
      });

    const validationHac =
      calculateContinuousHacRegression({
        rows:
          validationRows,

        featureField:
          feature.field,

        targetField:
          target.field,

        hacLag,
      });

    const developmentSign =
      getSign(
        developmentHac.beta
      );

    const validationSign =
      getSign(
        validationHac.beta
      );

    return {
      feature: {
        name:
          feature.name,

        field:
          feature.field,

        kind:
          feature.kind,
      },

      target: {
        name:
          target.name,

        field:
          target.field,
      },

      development: {
        rowCount:
          developmentRows.length,

        hac:
          developmentHac,
      },

      retrospectiveValidation: {
        rowCount:
          validationRows.length,

        hac:
          validationHac,
      },

      stability: {
        developmentBeta:
          developmentHac.beta,

        validationBeta:
          validationHac.beta,

        developmentSign,

        validationSign,

        signStable:
          developmentSign !== 0 &&
          developmentSign ===
            validationSign,

        absoluteBetaChange:
          Math.abs(
            validationHac.beta -
            developmentHac.beta
          ),

        relativeBetaChange:
          developmentHac.beta !== 0
            ? Math.abs(
                (
                  validationHac.beta -
                  developmentHac.beta
                ) /
                  developmentHac.beta
              )
            : null,
      },
    };
  };

module.exports = {
  evaluateContinuousFactor,
};
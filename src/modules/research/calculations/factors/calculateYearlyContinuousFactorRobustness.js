const {
  calculateContinuousHacRegression,
} = require(
  "./calculateContinuousHacRegression"
);

const getSign = (
  value
) => {
  if (
    !Number.isFinite(value) ||
    value === 0
  ) {
    return 0;
  }

  return value > 0
    ? 1
    : -1;
};

const getYear = (
  timestamp
) => {
  const time =
    Date.parse(
      timestamp
    );

  if (
    !Number.isFinite(time)
  ) {
    throw new Error(
      "INVALID_YEARLY_ROBUSTNESS_TIMESTAMP"
    );
  }

  return new Date(
    time
  ).getUTCFullYear();
};

const calculateYearlyContinuousFactorRobustness =
  ({
    rows,
    featureField,
    targetField,
    referenceBeta,
    hacLag,
    minimumSampleSize = 1000,
    minimumValidYears = 3,
    minimumDirectionAgreementRatio = 0.75,
  }) => {
    if (
      !Array.isArray(rows) ||
      rows.length === 0
    ) {
      throw new Error(
        "INVALID_YEARLY_CONTINUOUS_ROWS"
      );
    }

    if (
      typeof featureField !==
        "string" ||
      typeof targetField !==
        "string"
    ) {
      throw new Error(
        "INVALID_YEARLY_CONTINUOUS_FIELDS"
      );
    }

    if (
      !Number.isFinite(
        referenceBeta
      ) ||
      referenceBeta === 0
    ) {
      throw new Error(
        "INVALID_YEARLY_REFERENCE_BETA"
      );
    }

    if (
      !Number.isInteger(
        hacLag
      ) ||
      hacLag < 0
    ) {
      throw new Error(
        "INVALID_YEARLY_HAC_LAG"
      );
    }

    if (
      !Number.isInteger(
        minimumSampleSize
      ) ||
      minimumSampleSize < 3
    ) {
      throw new Error(
        "INVALID_YEARLY_MINIMUM_SAMPLE"
      );
    }

    if (
      !Number.isInteger(
        minimumValidYears
      ) ||
      minimumValidYears < 1
    ) {
      throw new Error(
        "INVALID_YEARLY_MINIMUM_VALID_YEARS"
      );
    }

    if (
      !Number.isFinite(
        minimumDirectionAgreementRatio
      ) ||
      minimumDirectionAgreementRatio <= 0 ||
      minimumDirectionAgreementRatio > 1
    ) {
      throw new Error(
        "INVALID_YEARLY_DIRECTION_AGREEMENT_RATIO"
      );
    }

    const referenceSign =
      getSign(
        referenceBeta
      );

    const groups =
      new Map();

    let excludedBoundaryRows =
      0;

    for (
      const row of rows
    ) {
      const observationYear =
        getYear(
          row.timestamp
        );

      const featureStartYear =
        getYear(
          row
            .featureStartTimestamp ||
          row.timestamp
        );

      const targetEndYear =
        getYear(
          row
            .targetEndTimestamp ||
          row.timestamp
        );

      if (
        featureStartYear !==
          observationYear ||
        targetEndYear !==
          observationYear
      ) {
        excludedBoundaryRows +=
          1;

        continue;
      }

      if (
        !groups.has(
          observationYear
        )
      ) {
        groups.set(
          observationYear,
          []
        );
      }

      groups
        .get(
          observationYear
        )
        .push(
          row
        );
    }

    const yearly = [];

    for (
      const [
        year,
        yearRows,
      ] of groups
    ) {
      if (
        yearRows.length <
        minimumSampleSize
      ) {
        yearly.push({
          year,

          status:
            "INSUFFICIENT_SAMPLE",

          sampleSize:
            yearRows.length,

          beta:
            null,

          pValue:
            null,

          rSquared:
            null,

          directionAgreement:
            false,
        });

        continue;
      }

      try {
        const regression =
          calculateContinuousHacRegression({
            rows:
              yearRows,

            featureField,

            targetField,

            hacLag,
          });

        const beta =
          regression.beta;

        const directionAgreement =
          getSign(
            beta
          ) ===
          referenceSign;

        yearly.push({
          year,

          status:
            "VALID",

          sampleSize:
            yearRows.length,

          startTimestamp:
            yearRows[0]
              .timestamp,

          endTimestamp:
            yearRows[
              yearRows.length - 1
            ].timestamp,

          beta,

          pValue:
            regression.pValue,

          rSquared:
            regression.rSquared,

          directionAgreement,
        });
      } catch (error) {
        yearly.push({
          year,

          status:
            "REGRESSION_FAILED",

          sampleSize:
            yearRows.length,

          beta:
            null,

          pValue:
            null,

          rSquared:
            null,

          directionAgreement:
            false,

          error:
            error.message,
        });
      }
    }

    yearly.sort(
      (a, b) =>
        a.year -
        b.year
    );

    const validYears =
      yearly.filter(
        (item) =>
          item.status ===
          "VALID"
      );

    const directionAgreementCount =
      validYears.filter(
        (item) =>
          item
            .directionAgreement
      ).length;

    const directionAgreementRatio =
      validYears.length > 0
        ? directionAgreementCount /
          validYears.length
        : 0;

    const enoughValidYears =
      validYears.length >=
      minimumValidYears;

    const directionStable =
      enoughValidYears &&
      directionAgreementRatio >=
        minimumDirectionAgreementRatio;

    const validBetas =
      validYears
        .map(
          (item) =>
            item.beta
        )
        .filter(
          Number.isFinite
        )
        .sort(
          (a, b) =>
            a - b
        );

    const medianBeta =
      validBetas.length > 0
        ? validBetas[
            Math.floor(
              validBetas.length /
              2
            )
          ]
        : null;

    return {
      config: {
        hacLag,

        minimumSampleSize,

        minimumValidYears,

        minimumDirectionAgreementRatio,
      },

      reference: {
        beta:
          referenceBeta,

        sign:
          referenceSign,
      },

      summary: {
        totalYears:
          yearly.length,

        validYears:
          validYears.length,

        excludedBoundaryRows,

        directionAgreementCount,

        directionAgreementRatio,

        enoughValidYears,

        directionStable,

        medianBeta,
      },

      yearly,
    };
  };

module.exports = {
  calculateYearlyContinuousFactorRobustness,
};
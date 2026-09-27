const {
  jStat,
} = require(
  "jstat"
);

const calculateHacMeanTest =
  ({
    values,
    hacLag,
  }) => {
    if (
      !Array.isArray(
        values
      ) ||
      values.length < 2
    ) {
      throw new Error(
        "INSUFFICIENT_HAC_MEAN_SAMPLE"
      );
    }

    if (
      !Number.isInteger(
        hacLag
      ) ||
      hacLag < 0
    ) {
      throw new Error(
        "INVALID_HAC_MEAN_LAG"
      );
    }

    const numeric =
      values.map(
        (value) =>
          Number(
            value
          )
      );

    if (
      numeric.some(
        (value) =>
          !Number.isFinite(
            value
          )
      )
    ) {
      throw new Error(
        "INVALID_HAC_MEAN_VALUE"
      );
    }

    const sampleSize =
      numeric.length;

    const mean =
      numeric.reduce(
        (sum, value) =>
          sum + value,
        0
      ) /
      sampleSize;

    const centered =
      numeric.map(
        (value) =>
          value - mean
      );

    let gammaZero =
      0;

    for (
      const value of
      centered
    ) {
      gammaZero +=
        value ** 2;
    }

    gammaZero /=
      sampleSize;

    const effectiveLag =
      Math.min(
        hacLag,
        sampleSize - 1
      );

    let longRunVariance =
      gammaZero;

    for (
      let lag = 1;
      lag <=
        effectiveLag;
      lag += 1
    ) {
      let covariance =
        0;

      for (
        let index = lag;
        index <
          sampleSize;
        index += 1
      ) {
        covariance +=
          centered[index] *
          centered[
            index - lag
          ];
      }

      covariance /=
        sampleSize;

      const weight =
        1 -
        lag /
          (
            effectiveLag +
            1
          );

      longRunVariance +=
        2 *
        weight *
        covariance;
    }

    longRunVariance =
      Math.max(
        longRunVariance,
        0
      );

    const meanVariance =
      longRunVariance /
      sampleSize;

    const standardError =
      Math.sqrt(
        meanVariance
      );

    const statistic =
      standardError > 0
        ? mean /
          standardError
        : mean === 0
          ? 0
          : mean > 0
            ? Infinity
            : -Infinity;

    const pValueTwoSided =
      Number.isFinite(
        statistic
      )
        ? Math.max(
            0,
            Math.min(
              1,
              2 *
                (
                  1 -
                  jStat
                    .normal
                    .cdf(
                      Math.abs(
                        statistic
                      ),
                      0,
                      1
                    )
                )
            )
          )
        : mean === 0
          ? 1
          : 0;

    const pValueCandidateBetter =
      Number.isFinite(
        statistic
      )
        ? Math.max(
            0,
            Math.min(
              1,
              1 -
              jStat
                .normal
                .cdf(
                  statistic,
                  0,
                  1
                )
            )
          )
        : mean > 0
          ? 0
          : 1;

    return {
      sampleSize,

      hacLag:
        effectiveLag,

      meanDifference:
        mean,

      longRunVariance,

      standardError,

      statistic,

      pValueTwoSided,

      pValueCandidateBetter,

      candidateBetter:
        mean > 0,
    };
  };

module.exports = {
  calculateHacMeanTest,
};
const {
  jStat,
} = require(
  "jstat"
);

const clampProbability = (
  value
) =>
  Math.max(
    0,
    Math.min(
      1,
      value
    )
  );

const calculateMean = (
  values
) =>
  values.reduce(
    (
      sum,
      value
    ) =>
      sum + value,
    0
  ) /
  values.length;

const validateValues = (
  values
) => {
  if (
    !Array.isArray(
      values
    ) ||
    values.length < 3
  ) {
    throw new Error(
      "INSUFFICIENT_HAC_MEAN_SAMPLE"
    );
  }

  for (
    const value of
      values
  ) {
    if (
      !Number.isFinite(
        value
      )
    ) {
      throw new Error(
        "INVALID_HAC_MEAN_VALUE"
      );
    }
  }
};

const calculateHacMeanTest =
  ({
    values,
    hacLag,
  }) => {
    validateValues(
      values
    );

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

    const sampleSize =
      values.length;

    const mean =
      calculateMean(
        values
      );

    const residuals =
      values.map(
        (value) =>
          value -
          mean
      );

    const effectiveLag =
      Math.min(
        hacLag,
        sampleSize - 1
      );

    let longRunVariance =
      residuals.reduce(
        (
          sum,
          residual
        ) =>
          sum +
          residual ** 2,
        0
      ) /
      sampleSize;

    for (
      let lag = 1;
      lag <=
        effectiveLag;
      lag += 1
    ) {
      const weight =
        1 -
        lag /
          (
            effectiveLag +
            1
          );

      let covariance =
        0;

      for (
        let index = lag;
        index <
          sampleSize;
        index += 1
      ) {
        covariance +=
          residuals[index] *
          residuals[
            index - lag
          ];
      }

      covariance /=
        sampleSize;

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

    const standardError =
      Math.sqrt(
        longRunVariance /
        sampleSize
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

    const cdf =
      Number.isFinite(
        statistic
      )
        ? jStat
            .normal
            .cdf(
              statistic,
              0,
              1
            )
        : statistic > 0
          ? 1
          : 0;

    const pValueTwoSided =
      Number.isFinite(
        statistic
      )
        ? clampProbability(
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
        : 0;

    const pValueCandidateBetter =
      clampProbability(
        1 -
        cdf
      );

    const pValueBenchmarkBetter =
      clampProbability(
        cdf
      );

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

      pValueBenchmarkBetter,

      direction:
        mean > 0
          ? "CANDIDATE_LOWER_LOSS"
          : mean < 0
            ? "BENCHMARK_LOWER_LOSS"
            : "EQUAL_MEAN_LOSS",
    };
  };

module.exports = {
  calculateHacMeanTest,
};
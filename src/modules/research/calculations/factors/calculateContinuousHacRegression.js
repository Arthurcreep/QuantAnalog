const {
  jStat,
} = require(
  "jstat"
);

const multiplyMatrices2x2 = ({
  left,
  right,
}) => [
  [
    left[0][0] *
      right[0][0] +
      left[0][1] *
        right[1][0],

    left[0][0] *
      right[0][1] +
      left[0][1] *
        right[1][1],
  ],

  [
    left[1][0] *
      right[0][0] +
      left[1][1] *
        right[1][0],

    left[1][0] *
      right[0][1] +
      left[1][1] *
        right[1][1],
  ],
];

const invertMatrix2x2 = (
  matrix
) => {
  const determinant =
    matrix[0][0] *
      matrix[1][1] -
    matrix[0][1] *
      matrix[1][0];

  if (
    !Number.isFinite(
      determinant
    ) ||
    Math.abs(
      determinant
    ) < 1e-14
  ) {
    throw new Error(
      "SINGULAR_CONTINUOUS_REGRESSION"
    );
  }

  return [
    [
      matrix[1][1] /
        determinant,

      -matrix[0][1] /
        determinant,
    ],

    [
      -matrix[1][0] /
        determinant,

      matrix[0][0] /
        determinant,
    ],
  ];
};

const calculateContinuousHacRegression =
  ({
    rows,
    featureField,
    targetField,
    hacLag,
  }) => {
    if (
      !Array.isArray(rows) ||
      rows.length < 3
    ) {
      throw new Error(
        "INSUFFICIENT_CONTINUOUS_SAMPLE"
      );
    }

    if (
      typeof featureField !==
        "string" ||
      typeof targetField !==
        "string"
    ) {
      throw new Error(
        "INVALID_CONTINUOUS_FIELDS"
      );
    }

    if (
      !Number.isInteger(
        hacLag
      ) ||
      hacLag < 0
    ) {
      throw new Error(
        "INVALID_CONTINUOUS_HAC_LAG"
      );
    }

    const x =
      new Float64Array(
        rows.length
      );

    const y =
      new Float64Array(
        rows.length
      );

    let sumX = 0;
    let sumY = 0;
    let sumXX = 0;
    let sumXY = 0;

    for (
      let index = 0;
      index < rows.length;
      index += 1
    ) {
      const feature =
        Number(
          rows[index][
            featureField
          ]
        );

      const target =
        Number(
          rows[index][
            targetField
          ]
        );

      if (
        !Number.isFinite(
          feature
        ) ||
        !Number.isFinite(
          target
        )
      ) {
        throw new Error(
          "INVALID_CONTINUOUS_ROW"
        );
      }

      x[index] =
        feature;

      y[index] =
        target;

      sumX +=
        feature;

      sumY +=
        target;

      sumXX +=
        feature *
        feature;

      sumXY +=
        feature *
        target;
    }

    const sampleSize =
      rows.length;

    const meanX =
      sumX /
      sampleSize;

    const meanY =
      sumY /
      sampleSize;

    const centeredXX =
      sumXX -
      sampleSize *
        meanX ** 2;

    if (
      !Number.isFinite(
        centeredXX
      ) ||
      centeredXX <= 0
    ) {
      throw new Error(
        "ZERO_CONTINUOUS_FEATURE_VARIANCE"
      );
    }

    const centeredXY =
      sumXY -
      sampleSize *
        meanX *
        meanY;

    const beta =
      centeredXY /
      centeredXX;

    const alpha =
      meanY -
      beta *
        meanX;

    const residuals =
      new Float64Array(
        sampleSize
      );

    let residualSumSquares =
      0;

    let totalSumSquares =
      0;

    for (
      let index = 0;
      index < sampleSize;
      index += 1
    ) {
      const fitted =
        alpha +
        beta *
          x[index];

      const residual =
        y[index] -
        fitted;

      residuals[index] =
        residual;

      residualSumSquares +=
        residual ** 2;

      totalSumSquares +=
        (
          y[index] -
          meanY
        ) ** 2;
    }

    const xtx = [
      [
        sampleSize,
        sumX,
      ],

      [
        sumX,
        sumXX,
      ],
    ];

    const xtxInverse =
      invertMatrix2x2(
        xtx
      );

    const meat = [
      [
        0,
        0,
      ],

      [
        0,
        0,
      ],
    ];

    for (
      let index = 0;
      index < sampleSize;
      index += 1
    ) {
      const residualSquare =
        residuals[index] ** 2;

      meat[0][0] +=
        residualSquare;

      meat[0][1] +=
        residualSquare *
        x[index];

      meat[1][0] +=
        residualSquare *
        x[index];

      meat[1][1] +=
        residualSquare *
        x[index] ** 2;
    }

    const effectiveLag =
      Math.min(
        hacLag,
        sampleSize - 1
      );

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

      for (
        let index = lag;
        index < sampleSize;
        index += 1
      ) {
        const currentResidual =
          residuals[index];

        const laggedResidual =
          residuals[
            index - lag
          ];

        const cross =
          weight *
          currentResidual *
          laggedResidual;

        const currentX =
          x[index];

        const laggedX =
          x[
            index - lag
          ];

        meat[0][0] +=
          2 *
          cross;

        meat[0][1] +=
          cross *
          (
            currentX +
            laggedX
          );

        meat[1][0] +=
          cross *
          (
            currentX +
            laggedX
          );

        meat[1][1] +=
          2 *
          cross *
          currentX *
          laggedX;
      }
    }

    const left =
      multiplyMatrices2x2({
        left:
          xtxInverse,

        right:
          meat,
      });

    const covariance =
      multiplyMatrices2x2({
        left,

        right:
          xtxInverse,
      });

    const alphaVariance =
      Math.max(
        covariance[0][0],
        0
      );

    const betaVariance =
      Math.max(
        covariance[1][1],
        0
      );

    const alphaStdError =
      Math.sqrt(
        alphaVariance
      );

    const betaStdError =
      Math.sqrt(
        betaVariance
      );

    const statistic =
      betaStdError > 0
        ? beta /
          betaStdError
        : beta === 0
          ? 0
          : beta > 0
            ? Infinity
            : -Infinity;

    const pValue =
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
        : beta === 0
          ? 1
          : 0;

    const rSquared =
      totalSumSquares > 0
        ? 1 -
          residualSumSquares /
            totalSumSquares
        : null;

    return {
      sampleSize,

      hacLag:
        effectiveLag,

      alpha,

      beta,

      alphaStdError,

      betaStdError,

      statistic,

      pValue,

      pValueUnderflow:
        pValue === 0,

      rSquared,

      featureMean:
        meanX,

      targetMean:
        meanY,
    };
  };

module.exports = {
  calculateContinuousHacRegression,
};
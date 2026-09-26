const {
  jStat,
} = require("jstat");

const solveLinearSystem = ({
  matrix,
  vector,
}) => {
  const size =
    vector.length;

  const augmented =
    matrix.map(
      (row, index) => [
        ...row,
        vector[index],
      ]
    );

  for (
    let column = 0;
    column < size;
    column += 1
  ) {
    let pivot =
      column;

    for (
      let row = column + 1;
      row < size;
      row += 1
    ) {
      if (
        Math.abs(
          augmented[row][column]
        ) >
        Math.abs(
          augmented[pivot][column]
        )
      ) {
        pivot = row;
      }
    }

    const pivotValue =
      augmented[pivot][column];

    if (
      !Number.isFinite(
        pivotValue
      ) ||
      Math.abs(
        pivotValue
      ) <= Number.EPSILON
    ) {
      throw new Error(
        "SINGULAR_ARCH_LM_MATRIX"
      );
    }

    [
      augmented[column],
      augmented[pivot],
    ] = [
      augmented[pivot],
      augmented[column],
    ];

    const divisor =
      augmented[column][column];

    for (
      let index = column;
      index <= size;
      index += 1
    ) {
      augmented[column][index] /=
        divisor;
    }

    for (
      let row = 0;
      row < size;
      row += 1
    ) {
      if (
        row === column
      ) {
        continue;
      }

      const factor =
        augmented[row][column];

      for (
        let index = column;
        index <= size;
        index += 1
      ) {
        augmented[row][index] -=
          factor *
          augmented[column][index];
      }
    }
  }

  return augmented.map(
    (row) =>
      row[size]
  );
};

const buildPrefixSum = (
  values
) => {
  const prefix =
    new Float64Array(
      values.length + 1
    );

  for (
    let index = 0;
    index < values.length;
    index += 1
  ) {
    prefix[index + 1] =
      prefix[index] +
      values[index];
  }

  return prefix;
};

const getRangeSum = ({
  prefix,
  start,
  end,
}) => {
  if (
    start > end
  ) {
    return 0;
  }

  return (
    prefix[end + 1] -
    prefix[start]
  );
};

const calculateArchLm = ({
  returns,
  lags,
}) => {
  if (
    !Array.isArray(
      returns
    ) ||
    returns.length === 0
  ) {
    throw new Error(
      "EMPTY_RETURN_SERIES"
    );
  }

  if (
    !Number.isInteger(
      lags
    ) ||
    lags <= 0
  ) {
    throw new Error(
      "INVALID_ARCH_LAGS"
    );
  }

  if (
    returns.length <=
    lags + 1
  ) {
    throw new Error(
      "INSUFFICIENT_ARCH_SAMPLE"
    );
  }

  let returnSum = 0;

  for (
    const value of returns
  ) {
    if (
      !Number.isFinite(
        value
      )
    ) {
      throw new Error(
        "INVALID_RETURN_VALUE"
      );
    }

    returnSum +=
      value;
  }

  const returnMean =
    returnSum /
    returns.length;

  const squaredResiduals =
    new Float64Array(
      returns.length
    );

  let squaredResidualSum =
    0;

  for (
    let index = 0;
    index < returns.length;
    index += 1
  ) {
    const residual =
      returns[index] -
      returnMean;

    const squared =
      residual ** 2;

    squaredResiduals[index] =
      squared;

    squaredResidualSum +=
      squared;
  }

  const scale =
    squaredResidualSum /
    squaredResiduals.length;

  if (
    !Number.isFinite(
      scale
    ) ||
    scale <= 0
  ) {
    throw new Error(
      "ZERO_RETURN_VARIANCE"
    );
  }

  /*
   * Масштабируем squared residuals.
   *
   * Это не меняет R² и ARCH-LM statistic,
   * но сильно улучшает численную устойчивость
   * normal equations.
   */
  for (
    let index = 0;
    index <
    squaredResiduals.length;
    index += 1
  ) {
    squaredResiduals[index] /=
      scale;
  }

  const sampleSize =
    squaredResiduals.length -
    lags;

  const parameterCount =
    lags + 1;

  const xtx =
    Array.from(
      {
        length:
          parameterCount,
      },
      () =>
        Array(
          parameterCount
        ).fill(0)
    );

  const xty =
    Array(
      parameterCount
    ).fill(0);

  const prefixSum =
    buildPrefixSum(
      squaredResiduals
    );

  const sumY =
    getRangeSum({
      prefix:
        prefixSum,

      start:
        lags,

      end:
        squaredResiduals.length -
        1,
    });

  xtx[0][0] =
    sampleSize;

  xty[0] =
    sumY;

  /*
   * Intercept × lagged regressors.
   */
  for (
    let lag = 1;
    lag <= lags;
    lag += 1
  ) {
    const sumX =
      getRangeSum({
        prefix:
          prefixSum,

        start:
          lags - lag,

        end:
          squaredResiduals.length -
          1 -
          lag,
      });

    xtx[0][lag] =
      sumX;

    xtx[lag][0] =
      sumX;
  }

  let sumYSquared = 0;

  /*
   * Один reusable prefix buffer.
   *
   * Вместо хранения:
   * N × (lags + 1)
   * regression rows
   *
   * считаем cross-products по lag.
   *
   * Complexity:
   * O(N × lags)
   *
   * Memory:
   * O(N + lags²)
   */
  const crossPrefix =
    new Float64Array(
      squaredResiduals.length +
      1
    );

  for (
    let difference = 0;
    difference <= lags;
    difference += 1
  ) {
    crossPrefix[0] =
      0;

    const lastBaseIndex =
      squaredResiduals.length -
      1 -
      difference;

    for (
      let index = 0;
      index <= lastBaseIndex;
      index += 1
    ) {
      crossPrefix[index + 1] =
        crossPrefix[index] +
        squaredResiduals[index] *
        squaredResiduals[
          index +
          difference
        ];
    }

    if (
      difference === 0
    ) {
      sumYSquared =
        getRangeSum({
          prefix:
            crossPrefix,

          start:
            lags,

          end:
            squaredResiduals.length -
            1,
        });
    }

    if (
      difference >= 1
    ) {
      xty[difference] =
        getRangeSum({
          prefix:
            crossPrefix,

          start:
            lags -
            difference,

          end:
            squaredResiduals.length -
            1 -
            difference,
        });
    }

    if (
      difference >
      lags - 1
    ) {
      continue;
    }

    for (
      let firstLag = 1;
      firstLag <=
      lags - difference;
      firstLag += 1
    ) {
      const secondLag =
        firstLag +
        difference;

      const value =
        getRangeSum({
          prefix:
            crossPrefix,

          start:
            lags -
            secondLag,

          end:
            squaredResiduals.length -
            1 -
            secondLag,
        });

      xtx[firstLag][secondLag] =
        value;

      xtx[secondLag][firstLag] =
        value;
    }
  }

  const beta =
    solveLinearSystem({
      matrix:
        xtx,

      vector:
        xty,
    });

  let explainedCrossProduct =
    0;

  for (
    let index = 0;
    index < beta.length;
    index += 1
  ) {
    explainedCrossProduct +=
      beta[index] *
      xty[index];
  }

  const totalSumSquares =
    sumYSquared -
    (
      sumY ** 2
    ) /
      sampleSize;

  if (
    !Number.isFinite(
      totalSumSquares
    ) ||
    totalSumSquares <= 0
  ) {
    throw new Error(
      "INVALID_ARCH_LM_VARIANCE"
    );
  }

  const residualSumSquares =
    Math.max(
      sumYSquared -
        explainedCrossProduct,
      0
    );

  const rawRSquared =
    1 -
    residualSumSquares /
      totalSumSquares;

  const rSquared =
    Math.max(
      0,
      Math.min(
        1,
        rawRSquared
      )
    );

  const statistic =
    sampleSize *
    rSquared;

  const pValue =
    1 -
    jStat.chisquare.cdf(
      statistic,
      lags
    );

  return {
    sampleSize,
    lags,
    statistic,

    degreesOfFreedom:
      lags,

    rSquared,
    pValue,
  };
};

module.exports = {
  calculateArchLm,
};
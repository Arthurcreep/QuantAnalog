const {
  jStat,
} = require("jstat");

const solveLinearSystem = ({
  matrix,
  vector,
}) => {
  const size =
    vector.length;

  const a =
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
          a[row][column]
        ) >
        Math.abs(
          a[pivot][column]
        )
      ) {
        pivot = row;
      }
    }

    if (
      Math.abs(
        a[pivot][column]
      ) < 1e-14
    ) {
      throw new Error(
        "SINGULAR_HAC_MATRIX"
      );
    }

    [
      a[column],
      a[pivot],
    ] = [
      a[pivot],
      a[column],
    ];

    const divisor =
      a[column][column];

    for (
      let index = column;
      index <= size;
      index += 1
    ) {
      a[column][index] /=
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
        a[row][column];

      for (
        let index = column;
        index <= size;
        index += 1
      ) {
        a[row][index] -=
          factor *
          a[column][index];
      }
    }
  }

  return a.map(
    (row) =>
      row[size]
  );
};

const calculateCategoricalHacTest = ({
  rows,
  categoryField,
  targetField,
  categoryCount = 24,
  hacLag,
}) => {
  if (
    !Array.isArray(rows) ||
    rows.length === 0
  ) {
    throw new Error(
      "EMPTY_HAC_SAMPLE"
    );
  }

  if (
    !Number.isInteger(hacLag) ||
    hacLag < 0
  ) {
    throw new Error(
      "INVALID_HAC_LAG"
    );
  }

  const counts =
    Array(
      categoryCount
    ).fill(0);

  const sums =
    Array(
      categoryCount
    ).fill(0);

  const categories =
    new Int16Array(
      rows.length
    );

  const targets =
    new Float64Array(
      rows.length
    );

  for (
    let index = 0;
    index < rows.length;
    index += 1
  ) {
    const category =
      Number(
        rows[index][
          categoryField
        ]
      );

    const target =
      Number(
        rows[index][
          targetField
        ]
      );

    if (
      !Number.isInteger(
        category
      ) ||
      category < 0 ||
      category >=
        categoryCount ||
      !Number.isFinite(
        target
      )
    ) {
      throw new Error(
        "INVALID_HAC_ROW"
      );
    }

    categories[index] =
      category;

    targets[index] =
      target;

    counts[category] += 1;

    sums[category] +=
      target;
  }

  const means =
    sums.map(
      (sum, category) => {
        if (
          counts[category] ===
          0
        ) {
          throw new Error(
            "EMPTY_HAC_CATEGORY"
          );
        }

        return (
          sum /
          counts[category]
        );
      }
    );

  const residuals =
    new Float64Array(
      rows.length
    );

  for (
    let index = 0;
    index < rows.length;
    index += 1
  ) {
    residuals[index] =
      targets[index] -
      means[
        categories[index]
      ];
  }

  const meat =
    Array.from(
      {
        length:
          categoryCount,
      },
      () =>
        Array(
          categoryCount
        ).fill(0)
    );

  for (
    let index = 0;
    index < rows.length;
    index += 1
  ) {
    const category =
      categories[index];

    meat[category][category] +=
      residuals[index] ** 2;
  }

  for (
    let lag = 1;
    lag <= hacLag;
    lag += 1
  ) {
    const weight =
      1 -
      lag /
        (hacLag + 1);

    for (
      let index = lag;
      index < rows.length;
      index += 1
    ) {
      const currentCategory =
        categories[index];

      const laggedCategory =
        categories[
          index - lag
        ];

      const cross =
        weight *
        residuals[index] *
        residuals[
          index - lag
        ];

      meat[
        currentCategory
      ][
        laggedCategory
      ] += cross;

      meat[
        laggedCategory
      ][
        currentCategory
      ] += cross;
    }
  }

  const covariance =
    Array.from(
      {
        length:
          categoryCount,
      },
      () =>
        Array(
          categoryCount
        ).fill(0)
    );

  for (
    let row = 0;
    row < categoryCount;
    row += 1
  ) {
    for (
      let column = 0;
      column < categoryCount;
      column += 1
    ) {
      covariance[row][column] =
        meat[row][column] /
        (
          counts[row] *
          counts[column]
        );
    }
  }

  const differences =
    means
      .slice(1)
      .map(
        (mean) =>
          mean - means[0]
      );

  const contrastCovariance =
    Array.from(
      {
        length:
          categoryCount - 1,
      },
      () =>
        Array(
          categoryCount - 1
        ).fill(0)
    );

  for (
    let row = 1;
    row < categoryCount;
    row += 1
  ) {
    for (
      let column = 1;
      column < categoryCount;
      column += 1
    ) {
      contrastCovariance[
        row - 1
      ][
        column - 1
      ] =
        covariance[row][column] -
        covariance[row][0] -
        covariance[0][column] +
        covariance[0][0];
    }
  }

  const solved =
    solveLinearSystem({
      matrix:
        contrastCovariance,

      vector:
        differences,
    });

  const statistic =
    differences.reduce(
      (
        sum,
        value,
        index
      ) =>
        sum +
        value *
        solved[index],
      0
    );

  const degreesOfFreedom =
    categoryCount - 1;

  const pValue =
    1 -
    jStat.chisquare.cdf(
      statistic,
      degreesOfFreedom
    );

  return {
    sampleSize:
      rows.length,

    hacLag,

    statistic,

    degreesOfFreedom,

    pValue,

    means,
  };
};

module.exports = {
  calculateCategoricalHacTest,
};
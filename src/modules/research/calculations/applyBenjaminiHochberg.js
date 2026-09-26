const applyBenjaminiHochberg = (
  tests
) => {
  const sorted =
    tests
      .map(
        (test, index) => ({
          ...test,
          originalIndex:
            index,
        })
      )
      .sort(
        (a, b) =>
          a.pValue -
          b.pValue
      );

  let previous =
    1;

  for (
    let index =
      sorted.length - 1;
    index >= 0;
    index -= 1
  ) {
    const rank =
      index + 1;

    const adjusted =
      Math.min(
        previous,
        (
          sorted[index]
            .pValue *
          sorted.length
        ) /
          rank,
        1
      );

    sorted[index]
      .adjustedPValue =
      adjusted;

    previous =
      adjusted;
  }

  return sorted
    .sort(
      (a, b) =>
        a.originalIndex -
        b.originalIndex
    )
    .map(
      ({
        originalIndex,
        ...test
      }) =>
        test
    );
};

module.exports = {
  applyBenjaminiHochberg,
};
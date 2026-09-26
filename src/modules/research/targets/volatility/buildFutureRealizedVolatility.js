const buildFutureRealizedVolatility = ({
  series,
  horizonBars,
  expectedIntervalMs,
}) => {
  if (!Array.isArray(series)) {
    throw new Error(
      "INVALID_RETURN_SERIES"
    );
  }

  if (
    !Number.isInteger(horizonBars) ||
    horizonBars <= 0
  ) {
    throw new Error(
      "INVALID_TARGET_HORIZON"
    );
  }

  if (
    !Number.isFinite(expectedIntervalMs) ||
    expectedIntervalMs <= 0
  ) {
    throw new Error(
      "INVALID_EXPECTED_INTERVAL"
    );
  }

  if (
    series.length <=
    horizonBars
  ) {
    return [];
  }

  const squared =
    new Float64Array(
      series.length
    );

  const gapPrefix =
    new Uint32Array(
      series.length
    );

  for (
    let index = 0;
    index < series.length;
    index += 1
  ) {
    const value =
      Number(
        series[index]
          .logReturn
      );

    if (
      !Number.isFinite(value)
    ) {
      throw new Error(
        "INVALID_RETURN_VALUE"
      );
    }

    squared[index] =
      value ** 2;

    if (index > 0) {
      const previousTime =
        new Date(
          series[
            index - 1
          ].timestamp
        ).getTime();

      const currentTime =
        new Date(
          series[index]
            .timestamp
        ).getTime();

      const hasGap =
        currentTime -
          previousTime !==
        expectedIntervalMs;

      gapPrefix[index] =
        gapPrefix[
          index - 1
        ] +
        Number(hasGap);
    }
  }

  const squarePrefix =
    new Float64Array(
      squared.length + 1
    );

  for (
    let index = 0;
    index < squared.length;
    index += 1
  ) {
    squarePrefix[index + 1] =
      squarePrefix[index] +
      squared[index];
  }

  const targets = [];

  for (
    let index = 0;
    index + horizonBars <
    series.length;
    index += 1
  ) {
    const futureStart =
      index + 1;

    const futureEnd =
      index +
      horizonBars;

    const gapCount =
      gapPrefix[
        futureEnd
      ] -
      gapPrefix[index];

    if (gapCount > 0) {
      continue;
    }

    const realizedVariance =
      squarePrefix[
        futureEnd + 1
      ] -
      squarePrefix[
        futureStart
      ];

    targets.push({
      timestamp:
        series[index]
          .timestamp,

      horizonBars,

      targetStartTimestamp:
        series[
          futureStart
        ].timestamp,

      targetEndTimestamp:
        series[
          futureEnd
        ].timestamp,

      futureRealizedVariance:
        realizedVariance,

      futureRealizedVolatility:
        Math.sqrt(
          Math.max(
            realizedVariance,
            0
          )
        ),
    });
  }

  return targets;
};

module.exports = {
  buildFutureRealizedVolatility,
};
const buildFutureLogReturn = ({
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
    !Number.isInteger(
      horizonBars
    ) ||
    horizonBars <= 0
  ) {
    throw new Error(
      "INVALID_TARGET_HORIZON"
    );
  }

  if (
    !Number.isFinite(
      expectedIntervalMs
    ) ||
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

  const values =
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
      !Number.isFinite(
        value
      )
    ) {
      throw new Error(
        "INVALID_RETURN_VALUE"
      );
    }

    const currentTime =
      new Date(
        series[index]
          .timestamp
      ).getTime();

    if (
      !Number.isFinite(
        currentTime
      )
    ) {
      throw new Error(
        "INVALID_RETURN_TIMESTAMP"
      );
    }

    values[index] =
      value;

    if (index > 0) {
      const previousTime =
        new Date(
          series[
            index - 1
          ].timestamp
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

  const returnPrefix =
    new Float64Array(
      values.length + 1
    );

  for (
    let index = 0;
    index < values.length;
    index += 1
  ) {
    returnPrefix[
      index + 1
    ] =
      returnPrefix[index] +
      values[index];
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

    const futureLogReturn =
      returnPrefix[
        futureEnd + 1
      ] -
      returnPrefix[
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

      futureLogReturn,
    });
  }

  return targets;
};

module.exports = {
  buildFutureLogReturn,
};
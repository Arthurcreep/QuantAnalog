const buildRollingRealizedVolatilityFeature =
  ({
    series,
    windowSizeBars,
    expectedIntervalMs,
  }) => {
    if (!Array.isArray(series)) {
      throw new Error(
        "INVALID_RETURN_SERIES"
      );
    }

    if (
      !Number.isInteger(
        windowSizeBars
      ) ||
      windowSizeBars <= 0
    ) {
      throw new Error(
        "INVALID_VOLATILITY_WINDOW"
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
      series.length <
      windowSizeBars
    ) {
      return [];
    }

    const squared =
      new Float64Array(
        series.length
      );

    const squarePrefix =
      new Float64Array(
        series.length + 1
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

      squared[index] =
        value ** 2;

      squarePrefix[
        index + 1
      ] =
        squarePrefix[index] +
        squared[index];

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

    const features = [];

    for (
      let index =
        windowSizeBars - 1;
      index < series.length;
      index += 1
    ) {
      const windowStart =
        index -
        windowSizeBars +
        1;

      const gapCount =
        gapPrefix[index] -
        gapPrefix[
          windowStart
        ];

      if (gapCount > 0) {
        continue;
      }

      const realizedVariance =
        squarePrefix[
          index + 1
        ] -
        squarePrefix[
          windowStart
        ];

      features.push({
        timestamp:
          series[index]
            .timestamp,

        windowSizeBars,

        featureStartTimestamp:
          series[
            windowStart
          ].timestamp,

        featureEndTimestamp:
          series[index]
            .timestamp,

        realizedVariance,

        realizedVolatility:
          Math.sqrt(
            Math.max(
              realizedVariance,
              0
            )
          ),
      });
    }

    return features;
  };

module.exports = {
  buildRollingRealizedVolatilityFeature,
};
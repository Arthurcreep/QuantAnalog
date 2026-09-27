const parseTime = (
  timestamp
) => {
  const value =
    Date.parse(
      timestamp
    );

  if (
    !Number.isFinite(
      value
    )
  ) {
    throw new Error(
      "INVALID_VOLUME_ZSCORE_TIMESTAMP"
    );
  }

  return value;
};

const buildRollingVolumeZScoreFeature =
  ({
    series,
    windowSizeBars,
    expectedIntervalMs,
  }) => {
    if (
      !Array.isArray(
        series
      )
    ) {
      throw new Error(
        "INVALID_VOLUME_ZSCORE_SERIES"
      );
    }

    if (
      !Number.isInteger(
        windowSizeBars
      ) ||
      windowSizeBars < 2
    ) {
      throw new Error(
        "INVALID_VOLUME_ZSCORE_WINDOW"
      );
    }

    if (
      !Number.isFinite(
        expectedIntervalMs
      ) ||
      expectedIntervalMs <= 0
    ) {
      throw new Error(
        "INVALID_VOLUME_ZSCORE_INTERVAL"
      );
    }

    if (
      series.length <=
      windowSizeBars
    ) {
      return [];
    }

    const transformed =
      new Float64Array(
        series.length
      );

    const timestamps =
      new Float64Array(
        series.length
      );

    const sumPrefix =
      new Float64Array(
        series.length +
        1
      );

    const squaredSumPrefix =
      new Float64Array(
        series.length +
        1
      );

    const gapPrefix =
      new Uint32Array(
        series.length
      );

    for (
      let index = 0;
      index <
      series.length;
      index += 1
    ) {
      const timestamp =
        parseTime(
          series[index]
            .timestamp
        );

      const volume =
        Number(
          series[index]
            .volume
        );

      if (
        !Number.isFinite(
          volume
        ) ||
        volume < 0
      ) {
        throw new Error(
          "INVALID_VOLUME_ZSCORE_VOLUME"
        );
      }

      const value =
        Math.log1p(
          volume
        );

      if (
        !Number.isFinite(
          value
        )
      ) {
        throw new Error(
          "INVALID_VOLUME_ZSCORE_TRANSFORM"
        );
      }

      timestamps[index] =
        timestamp;

      transformed[index] =
        value;

      sumPrefix[
        index + 1
      ] =
        sumPrefix[index] +
        value;

      squaredSumPrefix[
        index + 1
      ] =
        squaredSumPrefix[
          index
        ] +
        value ** 2;

      if (
        index > 0
      ) {
        const hasGap =
          timestamp -
            timestamps[
              index - 1
            ] !==
          expectedIntervalMs;

        gapPrefix[index] =
          gapPrefix[
            index - 1
          ] +
          Number(
            hasGap
          );
      }
    }

    const features = [];

    for (
      let index =
        windowSizeBars;
      index <
      series.length;
      index += 1
    ) {
      const baselineStart =
        index -
        windowSizeBars;

      const gapCount =
        gapPrefix[index] -
        gapPrefix[
          baselineStart
        ];

      if (
        gapCount !== 0
      ) {
        continue;
      }

      const sum =
        sumPrefix[index] -
        sumPrefix[
          baselineStart
        ];

      const squaredSum =
        squaredSumPrefix[
          index
        ] -
        squaredSumPrefix[
          baselineStart
        ];

      const mean =
        sum /
        windowSizeBars;

      const meanSquared =
        squaredSum /
        windowSizeBars;

      const rawVariance =
        meanSquared -
        mean ** 2;

      const variance =
        Math.max(
          rawVariance,
          0
        );

      const standardDeviation =
        Math.sqrt(
          variance
        );

      if (
        !Number.isFinite(
          standardDeviation
        ) ||
        standardDeviation <= 0
      ) {
        continue;
      }

      const volumeZScore =
        (
          transformed[index] -
          mean
        ) /
        standardDeviation;

      if (
        !Number.isFinite(
          volumeZScore
        )
      ) {
        throw new Error(
          "NON_FINITE_VOLUME_ZSCORE"
        );
      }

      features.push({
        timestamp:
          series[index]
            .timestamp,

        volumeZScore,

        featureStartTimestamp:
          series[
            baselineStart
          ].timestamp,

        featureEndTimestamp:
          series[index]
            .timestamp,
      });
    }

    return features;
  };

module.exports = {
  buildRollingVolumeZScoreFeature,
};
const {
  buildFutureLogReturn,
} = require(
  "../targets/returns/buildFutureLogReturn"
);

const buildContinuousFactorTargetMatrix =
  ({
    returnSeries,
    protocol,
    horizonBars,
    expectedIntervalMs,
  }) => {
    const featureName =
      protocol
        .feature
        .name;

    const targetName =
      protocol
        .target
        .name;

    if (
      featureName !==
        "LOG_RETURN" ||
      targetName !==
        "FUTURE_LOG_RETURN"
    ) {
      throw new Error(
        `UNSUPPORTED_CONTINUOUS_FACTOR_TARGET_PAIR: ${featureName} -> ${targetName}`
      );
    }

    const targets =
      buildFutureLogReturn({
        series:
          returnSeries,

        horizonBars,

        expectedIntervalMs,
      });

    const targetByTimestamp =
      new Map(
        targets.map(
          (target) => [
            target.timestamp,
            target,
          ]
        )
      );

    const rows = [];

    for (
      const item of
      returnSeries
    ) {
      const target =
        targetByTimestamp.get(
          item.timestamp
        );

      if (!target) {
        continue;
      }

      rows.push({
        timestamp:
          item.timestamp,

        logReturn:
          item.logReturn,

        horizonBars:
          target.horizonBars,

        targetStartTimestamp:
          target
            .targetStartTimestamp,

        targetEndTimestamp:
          target
            .targetEndTimestamp,

        futureLogReturn:
          target
            .futureLogReturn,
      });
    }

    return rows;
  };

module.exports = {
  buildContinuousFactorTargetMatrix,
};
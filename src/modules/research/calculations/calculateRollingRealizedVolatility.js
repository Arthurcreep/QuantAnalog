const calculateRollingRealizedVolatility =
  ({
    series,
    windowSize,
  }) => {
    if (
      !Array.isArray(series)
    ) {
      return null;
    }

    if (
      !Number.isInteger(
        windowSize
      ) ||
      windowSize <= 0
    ) {
      throw new Error(
        "INVALID_VOLATILITY_WINDOW"
      );
    }

    if (
      series.length <
      windowSize
    ) {
      return [];
    }

    const result = [];

    let sumSquares = 0;

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

      sumSquares +=
        value ** 2;

      if (
        index >= windowSize
      ) {
        const removed =
          Number(
            series[
              index -
              windowSize
            ].logReturn
          );

        sumSquares -=
          removed ** 2;
      }

      if (
        index >=
        windowSize - 1
      ) {
        const variance =
          Math.max(
            sumSquares,
            0
          );

        result.push({
          timestamp:
            series[index]
              .timestamp,

          windowSize,

          realizedVariance:
            variance,

          realizedVolatility:
            Math.sqrt(
              variance
            ),
        });
      }
    }

    return result;
  };

module.exports = {
  calculateRollingRealizedVolatility,
};
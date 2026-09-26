const path = require("path");

const {
  downloadHistoricalCandles,
} = require(
  "../src/adapters/bybit/downloadHistoricalCandles"
);

const ONE_MINUTE_MS =
  60_000;

const SEVEN_DAYS_MS =
  7 *
  24 *
  60 *
  ONE_MINUTE_MS;

const getLastClosedMinute = () =>
  Math.floor(
    Date.now() /
      ONE_MINUTE_MS
  ) * ONE_MINUTE_MS;

const run = async () => {
  try {
    const endTime =
      getLastClosedMinute();

    const startTime =
      endTime -
      SEVEN_DAYS_MS;

    const outputPath =
      path.resolve(
        "storage/temp-bybit",
        "BTCUSDT_LINEAR_1M_7D.csv"
      );

    console.log({
      symbol:
        "BTCUSDT",

      category:
        "linear",

      timeframe:
        "1m",

      start:
        new Date(
          startTime
        ).toISOString(),

      endExclusive:
        new Date(
          endTime
        ).toISOString(),
    });

    const result =
      await downloadHistoricalCandles({
        category:
          "linear",

        symbol:
          "BTCUSDT",

        interval:
          "1",

        startTime,
        endTime,

        outputPath,
      });

    console.dir(
      result,
      {
        depth: null,
      }
    );

    if (
      result.rowCount >
      10_080
    ) {
      throw new Error(
        "Downloaded more candles than expected"
      );
    }

    if (
      result.rowCount === 0
    ) {
      throw new Error(
        "No candles downloaded"
      );
    }

    console.log(
      "Real Bybit BTCUSDT download passed"
    );
  } catch (error) {
    console.error(
      "Real Bybit BTCUSDT download failed:",
      error
    );

    process.exitCode = 1;
  }
};

run();
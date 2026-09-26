const fs = require(
  "fs/promises"
);

const path = require("path");

const {
  fetchBybitKlines,
} = require("./bybitClient");

const ONE_MINUTE_MS =
  60_000;

const sleep = (milliseconds) =>
  new Promise((resolve) =>
    setTimeout(resolve, milliseconds)
  );

const normalizeCandle = (
  candle
) => ({
  timestamp:
    new Date(
      Number(candle[0])
    ).toISOString(),

  open: candle[1],
  high: candle[2],
  low: candle[3],
  close: candle[4],
  volume: candle[5],
});

const candleToCsv = (
  candle
) =>
  [
    candle.timestamp,
    candle.open,
    candle.high,
    candle.low,
    candle.close,
    candle.volume,
  ].join(",");

const downloadHistoricalCandles =
  async ({
    category,
    symbol,
    interval,
    startTime,
    endTime,
    outputPath,
    logBatches = true,
    requestDelayMs = 50,
  }) => {
    if (interval !== "1") {
      throw new Error(
        "DOWNLOAD_CURRENTLY_SUPPORTS_1M_ONLY"
      );
    }

    if (
      !Number.isFinite(startTime) ||
      !Number.isFinite(endTime) ||
      startTime >= endTime
    ) {
      throw new Error(
        "INVALID_DOWNLOAD_RANGE"
      );
    }

    await fs.mkdir(
      path.dirname(outputPath),
      {
        recursive: true,
      }
    );

    await fs.writeFile(
      outputPath,
      "timestamp,open,high,low,close,volume\n"
    );

    const pageSize = 1000;

    const pageDuration =
      pageSize *
      ONE_MINUTE_MS;

    let cursor = startTime;

    let batchCount = 0;
    let rowCount = 0;

    let firstTimestamp = null;
    let lastTimestamp = null;

    while (cursor < endTime) {
      const requestEnd =
        Math.min(
          endTime - 1,
          cursor +
            pageDuration -
            1
        );

      const rawCandles =
        await fetchBybitKlines({
          category,
          symbol,
          interval,
          start: cursor,
          end: requestEnd,
          limit: pageSize,
        });

      const candles =
        rawCandles
          .map(
            normalizeCandle
          )
          .sort(
            (left, right) =>
              Date.parse(
                left.timestamp
              ) -
              Date.parse(
                right.timestamp
              )
          );

      for (
        const candle of candles
      ) {
        const timestamp =
          Date.parse(
            candle.timestamp
          );

        if (
          timestamp < cursor ||
          timestamp >
            requestEnd
        ) {
          throw new Error(
            "BYBIT_CANDLE_OUTSIDE_REQUEST_RANGE"
          );
        }
      }

      if (
        candles.length > 0
      ) {
        await fs.appendFile(
          outputPath,
          `${candles
            .map(
              candleToCsv
            )
            .join("\n")}\n`
        );

        if (!firstTimestamp) {
          firstTimestamp =
            candles[0]
              .timestamp;
        }

        lastTimestamp =
          candles[
            candles.length - 1
          ].timestamp;

        rowCount +=
          candles.length;
      }

      batchCount += 1;

      if (logBatches) {
        console.log({
          batch:
            batchCount,

          requestedFrom:
            new Date(
              cursor
            ).toISOString(),

          requestedTo:
            new Date(
              requestEnd
            ).toISOString(),

          received:
            candles.length,

          totalRows:
            rowCount,
        });
      }

      cursor += pageDuration;

      if (
        requestDelayMs > 0 &&
        cursor < endTime
      ) {
        await sleep(
          requestDelayMs
        );
      }
    }

    return {
      category,
      symbol,
      interval,

      batchCount,
      rowCount,

      firstTimestamp,
      lastTimestamp,

      outputPath:
        path.resolve(
          outputPath
        ),
    };
  };

module.exports = {
  downloadHistoricalCandles,
};
const fs = require(
  "fs/promises"
);

const path = require("path");

const {
  fetchBybitInstrument,
} = require(
  "../../../adapters/bybit/bybitClient"
);

const {
  downloadHistoricalCandles,
} = require(
  "../../../adapters/bybit/downloadHistoricalCandles"
);

const {
  calculateFileChecksum,
} = require(
  "../calculations/calculateFileChecksum"
);

const {
  importRawDataset,
} = require(
  "./importRawDataset.service"
);

const {
  validateDatasetQuality,
} = require(
  "./validateDatasetQuality.service"
);

const {
  findDatasetById,
  findDatasetsByChecksum,
} = require(
  "../repositories/dataset.repository"
);

const ONE_MINUTE_MS =
  60_000;

const ONE_DAY_MS =
  24 *
  60 *
  ONE_MINUTE_MS;

const DEFAULT_CHUNK_DAYS =
  30;

const QUALITY_POLICY = {
  maxInvalidRows: 0,

  maxInvalidTimestampCount: 0,

  maxOutOfOrderCount: 0,

  maxMissingIntervalRatio: 0,

  maxDuplicateRatio: 0,

  maxIncompleteBucketRatio: 0,
};

const floorToMinute = (
  timestamp
) =>
  Math.floor(
    timestamp /
      ONE_MINUTE_MS
  ) *
  ONE_MINUTE_MS;

const formatChunkTime = (
  timestamp
) =>
  new Date(timestamp)
    .toISOString()
    .replace(
      /[-:]/g,
      ""
    )
    .replace(
      ".000Z",
      "Z"
    );

const readJson = async (
  filePath
) => {
  try {
    const content =
      await fs.readFile(
        filePath,
        "utf8"
      );

    return JSON.parse(
      content
    );
  } catch {
    return null;
  }
};

const writeJsonAtomic = async (
  filePath,
  value
) => {
  const tempPath =
    `${filePath}.tmp`;

  await fs.writeFile(
    tempPath,
    JSON.stringify(
      value,
      null,
      2
    )
  );

  await fs.rename(
    tempPath,
    filePath
  );
};

const findExistingDataset =
  async ({
    checksum,
    symbol,
    firstTimestamp,
    lastTimestamp,
    rowCount,
  }) => {
    const datasets =
      await findDatasetsByChecksum(
        checksum
      );

    return (
      datasets.find(
        (dataset) =>
          dataset.stage ===
            "RAW" &&
          dataset.datasetType ===
            "CANDLES" &&
          dataset.venue ===
            "BYBIT" &&
          dataset.instrument ===
            symbol &&
          dataset.marketType ===
            "LINEAR" &&
          dataset.sourceTimeframe ===
            "1m" &&
          Number(
            dataset.rowCount
          ) === rowCount &&
          new Date(
            dataset.startTime
          ).getTime() ===
            Date.parse(
              firstTimestamp
            ) &&
          new Date(
            dataset.endTime
          ).getTime() ===
            Date.parse(
              lastTimestamp
            )
      ) || null
    );
  };

const loadCompletedChunk =
  async ({
    markerPath,
    chunkStart,
    chunkEnd,
  }) => {
    const marker =
      await readJson(
        markerPath
      );

    if (!marker) {
      return null;
    }

    if (
      marker.chunkStart !==
        chunkStart ||
      marker.chunkEndExclusive !==
        chunkEnd
    ) {
      return null;
    }

    const dataset =
      await findDatasetById(
        marker.datasetId
      );

    if (
      !dataset ||
      dataset.checksum !==
        marker.checksum
    ) {
      return null;
    }

    try {
      const checksum =
        await calculateFileChecksum(
          dataset.storageUri
        );

      if (
        checksum !==
        marker.checksum
      ) {
        return null;
      }
    } catch {
      return null;
    }

    return marker;
  };

const backfillBybitCandles =
  async ({
    category = "linear",

    symbol,

    interval = "1",

    startTime = null,

    endTime = null,

    chunkDays =
      DEFAULT_CHUNK_DAYS,
  }) => {
    if (!symbol) {
      throw new Error(
        "SYMBOL_REQUIRED"
      );
    }

    if (interval !== "1") {
      throw new Error(
        "BACKFILL_CURRENTLY_SUPPORTS_1M_ONLY"
      );
    }

    const instrument =
      await fetchBybitInstrument({
        category,
        symbol,
      });

    const launchTime =
      floorToMinute(
        instrument.launchTime
      );

    const rangeStart =
      floorToMinute(
        startTime ??
          launchTime
      );

    const rangeEnd =
      floorToMinute(
        endTime ??
          Date.now()
      );

    if (
      rangeStart >= rangeEnd
    ) {
      throw new Error(
        "INVALID_BACKFILL_RANGE"
      );
    }

    const chunkDuration =
      chunkDays *
      ONE_DAY_MS;

    const stateDirectory =
      path.resolve(
        "storage/backfill-state",
        "bybit",
        symbol,
        category,
        "1m"
      );

    const tempDirectory =
      path.resolve(
        "storage/temp-bybit-backfill"
      );

    await fs.mkdir(
      stateDirectory,
      {
        recursive: true,
      }
    );

    await fs.mkdir(
      tempDirectory,
      {
        recursive: true,
      }
    );

    console.log({
      symbol,
      category,

      launchTime:
        new Date(
          launchTime
        ).toISOString(),

      rangeStart:
        new Date(
          rangeStart
        ).toISOString(),

      rangeEndExclusive:
        new Date(
          rangeEnd
        ).toISOString(),

      chunkDays,
    });

    const chunks = [];

    let cursor =
      rangeStart;

    while (
      cursor < rangeEnd
    ) {
      const chunkStart =
        cursor;

      const chunkEnd =
        Math.min(
          rangeEnd,
          chunkStart +
            chunkDuration
        );

      const chunkId =
        `${formatChunkTime(
          chunkStart
        )}__${formatChunkTime(
          chunkEnd
        )}`;

      const markerPath =
        path.join(
          stateDirectory,
          `${chunkId}.json`
        );

      const completed =
        await loadCompletedChunk({
          markerPath,
          chunkStart,
          chunkEnd,
        });

      if (completed) {
        console.log(
          `[SKIP] ${chunkId} rows=${completed.rowCount} quality=${completed.qualityStatus}`
        );

        chunks.push(
          completed
        );

        cursor =
          chunkEnd;

        continue;
      }

      const tempPath =
        path.join(
          tempDirectory,
          `${symbol}_${chunkId}.csv`
        );

      try {
        console.log(
          `[DOWNLOAD] ${chunkId}`
        );

        const downloaded =
          await downloadHistoricalCandles({
            category,
            symbol,
            interval,

            startTime:
              chunkStart,

            endTime:
              chunkEnd,

            outputPath:
              tempPath,

            logBatches: false,
          });

        if (
          downloaded.rowCount ===
            0 ||
          !downloaded.firstTimestamp ||
          !downloaded.lastTimestamp
        ) {
          throw new Error(
            `EMPTY_BYBIT_CHUNK_${chunkId}`
          );
        }

        const checksum =
          await calculateFileChecksum(
            tempPath
          );

        let dataset =
          await findExistingDataset({
            checksum,
            symbol,

            firstTimestamp:
              downloaded
                .firstTimestamp,

            lastTimestamp:
              downloaded
                .lastTimestamp,

            rowCount:
              downloaded.rowCount,
          });

        if (!dataset) {
          const imported =
            await importRawDataset({
              sourcePath:
                tempPath,

              originalFilename:
                `${symbol}_${chunkId}.csv`,

              datasetMetadata: {
                name:
                  `${symbol}_BYBIT_LINEAR_1M_RAW_${chunkId}`,

                datasetType:
                  "CANDLES",

                version: 1,

                venue:
                  "BYBIT",

                instrument:
                  symbol,

                marketType:
                  "LINEAR",

                sourceTimeframe:
                  "1m",

                timezone:
                  "UTC",

                startTime:
                  downloaded
                    .firstTimestamp,

                endTime:
                  downloaded
                    .lastTimestamp,

                rowCount:
                  downloaded
                    .rowCount,
              },
            });

          dataset =
            imported.dataset;
        }

        const quality =
          await validateDatasetQuality({
            datasetId:
              dataset.id,

            policy:
              QUALITY_POLICY,
          });

        const expectedRowCount =
          Math.floor(
            (
              chunkEnd -
              chunkStart
            ) /
              ONE_MINUTE_MS
          );

        const marker = {
          chunkId,

          chunkStart,
          chunkEndExclusive:
            chunkEnd,

          requestedStart:
            new Date(
              chunkStart
            ).toISOString(),

          requestedEndExclusive:
            new Date(
              chunkEnd
            ).toISOString(),

          datasetId:
            dataset.id,

          checksum:
            dataset.checksum,

          storageUri:
            dataset.storageUri,

          rowCount:
            downloaded.rowCount,

          expectedRowCount,

          rangeCoverage:
            expectedRowCount > 0
              ? downloaded
                  .rowCount /
                expectedRowCount
              : null,

          firstTimestamp:
            downloaded
              .firstTimestamp,

          lastTimestamp:
            downloaded
              .lastTimestamp,

          qualityStatus:
            quality.qualityStatus,

          coverage:
            quality.report
              .coverage,

          invalidRows:
            quality.report
              .invalidRows,

          duplicateCount:
            quality.report
              .duplicateCount,

          gapCount:
            quality.report
              .gapCount,

          missingIntervalCount:
            quality.report
              .missingIntervalCount,

          createdAt:
            new Date()
              .toISOString(),
        };

        await writeJsonAtomic(
          markerPath,
          marker
        );

        chunks.push(marker);

        console.log(
          `[DONE] ${chunkId} rows=${marker.rowCount}/${marker.expectedRowCount} quality=${marker.qualityStatus}`
        );
      } finally {
        await fs.rm(
          tempPath,
          {
            force: true,
          }
        );
      }

      cursor =
        chunkEnd;
    }

    const summary = {
      symbol,
      category,
      interval,

      launchTime:
        new Date(
          launchTime
        ).toISOString(),

      startTime:
        new Date(
          rangeStart
        ).toISOString(),

      endTimeExclusive:
        new Date(
          rangeEnd
        ).toISOString(),

      chunkCount:
        chunks.length,

      totalRows:
        chunks.reduce(
          (
            total,
            chunk
          ) =>
            total +
            chunk.rowCount,
          0
        ),

      expectedRows:
        chunks.reduce(
          (
            total,
            chunk
          ) =>
            total +
            chunk.expectedRowCount,
          0
        ),

      passChunks:
        chunks.filter(
          (chunk) =>
            chunk.qualityStatus ===
            "PASS"
        ).length,

      warningChunks:
        chunks.filter(
          (chunk) =>
            chunk.qualityStatus ===
            "ACCEPTABLE_WITH_WARNINGS"
        ).length,

      blockedChunks:
        chunks.filter(
          (chunk) =>
            chunk.qualityStatus ===
            "BLOCKED"
        ).length,

      datasetIds:
        chunks.map(
          (chunk) =>
            chunk.datasetId
        ),
    };

    const manifestPath =
      path.join(
        stateDirectory,
        "manifest.json"
      );

    await writeJsonAtomic(
      manifestPath,
      summary
    );

    return {
      ...summary,
      manifestPath,
    };
  };

module.exports = {
  backfillBybitCandles,
};
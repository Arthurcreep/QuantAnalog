const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const readline = require("readline");
const { once } = require("events");

const sequelize = require(
  "../src/config/database"
);

const {
  findDatasetById,
} = require(
  "../src/modules/datasets/repositories/dataset.repository"
);

const {
  calculateFileChecksum,
} = require(
  "../src/modules/datasets/calculations/calculateFileChecksum"
);

const {
  validateCandleDataset,
} = require(
  "../src/modules/datasets/validation/validateCandleDataset"
);

const MANIFEST_PATH =
  path.resolve(
    "storage/backfill-state",
    "bybit",
    "BTCUSDT",
    "linear",
    "1m",
    "clean-manifest.json"
  );

const OUTPUT_PATH =
  path.resolve(
    "storage/temp-canonical",
    "BTCUSDT_BYBIT_LINEAR_1M_CANONICAL_CANDIDATE.csv"
  );

const ONE_MINUTE_MS = 60_000;

const writeLine = async (
  stream,
  line
) => {
  if (
    !stream.write(
      `${line}\n`
    )
  ) {
    await once(
      stream,
      "drain"
    );
  }
};

const appendDataset = async ({
  filePath,
  output,
  writeHeader,
  expectedHeader,
}) => {
  const input =
    fs.createReadStream(
      filePath
    );

  const reader =
    readline.createInterface({
      input,
      crlfDelay: Infinity,
    });

  let lineNumber = 0;
  let rowCount = 0;

  for await (
    const line of reader
  ) {
    if (
      lineNumber === 0
    ) {
      if (
        expectedHeader &&
        line !== expectedHeader
      ) {
        throw new Error(
          `CSV_HEADER_MISMATCH_${filePath}`
        );
      }

      if (writeHeader) {
        await writeLine(
          output,
          line
        );
      }

      lineNumber += 1;
      continue;
    }

    if (!line.trim()) {
      continue;
    }

    await writeLine(
      output,
      line
    );

    rowCount += 1;
  }

  return rowCount;
};

const run = async () => {
  let output = null;

  try {
    await sequelize.authenticate();

    const manifest =
      JSON.parse(
        await fsp.readFile(
          MANIFEST_PATH,
          "utf8"
        )
      );

    if (
      !Array.isArray(
        manifest.completed
      ) ||
      manifest.completed.length === 0
    ) {
      throw new Error(
        "CLEAN_MANIFEST_EMPTY"
      );
    }

    const datasets = [];

    for (
      const item of
      manifest.completed
    ) {
      const dataset =
        await findDatasetById(
          item.cleanDatasetId
        );

      if (!dataset) {
        throw new Error(
          `CLEAN_DATASET_NOT_FOUND_${item.cleanDatasetId}`
        );
      }

      if (
        dataset.stage !==
        "CLEAN"
      ) {
        throw new Error(
          `INVALID_STAGE_${dataset.id}`
        );
      }

      datasets.push(
        dataset
      );
    }

    datasets.sort(
      (left, right) =>
        new Date(
          left.startTime
        ).getTime() -
        new Date(
          right.startTime
        ).getTime()
    );

    for (
      let index = 1;
      index < datasets.length;
      index += 1
    ) {
      const previous =
        datasets[index - 1];

      const current =
        datasets[index];

      const expectedStart =
        new Date(
          previous.endTime
        ).getTime() +
        ONE_MINUTE_MS;

      const actualStart =
        new Date(
          current.startTime
        ).getTime();

      if (
        actualStart !==
        expectedStart
      ) {
        throw new Error(
          `INVALID_BOUNDARY_${previous.id}_${current.id}`
        );
      }
    }

    await fsp.mkdir(
      path.dirname(
        OUTPUT_PATH
      ),
      {
        recursive: true,
      }
    );

    output =
      fs.createWriteStream(
        OUTPUT_PATH,
        {
          flags: "w",
        }
      );

    const expectedHeader =
      "timestamp,open,high,low,close,volume";

    let writtenRows = 0;

    for (
      let index = 0;
      index < datasets.length;
      index += 1
    ) {
      const dataset =
        datasets[index];

      const rows =
        await appendDataset({
          filePath:
            dataset.storageUri,

          output,

          writeHeader:
            index === 0,

          expectedHeader,
        });

      writtenRows += rows;

      console.log(
        `[STITCH ${index + 1}/${datasets.length}] rows=${rows} total=${writtenRows}`
      );
    }

    output.end();

    await once(
      output,
      "finish"
    );

    output = null;

    const expectedRows =
      datasets.reduce(
        (sum, dataset) =>
          sum +
          Number(
            dataset.rowCount
          ),
        0
      );

    if (
      writtenRows !==
      expectedRows
    ) {
      throw new Error(
        `ROW_COUNT_MISMATCH_${writtenRows}_${expectedRows}`
      );
    }

    console.log(
      "Running full post-merge validation..."
    );

    const validation =
      await validateCandleDataset({
        filePath:
          OUTPUT_PATH,

        sourceTimeframe:
          "1m",
      });

    const checksum =
      await calculateFileChecksum(
        OUTPUT_PATH
      );

    const result = {
      sourceDatasetCount:
        datasets.length,

      rowCount:
        writtenRows,

      firstTimestamp:
        validation.timestamps
          .firstTimestamp,

      lastTimestamp:
        validation.timestamps
          .lastTimestamp,

      schemaValid:
        validation.schema.valid,

      timestampsValid:
        validation.timestamps.valid,

      domainValid:
        validation.domain.valid,

      duplicateCount:
        validation.intervals
          .duplicateCount,

      gapCount:
        validation.intervals
          .gapCount,

      missingIntervalCount:
        validation.intervals
          .missingIntervalCount,

      invalidRows:
        validation.domain
          .invalidCount,

      zeroVolumeCount:
        validation.domain
          .zeroVolumeCount,

      checksum,

      outputPath:
        OUTPUT_PATH,
    };

    console.dir(
      result,
      {
        depth: null,
      }
    );

    if (
      !result.schemaValid ||
      !result.timestampsValid ||
      !result.domainValid ||
      result.duplicateCount !== 0 ||
      result.gapCount !== 0 ||
      result.missingIntervalCount !== 0 ||
      result.invalidRows !== 0
    ) {
      throw new Error(
        "CANONICAL_CANDIDATE_VALIDATION_FAILED"
      );
    }

    console.log(
      "BTCUSDT CANONICAL candidate passed"
    );
  } catch (error) {
    if (output) {
      output.destroy();
    }

    console.error(
      "CANONICAL candidate failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();
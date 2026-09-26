const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const {
  findDatasetById,
} = require(
  "../repositories/dataset.repository"
);

const {
  validateTimeframeConversion,
} = require(
  "../timeframes/validateTimeframeConversion"
);

const {
  aggregateCandleTimeframe,
} = require(
  "../timeframes/aggregateCandleTimeframe"
);

const {
  calculateFileChecksum,
} = require(
  "../calculations/calculateFileChecksum"
);

const {
  storePreparedFile,
} = require(
  "../storage/preparedStorage"
);

const {
  persistPreparedDataset,
} = require(
  "./persistPreparedDataset"
);

const {
  createAppError,
} = require(
  "../../../errors/appError"
);

const validateSource = (source) => {
  if (source.stage !== "CANONICAL") {
    throw createAppError({
      statusCode: 400,
      code: "INVALID_PREPARED_SOURCE",
      message:
        "Prepared datasets must be built from CANONICAL datasets",
    });
  }

  if (source.datasetType !== "CANDLES") {
    throw createAppError({
      statusCode: 400,
      code: "UNSUPPORTED_DATASET_TYPE",
      message:
        "Timeframe builder supports CANDLES only",
    });
  }

  if (
    ![
      "PASS",
      "ACCEPTABLE_WITH_WARNINGS",
    ].includes(source.qualityStatus)
  ) {
    throw createAppError({
      statusCode: 400,
      code: "SOURCE_QUALITY_NOT_APPROVED",
      message:
        "CANONICAL dataset must pass quality validation first",
    });
  }
};

const getBucketTimestamp = (
  value,
  targetMs
) => {
  const timestamp =
    new Date(value).getTime();

  return new Date(
    Math.floor(
      timestamp / targetMs
    ) * targetMs
  ).toISOString();
};

const buildPreparedDataset = async ({
  datasetId,
  targetTimeframe,
}) => {
  const source =
    await findDatasetById(datasetId);

  if (!source) {
    throw createAppError({
      statusCode: 404,
      code: "DATASET_NOT_FOUND",
      message:
        `Dataset ${datasetId} not found`,
    });
  }

  validateSource(source);

  const conversion =
    validateTimeframeConversion({
      sourceTimeframe:
        source.sourceTimeframe,

      targetTimeframe,
    });

  const tempPath = path.resolve(
    "storage/temp-prepared",
    `${crypto.randomUUID()}.csv`
  );

  await fs.mkdir(
    path.dirname(tempPath),
    {
      recursive: true,
    }
  );

  try {
    const aggregation =
      await aggregateCandleTimeframe({
        inputPath:
          source.storageUri,

        outputPath:
          tempPath,

        sourceTimeframe:
          source.sourceTimeframe,

        targetTimeframe,
      });

    const checksum =
      await calculateFileChecksum(
        tempPath
      );

    const stored =
      await storePreparedFile({
        sourcePath: tempPath,
        checksum,
      });

    return persistPreparedDataset({
      source,
      targetTimeframe,

      checksum,
      storageUri:
        stored.path,

      aggregation,

      startTime:
        getBucketTimestamp(
          source.startTime,
          conversion.targetMs
        ),

      endTime:
        getBucketTimestamp(
          source.endTime,
          conversion.targetMs
        ),
    });
  } finally {
    await fs.rm(
      tempPath,
      {
        force: true,
      }
    );
  }
};

module.exports = {
  buildPreparedDataset,
};
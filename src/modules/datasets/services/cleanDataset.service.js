const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const {
  findDatasetById,
} = require(
  "../repositories/dataset.repository"
);

const {
  validateCandleDataset,
} = require(
  "../validation/validateCandleDataset"
);

const {
  cleanCandleCsv,
} = require(
  "../cleaning/cleanCandleCsv"
);

const {
  calculateFileChecksum,
} = require(
  "../calculations/calculateFileChecksum"
);

const {
  storeCleanFile,
} = require(
  "../storage/cleanStorage"
);

const {
  persistCleanDataset,
} = require(
  "./persistCleanDataset"
);

const {
  createAppError,
} = require(
  "../../../errors/appError"
);

const validateSource = (
  dataset,
  validation
) => {
  if (dataset.stage !== "RAW") {
    throw createAppError({
      statusCode: 400,
      code: "INVALID_CLEANING_SOURCE_STAGE",
      message:
        "Cleaning accepts RAW datasets only",
    });
  }

  if (!validation.schema.valid) {
    throw createAppError({
      statusCode: 400,
      code: "SOURCE_SCHEMA_INVALID",
      message:
        "Source schema is invalid",
    });
  }

  if (!validation.timestamps?.valid) {
    throw createAppError({
      statusCode: 400,
      code: "SOURCE_TIMESTAMPS_INVALID",
      message:
        "Source timestamps are invalid",
    });
  }
};

const cleanDataset = async ({
  datasetId,
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

  if (source.datasetType !== "CANDLES") {
    throw createAppError({
      statusCode: 400,
      code: "UNSUPPORTED_DATASET_TYPE",
      message:
        "Cleaning supports CANDLES only",
    });
  }

  const validation =
    await validateCandleDataset({
      filePath: source.storageUri,
      sourceTimeframe:
        source.sourceTimeframe,
    });

  validateSource(
    source,
    validation
  );

  const tempPath = path.resolve(
    "storage/temp-clean",
    `${crypto.randomUUID()}.csv`
  );

  await fs.mkdir(
    path.dirname(tempPath),
    {
      recursive: true,
    }
  );

  try {
    const cleaning =
      await cleanCandleCsv({
        inputPath:
          source.storageUri,
        outputPath:
          tempPath,
      });

    const checksum =
      await calculateFileChecksum(
        tempPath
      );

    const stored =
      await storeCleanFile({
        sourcePath: tempPath,
        checksum,
        originalFilename:
          path.basename(
            source.storageUri
          ),
      });

    return persistCleanDataset({
      source,
      checksum,
      storageUri: stored.path,
      cleaning,
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
  cleanDataset,
};
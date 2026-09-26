const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const {
  findDatasetById,
} = require(
  "../repositories/dataset.repository"
);

const {
  validateStitchSources,
} = require(
  "../stitching/validateStitchSources"
);

const {
  stitchCandleFiles,
} = require(
  "../stitching/stitchCandleFiles"
);

const {
  calculateFileChecksum,
} = require(
  "../calculations/calculateFileChecksum"
);

const {
  storeCanonicalFile,
} = require(
  "../storage/canonicalStorage"
);

const {
  persistCanonicalDataset,
} = require(
  "./persistCanonicalDataset"
);

const {
  createAppError,
} = require(
  "../../../errors/appError"
);

const loadDatasets = async (datasetIds) => {
  const datasets = await Promise.all(
    datasetIds.map((id) =>
      findDatasetById(id)
    )
  );

  const missingIndex =
    datasets.findIndex(
      (dataset) => !dataset
    );

  if (missingIndex >= 0) {
    throw createAppError({
      statusCode: 404,
      code: "DATASET_NOT_FOUND",
      message:
        `Dataset ${datasetIds[missingIndex]} not found`,
    });
  }

  return datasets;
};

const stitchDatasets = async ({
  datasetIds,
}) => {
  if (!Array.isArray(datasetIds)) {
    throw createAppError({
      statusCode: 400,
      code: "INVALID_DATASET_IDS",
      message:
        "datasetIds must be an array",
    });
  }

  const sources =
    await loadDatasets(datasetIds);

  validateStitchSources(sources);

  const tempPath = path.resolve(
    "storage/temp-stitch",
    `${crypto.randomUUID()}.csv`
  );

  await fs.mkdir(
    path.dirname(tempPath),
    {
      recursive: true,
    }
  );

  try {
    const stitching =
      await stitchCandleFiles({
        inputPaths:
          sources.map(
            (source) =>
              source.storageUri
          ),

        outputPath: tempPath,
      });

    const checksum =
      await calculateFileChecksum(
        tempPath
      );

    const stored =
      await storeCanonicalFile({
        sourcePath: tempPath,
        checksum,
      });

    return persistCanonicalDataset({
      sources,
      checksum,
      storageUri: stored.path,
      stitching,
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
  stitchDatasets,
};
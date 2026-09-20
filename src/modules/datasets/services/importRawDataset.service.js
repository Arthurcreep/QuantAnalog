const path = require("path");

const {
  calculateFileChecksum,
} = require("../calculations/calculateFileChecksum");

const {
  storeRawFile,
} = require("../storage/rawStorage");

const {
  registerDataset,
} = require("../dataset.service");

const {
  DATASET_STAGES,
} = require("../dataset.constants");

const importRawDataset = async ({
  sourcePath,
  originalFilename,
  datasetMetadata,
  transaction,
}) => {
  const checksum = await calculateFileChecksum(sourcePath);

  const storedFile = await storeRawFile({
    sourcePath,
    originalFilename,
    checksum,
  });

  const dataset = await registerDataset(
    {
      ...datasetMetadata,
      stage: DATASET_STAGES.RAW,
      checksum,
      storageUri: path.resolve(storedFile.path),
      qualityStatus: null,
    },
    {
      transaction,
    }
  );

  return {
    dataset,
    storage: {
      path: storedFile.path,
      alreadyExists: storedFile.alreadyExists,
    },
  };
};

module.exports = {
  importRawDataset,
};
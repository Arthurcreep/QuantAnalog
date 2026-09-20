const {
  createDataset,
  findDatasetById,
} = require("./repositories/dataset.repository");

const {
  validateDatasetMetadata,
} = require("./validators/datasetMetadata.validator");

const {
  createAppError,
} = require("../../errors/appError");

const registerDataset = async (data, options = {}) => {
  validateDatasetMetadata(data);

  const dataset = await createDataset(data, options);

  return dataset;
};

const getDatasetById = async (id, options = {}) => {
  const dataset = await findDatasetById(id, options);

  if (!dataset) {
    throw createAppError({
      statusCode: 404,
      code: "DATASET_NOT_FOUND",
      message: `Dataset ${id} not found`,
    });
  }

  return dataset;
};

module.exports = {
  registerDataset,
  getDatasetById,
};
const Dataset = require("../dataset.model");

const createDataset = async (data, options = {}) => {
  const dataset = await Dataset.create(data, options);

  return dataset;
};

const findDatasetById = async (id, options = {}) => {
  const dataset = await Dataset.findByPk(id, options);

  return dataset;
};

const findDatasetsByChecksum = async (checksum, options = {}) => {
  const datasets = await Dataset.findAll({
    where: {
      checksum,
    },
    ...options,
  });

  return datasets;
};

module.exports = {
  createDataset,
  findDatasetById,
  findDatasetsByChecksum,
};
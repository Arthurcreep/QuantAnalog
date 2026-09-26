const DatasetLineage = require(
  "./datasetLineage.model"
);

const createLineage = async (
  data,
  options = {}
) => {
  return DatasetLineage.create(
    data,
    options
  );
};

const createLineages = async (
  items,
  options = {}
) => {
  if (!items.length) {
    return [];
  }

  return DatasetLineage.bulkCreate(
    items,
    options
  );
};

const findParentsByDatasetId = async (
  datasetId,
  options = {}
) => {
  return DatasetLineage.findAll({
    where: {
      childDatasetId: datasetId,
    },
    order: [["created_at", "ASC"]],
    ...options,
  });
};

const findChildrenByDatasetId = async (
  datasetId,
  options = {}
) => {
  return DatasetLineage.findAll({
    where: {
      parentDatasetId: datasetId,
    },
    order: [["created_at", "ASC"]],
    ...options,
  });
};

module.exports = {
  createLineage,
  createLineages,
  findParentsByDatasetId,
  findChildrenByDatasetId,
};
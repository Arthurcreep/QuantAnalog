const DataRepairEvent = require(
  "./dataRepairEvent.model"
);

const createRepairEvent = async (
  data,
  options = {}
) => {
  return DataRepairEvent.create(
    data,
    options
  );
};

const createRepairEvents = async (
  events,
  options = {}
) => {
  if (!events.length) {
    return [];
  }

  return DataRepairEvent.bulkCreate(
    events,
    options
  );
};

const findRepairEventsByDataset = async (
  datasetId,
  options = {}
) => {
  return DataRepairEvent.findAll({
    where: {
      sourceDatasetId: datasetId,
    },
    order: [["created_at", "ASC"]],
    ...options,
  });
};

module.exports = {
  createRepairEvent,
  createRepairEvents,
  findRepairEventsByDataset,
};
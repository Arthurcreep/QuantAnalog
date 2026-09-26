const {
  Op,
} = require("sequelize");

const Dataset = require(
  "../dataset.model"
);

const createDataset = async (
  data,
  options = {}
) => {
  return Dataset.create(
    data,
    options
  );
};

const findDatasetById = async (
  id,
  options = {}
) => {
  return Dataset.findByPk(
    id,
    options
  );
};

const findDatasetsByChecksum = async (
  checksum,
  options = {}
) => {
  return Dataset.findAll({
    where: {
      checksum,
    },

    ...options,
  });
};

const findDatasetsByInstrumentContext =
  async (
    {
      venue,
      instrument,
      marketType,
      datasetType = null,
      stages = null,
      qualityStatuses = null,
    },
    options = {}
  ) => {
    const where = {
      venue,
      instrument,
      marketType,
    };

    if (datasetType) {
      where.datasetType =
        datasetType;
    }

    if (
      Array.isArray(stages) &&
      stages.length > 0
    ) {
      where.stage = {
        [Op.in]: stages,
      };
    }

    if (
      Array.isArray(
        qualityStatuses
      ) &&
      qualityStatuses.length > 0
    ) {
      where.qualityStatus = {
        [Op.in]:
          qualityStatuses,
      };
    }

    return Dataset.findAll({
      where,

      order: [
        [
          "version",
          "DESC",
        ],
        [
          "created_at",
          "DESC",
        ],
      ],

      ...options,
    });
  };

const updateDatasetQualityStatus =
  async (
    id,
    qualityStatus,
    options = {}
  ) => {
    const [, datasets] =
      await Dataset.update(
        {
          qualityStatus,
        },
        {
          where: {
            id,
          },

          returning: true,

          ...options,
        }
      );

    return datasets[0] || null;
  };

module.exports = {
  createDataset,
  findDatasetById,
  findDatasetsByChecksum,
  findDatasetsByInstrumentContext,
  updateDatasetQualityStatus,
};
const {
  findDatasetById,
} = require(
  "../repositories/dataset.repository"
);

const {
  findParentsByDatasetId,
  findChildrenByDatasetId,
} = require(
  "../lineage/datasetLineage.repository"
);

const {
  createAppError,
} = require(
  "../../../errors/appError"
);

const ENGINE_VERSION =
  "dataset-lineage-read-v1.0";

const serializeModel = (
  model
) => {
  if (!model) {
    return null;
  }

  return model.get({
    plain: true,
  });
};

const buildParentItem =
  async (
    lineage,
    options = {}
  ) => {
    const parentDataset =
      await findDatasetById(
        lineage.parentDatasetId,
        options
      );

    return {
      lineage:
        serializeModel(
          lineage
        ),

      dataset:
        serializeModel(
          parentDataset
        ),
    };
  };

const buildChildItem =
  async (
    lineage,
    options = {}
  ) => {
    const childDataset =
      await findDatasetById(
        lineage.childDatasetId,
        options
      );

    return {
      lineage:
        serializeModel(
          lineage
        ),

      dataset:
        serializeModel(
          childDataset
        ),
    };
  };

const getDatasetLineage =
  async (
    {
      datasetId,
    },
    options = {}
  ) => {
    const dataset =
      await findDatasetById(
        datasetId,
        options
      );

    if (!dataset) {
      throw createAppError({
        statusCode: 404,

        code:
          "DATASET_NOT_FOUND",

        message:
          `Dataset ${datasetId} not found`,
      });
    }

    const [
      parentLineages,
      childLineages,
    ] =
      await Promise.all([
        findParentsByDatasetId(
          datasetId,
          options
        ),

        findChildrenByDatasetId(
          datasetId,
          options
        ),
      ]);

    const [
      parents,
      children,
    ] =
      await Promise.all([
        Promise.all(
          parentLineages.map(
            (lineage) =>
              buildParentItem(
                lineage,
                options
              )
          )
        ),

        Promise.all(
          childLineages.map(
            (lineage) =>
              buildChildItem(
                lineage,
                options
              )
          )
        ),
      ]);

    return {
      engineVersion:
        ENGINE_VERSION,

      dataset:
        serializeModel(
          dataset
        ),

      summary: {
        parentCount:
          parents.length,

        childCount:
          children.length,
      },

      parents,

      children,
    };
  };

module.exports = {
  ENGINE_VERSION,
  getDatasetLineage,
};
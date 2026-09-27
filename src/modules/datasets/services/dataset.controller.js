const {
  getDatasetQuality,
} = require(
  "./services/getDatasetQuality.service"
);

const {
  getDatasetLineage,
} = require(
  "./services/getDatasetLineage.service"
);

const getDatasetQualityHandler =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await getDatasetQuality({
          datasetId:
            req.params.id,
        });

      res.status(
        200
      ).json({
        status:
          "ok",

        data:
          result,
      });
    } catch (
      error
    ) {
      next(
        error
      );
    }
  };

const getDatasetLineageHandler =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await getDatasetLineage({
          datasetId:
            req.params.id,
        });

      res.status(
        200
      ).json({
        status:
          "ok",

        data:
          result,
      });
    } catch (
      error
    ) {
      next(
        error
      );
    }
  };

module.exports = {
  getDatasetQualityHandler,
  getDatasetLineageHandler,
};
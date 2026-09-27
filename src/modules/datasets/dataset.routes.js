const express = require(
  "express"
);

const {
  getDatasetQualityHandler,
  getDatasetLineageHandler,
} = require(
  "./dataset.controller"
);

const router =
  express.Router();

router.get(
  "/:id/quality",
  getDatasetQualityHandler
);

router.get(
  "/:id/lineage",
  getDatasetLineageHandler
);

module.exports =
  router;
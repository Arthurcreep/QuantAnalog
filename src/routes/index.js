const express = require(
  "express"
);

const healthRoutes = require(
  "../modules/health/health.routes"
);

const forecastRoutes = require(
  "../modules/forecasting/forecast.routes"
);

const datasetRoutes = require(
  "../modules/datasets/dataset.routes"
);

const router =
  express.Router();

router.use(
  "/health",
  healthRoutes
);

router.use(
  "/api/v1/forecasts",
  forecastRoutes
);

router.use(
  "/api/v1/datasets",
  datasetRoutes
);

module.exports =
  router;
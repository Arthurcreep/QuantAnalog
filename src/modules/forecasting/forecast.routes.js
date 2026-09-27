const express = require(
  "express"
);

const {
  listForecastRunsController,
  createForecast,
  getForecast,
  getForecastHistory,
  getForecastEvaluation,
  getForecastResultController,
} = require(
  "./forecast.controller"
);

const router =
  express.Router();

router.get("/", listForecastRunsController);

router.post(
  "/",
  createForecast
);

router.get(
  "/:id/history",
  getForecastHistory
);

router.get(
  "/:id/evaluation",
  getForecastEvaluation
);

router.get(
  "/:id/result",
  getForecastResultController
);

router.get(
  "/:id",
  getForecast
);

module.exports =
  router;
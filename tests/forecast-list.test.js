const assert = require("node:assert/strict");
const { test } = require("node:test");
const express = require("express");
const ForecastRun = require("../src/modules/forecasting/runs/forecastRun.model");
const routes = require("../src/modules/forecasting/forecast.routes");

const serve = async (t) => {
  const app = express();
  app.use("/api/v1/forecasts", routes);
  app.use((error, req, res, next) => { res.status(500).json({ error: error.message }); });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return `http://127.0.0.1:${server.address().port}/api/v1/forecasts`;
};

test("forecast list returns an empty collection for an empty database", async (t) => {
  const find = t.mock.method(ForecastRun, "findAll", async () => []);
  const response = await fetch(await serve(t));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok", data: { forecastRuns: [] } });
  assert.equal(find.mock.calls[0].arguments[0].limit, 50);
});

test("forecast list exposes saved runs without a hardcoded run ID", async (t) => {
  const saved = { id: "saved-run", datasetId: "dataset", modelId: "GARCH_NORMAL", issuedAt: "2026-01-01T00:00:00Z" };
  t.mock.method(ForecastRun, "findAll", async () => [saved]);
  const response = await fetch(await serve(t));
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).data.forecastRuns, [saved]);
});

test("database failure is an error, not a misleading empty list", async (t) => {
  t.mock.method(ForecastRun, "findAll", async () => { throw new Error("Database unavailable"); });
  const response = await fetch(await serve(t));
  assert.equal(response.status, 500);
});

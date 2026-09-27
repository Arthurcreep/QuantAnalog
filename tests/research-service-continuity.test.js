const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const Dataset = require("../src/modules/datasets/dataset.model");
const AnalysisRun = require("../src/modules/research/runs/analysisRun.model");
const { runReturnResearch } = require("../src/modules/research/services/runReturnResearch.service");
const { runVolatilityStructureResearch } = require("../src/modules/research/services/runVolatilityStructureResearch.service");

const makeDataset = async (t, offsets) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "quantlog-continuity-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const storageUri = path.join(directory, "prepared.csv");
  const rows = offsets.map((offset, index) => `${new Date(Date.UTC(2024, 0, 1) + offset * 3600000).toISOString()},${100 + index ** 2},true`);
  await fs.writeFile(storageUri, `timestamp,close,is_complete\n${rows.join("\n")}\n`);
  const dataset = { id: "fixture", sourceTimeframe: "1h", stage: "PREPARED", qualityStatus: "ACCEPTABLE_WITH_WARNINGS", storageUri };
  t.mock.method(Dataset, "findByPk", async () => dataset);
  return dataset;
};

test("both diagnostic services reject gaps before publishing analysis results", async (t) => {
  await makeDataset(t, [0, 1, 2, 4, 5, 6]);
  const create = t.mock.method(AnalysisRun, "create", async () => { throw new Error("Unexpected write"); });
  for (const run of [runReturnResearch, runVolatilityStructureResearch]) {
    await assert.rejects(run({ datasetId: "fixture", incompletePolicy: "DROP_INCOMPLETE" }), { code: "NON_CONTIGUOUS_DIAGNOSTIC_SERIES" });
  }
  assert.equal(create.mock.callCount(), 0);
});

test("contiguous return research retains its existing output contract", async (t) => {
  await makeDataset(t, [0, 1, 2, 3, 4, 5, 6, 7]);
  const create = t.mock.method(AnalysisRun, "create", async (data) => ({ ...data, id: "run-fixture" }));
  const result = await runReturnResearch({ datasetId: "fixture", incompletePolicy: "DROP_INCOMPLETE", maxLag: 2 });
  assert.equal(result.analysisRunId, "run-fixture");
  assert.equal(result.metrics.sample.returnCount, 7);
  assert.equal(result.metrics.acf.length, 3);
  assert.equal(create.mock.calls[0].arguments[0].config.gapPolicy, "REQUIRE_CONTIGUOUS");
});

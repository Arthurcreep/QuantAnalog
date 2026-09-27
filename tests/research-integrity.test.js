const assert = require("node:assert/strict");
const { test } = require("node:test");
const { evaluateCategoricalFactorEvidence: evaluate } = require("../src/modules/research/evidence/evaluateCategoricalFactorEvidence");
const { evaluateContinuousFactorEvidence: evaluateContinuous } = require("../src/modules/research/evidence/evaluateContinuousFactorEvidence");
const { validateSeriesContinuity } = require("../src/modules/research/series/validateSeriesContinuity");
const { calculateRollingRealizedVolatility: rolling } = require("../src/modules/research/calculations/calculateRollingRealizedVolatility");

const hour = 3600000;
const row = (offset, logReturn = 0.01) => ({ timestamp: new Date(Date.UTC(2026, 0, 1) + offset * hour).toISOString(), logReturn });
const horizon = (bars, supported = true) => {
  const pValue = supported ? 0.001 : 0.8;
  return {
    horizon: `${bars}h`, horizonBars: bars,
    evaluation: {
      development: { hac: { pValue, beta: 0.2 } },
      retrospectiveValidation: { hac: { pValue, beta: 0.2 } },
      stability: { profileCorrelation: 0.8 },
    },
    multipleTesting: { developmentAdjustedPValue: pValue, validationAdjustedPValue: pValue },
    familyMultipleTesting: { developmentAdjustedPValue: pValue, validationAdjustedPValue: pValue },
    bootstrap: { observed: { relativeDifference: 0.2 }, fixedContrast: { relativeDifference: { lower: 0.1, upper: 0.3 } } },
  };
};
const input = (results) => ({ hypothesis: { analysisRuns: [{
  config: { protocol: { horizons: results.map((item) => ({ label: item.horizon, bars: item.horizonBars })) } },
  metrics: { horizons: results },
}] } });

test("categorical evidence requires strict majority for even horizons", () => {
  const result = evaluate(input([horizon(1), horizon(2), horizon(3, false), horizon(4, false)]));
  assert.equal(result.level, 1);
  assert.equal(result.criteria.requiredSupportingHorizons, 3);
  assert.equal(evaluate(input([horizon(1), horizon(2), horizon(3), horizon(4, false)])).level, 5);
});

test("reversal of the frozen high-minus-low contrast cannot pass OOS", () => {
  const data = input([horizon(1)]);
  data.hypothesis.analysisRuns[0].metrics.horizons[0].bootstrap = {
    observed: { relativeDifference: -0.2 },
    fixedContrast: { relativeDifference: { lower: -0.3, upper: -0.1 } },
  };
  const result = evaluate(data);
  assert.equal(result.level, 3);
  assert.equal(result.horizons[0].directionStable, false);
  assert.equal(result.horizons[0].bootstrapSupported, false);
});

test("invalid, reversed or zero-crossing confidence intervals cannot earn level 5", () => {
  for (const interval of [{ lower: NaN, upper: 0.3 }, { lower: 0.1, upper: Infinity }, { lower: 0.3, upper: 0.1 }, { lower: -0.1, upper: 0.3 }, { lower: 0, upper: 0.3 }]) {
    const data = input([horizon(1)]);
    data.hypothesis.analysisRuns[0].metrics.horizons[0].bootstrap.fixedContrast.relativeDifference = interval;
    assert.equal(evaluate(data).level, 4);
  }
});

test("missing, duplicate, mismatched or unregistered horizons fail closed", () => {
  for (const evaluator of [evaluate, evaluateContinuous]) {
    const missing = input([horizon(1), horizon(2)]);
    missing.hypothesis.analysisRuns[0].metrics.horizons.pop();
    assert.equal(evaluator(missing).reason, "HORIZON_RESULTS_INCOMPLETE");
    const duplicate = input([horizon(1), horizon(2)]);
    duplicate.hypothesis.analysisRuns[0].metrics.horizons[1] = horizon(1);
    assert.equal(evaluator(duplicate).reason, "HORIZON_RESULTS_MISMATCH");
    const wrongBars = input([horizon(1)]);
    wrongBars.hypothesis.analysisRuns[0].metrics.horizons[0].horizonBars = 24;
    assert.equal(evaluator(wrongBars).reason, "HORIZON_RESULTS_MISMATCH");
    const noConfig = input([horizon(1)]);
    delete noConfig.hypothesis.analysisRuns[0].config;
    assert.equal(evaluator(noConfig).reason, "REGISTERED_HORIZONS_MISSING");
  }
});

test("continuous evidence also requires a strict majority", () => {
  const result = evaluateContinuous(input([horizon(1), horizon(2), horizon(3, false), horizon(4, false)]));
  assert.equal(result.criteria.requiredSupportingHorizons, 3);
  assert.equal(result.level, 1);
});

test("diagnostics reject gaps, duplicates, descending and invalid timestamps", () => {
  validateSeriesContinuity({ series: [row(0), row(1), row(2)], expectedIntervalMs: hour });
  for (const series of [[row(0), row(2)], [row(0), row(0)], [row(1), row(0)]]) {
    assert.throws(() => validateSeriesContinuity({ series, expectedIntervalMs: hour }), { code: "NON_CONTIGUOUS_DIAGNOSTIC_SERIES" });
  }
  assert.throws(() => validateSeriesContinuity({ series: [{ timestamp: "bad" }], expectedIntervalMs: hour }), { code: "INVALID_SERIES_TIMESTAMP" });
});

test("rolling volatility restarts after a gap and matches hand-computed complete windows", () => {
  const result = rolling({ series: [row(0, 0.01), row(1, 0.02), row(48, 0.03), row(49, 0.04), row(50, 0.05)], windowSize: 2, expectedIntervalMs: hour });
  assert.deepEqual(result.map((item) => item.timestamp), [row(1).timestamp, row(49).timestamp, row(50).timestamp]);
  for (const [index, expected] of [0.0005, 0.0025, 0.0041].entries()) assert.ok(Math.abs(result[index].realizedVariance - expected) < 1e-12);
  assert.deepEqual(rolling({ series: [row(0), row(48)], windowSize: 2, expectedIntervalMs: hour }), []);
});

test("rolling volatility rejects ambiguous interval and malformed ordering", () => {
  assert.throws(() => rolling({ series: [row(0)], windowSize: 2 }), /INVALID_EXPECTED_INTERVAL/);
  for (const series of [[row(0), row(0)], [row(1), row(0)], [row(0), row(1.5)]]) {
    assert.throws(() => rolling({ series, windowSize: 2, expectedIntervalMs: hour }), /INVALID_SERIES_ORDER_OR_ALIGNMENT/);
  }
});

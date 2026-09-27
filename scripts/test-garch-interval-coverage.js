const assert = require(
  "assert"
);

const {
  QueryTypes,
} = require(
  "sequelize"
);

const sequelize = require(
  "../src/config/database"
);

const {
  calculateIntervalCoverage,
} = require(
  "../src/modules/forecasting/evaluation/calculateIntervalCoverage"
);

const DATASET_ID =
  "f10885c8-f99e-494e-9ad4-fc0f5c385f26";

const ANALYSIS_RUN_ID =
  "828053be-6334-4475-a18b-a837439c8161";

const START_AT =
  "2026-06-19T00:00:00.000Z";

const END_AT =
  "2026-09-16T00:00:00.000Z";

const EXPECTED_HORIZONS = [
  "1h",
  "6h",
  "1d",
  "3d",
  "5d",
];

const run = async () => {
  try {
    await sequelize.authenticate();

    const rows =
      await sequelize.query(
        `
          SELECT
            f.horizon AS "horizon",
            f.issued_at AS "issuedAt",
            f.prediction AS "prediction",
            o.actual AS "actual"
          FROM forecasts f
          INNER JOIN forecast_outcomes o
            ON o.forecast_id = f.id
          WHERE
            f.dataset_id = :datasetId
            AND f.source_analysis_run_id = :analysisRunId
            AND f.model_id = 'GARCH_NORMAL'
            AND f.model_version = '1.1.0'
            AND f.issued_at >= :startAt
            AND f.issued_at <= :endAt
            AND f.model_config ->> 'protocolId'
              = 'GARCH_NORMAL_MULTI_HORIZON_V1'
            AND f.model_config ->> 'protocolVersion'
              = '1.1.0'
          ORDER BY
            f.issued_at ASC,
            f.horizon ASC
        `,
        {
          replacements: {
            datasetId:
              DATASET_ID,

            analysisRunId:
              ANALYSIS_RUN_ID,

            startAt:
              START_AT,

            endAt:
              END_AT,
          },

          type:
            QueryTypes.SELECT,
        }
      );

    assert.strictEqual(
      rows.length,
      450,
      `Expected 450 forecasts, got ${rows.length}`
    );

    const result =
      calculateIntervalCoverage({
        rows,

        horizons:
          EXPECTED_HORIZONS,
      });

    assert.strictEqual(
      result
        .totalObservationCount,
      450
    );

    for (
      const item of
        result.horizons
    ) {
      assert.strictEqual(
        item
          .observationCount,
        90,
        `${item.horizon} must contain 90 forecasts`
      );

      assert.strictEqual(
        item
          .nominalCoverage,
        0.95
      );

      assert.strictEqual(
        item.inside +
          item.below +
          item.above,
        90
      );
    }

    console.log(
      "GARCH interval coverage test passed."
    );

    console.table(
      result
        .horizons
        .map(
          (item) => ({
            horizon:
              item.horizon,

            n:
              item
                .observationCount,

            nominal:
              item
                .nominalCoverage,

            coverage:
              item
                .empiricalCoverage,

            coverageError:
              item
                .coverageError,

            inside:
              item.inside,

            below:
              item.below,

            above:
              item.above,

            meanWidth:
              item
                .meanIntervalWidth,
          })
        )
    );
  } catch (error) {
    console.error(
      "GARCH interval coverage test failed:",
      error
    );

    process.exitCode =
      1;
  } finally {
    await sequelize.close();
  }
};

run();
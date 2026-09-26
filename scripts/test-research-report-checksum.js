const assert = require(
  "assert"
);

const sequelize = require(
  "../src/config/database"
);

const {
  buildResearchReport,
} = require(
  "../src/modules/research/reports/buildResearchReport.service"
);

const {
  hashResearchReport,
} = require(
  "../src/modules/research/reports/hashResearchReport"
);

const wait = (
  milliseconds
) =>
  new Promise(
    (resolve) =>
      setTimeout(
        resolve,
        milliseconds
      )
  );

const jsonRoundTrip = (
  value
) =>
  JSON.parse(
    JSON.stringify(
      value
    )
  );

const run = async () => {
  try {
    const researchBatchId =
      process.argv[2];

    if (!researchBatchId) {
      throw new Error(
        "RESEARCH_BATCH_ID_REQUIRED"
      );
    }

    await sequelize.authenticate();

    const firstReport =
      await buildResearchReport({
        researchBatchId,
      });

    await wait(
      25
    );

    const secondReport =
      await buildResearchReport({
        researchBatchId,
      });

    const storedRepresentation =
      jsonRoundTrip(
        firstReport
      );

    const firstChecksum =
      hashResearchReport(
        firstReport
      );

    const secondChecksum =
      hashResearchReport(
        secondReport
      );

    const storedChecksum =
      hashResearchReport(
        storedRepresentation
      );

    assert.notStrictEqual(
      firstReport.generatedAt,
      secondReport.generatedAt
    );

    assert.strictEqual(
      firstChecksum,
      secondChecksum
    );

    assert.strictEqual(
      firstChecksum,
      storedChecksum
    );

    assert.strictEqual(
      firstChecksum.length,
      64
    );

    assert.strictEqual(
      firstReport.reportEngineVersion,
      "research-report-v1.2"
    );

    console.log(
      "Research report checksum test passed."
    );

    console.log(
      "\n===== DETERMINISM ====="
    );

    console.log({
      firstGeneratedAt:
        firstReport.generatedAt,

      secondGeneratedAt:
        secondReport.generatedAt,

      generatedAtDifferent:
        firstReport.generatedAt !==
        secondReport.generatedAt,

      firstChecksum,

      secondChecksum,

      storedChecksum,

      rebuildChecksumEqual:
        firstChecksum ===
        secondChecksum,

      jsonRoundTripChecksumEqual:
        firstChecksum ===
        storedChecksum,

      reportEngineVersion:
        firstReport
          .reportEngineVersion,
    });
  } catch (error) {
    console.error(
      "Research report checksum test failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();
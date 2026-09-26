const buildDataQualityReport = (validation) => {
  const {
    schema,
    timestamps,
    intervals,
    domain,
  } = validation;

  let expectedRowCount = null;
  let coverage = null;

  if (
    timestamps?.firstTimestamp &&
    timestamps?.lastTimestamp &&
    timestamps.expectedIntervalMs &&
    timestamps.invalidTimestampCount === 0 &&
    timestamps.outOfOrderCount === 0
  ) {
    const first = Date.parse(timestamps.firstTimestamp);
    const last = Date.parse(timestamps.lastTimestamp);

    expectedRowCount =
      Math.floor(
        (last - first) /
          timestamps.expectedIntervalMs
      ) + 1;

    if (expectedRowCount > 0) {
      coverage =
        (expectedRowCount -
          intervals.missingIntervalCount) /
        expectedRowCount;
    }
  }

  return {
    rows: schema.rowCount,

    validRows: domain?.validCount ?? null,
    invalidRows: domain?.invalidCount ?? null,

    invalidTimestampCount:
      timestamps?.invalidTimestampCount ?? null,

    outOfOrderCount:
      timestamps?.outOfOrderCount ?? null,

    misalignedCount:
      timestamps?.misalignedCount ?? null,

    duplicateCount:
      intervals?.duplicateCount ?? null,

    gapCount:
      intervals?.gapCount ?? null,

    missingIntervalCount:
      intervals?.missingIntervalCount ?? null,

    zeroVolumeCount:
      domain?.zeroVolumeCount ?? null,

    expectedRowCount,
    coverage,

    schemaValid: schema.valid,
  };
};

module.exports = {
  buildDataQualityReport,
};
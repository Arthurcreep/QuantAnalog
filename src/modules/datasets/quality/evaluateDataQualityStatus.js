const {
  QUALITY_STATUSES,
} = require("../dataset.constants");

const exceeds = (
  value,
  limit
) =>
  typeof limit === "number" &&
  value > limit;

const evaluateDataQualityStatus = ({
  report,
  policy,
}) => {
  if (!report.schemaValid) {
    return QUALITY_STATUSES.BLOCKED;
  }

  const missingRatio =
    report.expectedRowCount > 0
      ? report.missingIntervalCount /
        report.expectedRowCount
      : 0;

  const duplicateRatio =
    report.rows > 0
      ? report.duplicateCount /
        report.rows
      : 0;

  if (
    exceeds(
      report.invalidRows,
      policy.maxInvalidRows
    ) ||
    exceeds(
      report.invalidTimestampCount,
      policy.maxInvalidTimestampCount
    ) ||
    exceeds(
      report.outOfOrderCount,
      policy.maxOutOfOrderCount
    ) ||
    exceeds(
      missingRatio,
      policy.maxMissingIntervalRatio
    ) ||
    exceeds(
      duplicateRatio,
      policy.maxDuplicateRatio
    ) ||
    exceeds(
      report.incompleteBucketRatio || 0,
      policy.maxIncompleteBucketRatio
    )
  ) {
    return QUALITY_STATUSES.BLOCKED;
  }

  const hasWarnings =
    report.invalidRows > 0 ||
    report.invalidTimestampCount > 0 ||
    report.outOfOrderCount > 0 ||
    report.misalignedCount > 0 ||
    report.duplicateCount > 0 ||
    report.gapCount > 0 ||
    report.zeroVolumeCount > 0 ||
    (report.incompleteBucketCount || 0) >
      0;

  return hasWarnings
    ? QUALITY_STATUSES.ACCEPTABLE_WITH_WARNINGS
    : QUALITY_STATUSES.PASS;
};

module.exports = {
  evaluateDataQualityStatus,
};
const getRepairMethod = (event) => {
  if (
    event.type ===
    "EXACT_DUPLICATE_REMOVED"
  ) {
    return "DETERMINISTIC_EXACT_DUPLICATE_REMOVAL";
  }

  return "DOMAIN_VALIDATION_REJECTION";
};

const getRepairReason = (event) => {
  if (
    event.type ===
    "EXACT_DUPLICATE_REMOVED"
  ) {
    return "Exact duplicate row removed";
  }

  const issues = event.issues
    ?.map((issue) => issue.type)
    .join(", ");

  return issues
    ? `Invalid candle removed: ${issues}`
    : "Invalid candle removed";
};

const buildRepairEvents = ({
  events,
  sourceDatasetId,
  targetDatasetId,
  policyVersion,
}) =>
  events.map((event) => ({
    sourceDatasetId,
    targetDatasetId,

    eventType: event.type,

    sourceDataRow:
      event.sourceDataRow,

    sourceLine:
      event.sourceLine,

    sourceTimestamp:
      event.timestamp,

    oldValue:
      event.oldValue,

    newValue: null,

    method:
      getRepairMethod(event),

    reason:
      getRepairReason(event),

    policyVersion,
  }));

module.exports = {
  buildRepairEvents,
};
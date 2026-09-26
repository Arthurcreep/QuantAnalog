const ISO_WITH_TIMEZONE_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

const parseTimestamp = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  const rawValue = String(value).trim();

  if (!rawValue) {
    return null;
  }

  if (/^\d{13}$/.test(rawValue)) {
    const timestamp = Number(rawValue);

    return Number.isSafeInteger(timestamp)
      ? timestamp
      : null;
  }

  if (!ISO_WITH_TIMEZONE_PATTERN.test(rawValue)) {
    return null;
  }

  const timestamp = Date.parse(rawValue);

  return Number.isNaN(timestamp)
    ? null
    : timestamp;
};

module.exports = {
  parseTimestamp,
};
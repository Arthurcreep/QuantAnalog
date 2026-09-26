const crypto = require(
  "crypto"
);

const canonicalize = (
  value
) => {
  if (
    Array.isArray(value)
  ) {
    return value.map(
      canonicalize
    );
  }

  if (
    value !== null &&
    typeof value ===
      "object"
  ) {
    return Object
      .keys(value)
      .sort()
      .reduce(
        (
          result,
          key
        ) => {
          result[key] =
            canonicalize(
              value[key]
            );

          return result;
        },
        {}
      );
  }

  return value;
};

const normalizeJsonValue = (
  value
) =>
  JSON.parse(
    JSON.stringify(
      value
    )
  );

const buildChecksumPayload = (
  report
) => {
  const {
    generatedAt,
    ...deterministicReport
  } = report;

  return normalizeJsonValue(
    deterministicReport
  );
};

const hashResearchReport = (
  report
) => {
  const checksumPayload =
    buildChecksumPayload(
      report
    );

  const canonical =
    canonicalize(
      checksumPayload
    );

  return crypto
    .createHash(
      "sha256"
    )
    .update(
      JSON.stringify(
        canonical
      )
    )
    .digest(
      "hex"
    );
};

module.exports = {
  hashResearchReport,
};
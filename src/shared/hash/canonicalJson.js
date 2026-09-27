const normalizeForCanonicalJson = (
  value
) => {
  if (
    value instanceof Date
  ) {
    return value.toISOString();
  }

  if (
    Array.isArray(
      value
    )
  ) {
    return value.map(
      normalizeForCanonicalJson
    );
  }

  if (
    value &&
    typeof value ===
      "object"
  ) {
    return Object
      .keys(
        value
      )
      .sort()
      .reduce(
        (
          result,
          key
        ) => {
          result[key] =
            normalizeForCanonicalJson(
              value[key]
            );

          return result;
        },
        {}
      );
  }

  return value;
};

const canonicalJsonStringify = (
  value
) =>
  JSON.stringify(
    normalizeForCanonicalJson(
      value
    )
  );

module.exports = {
  normalizeForCanonicalJson,
  canonicalJsonStringify,
};
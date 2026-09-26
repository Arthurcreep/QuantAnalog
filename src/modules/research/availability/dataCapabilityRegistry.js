const DATA_CAPABILITIES = [
  "CANDLES",
  "TIMESTAMP",
  "FUNDING",
  "OPEN_INTEREST",
  "TRADES",
  "ORDER_BOOK",
  "LIQUIDATIONS",
  "MULTI_ASSET_CANDLES",
  "ON_CHAIN",
  "MACRO_EVENTS",
];

const CAPABILITY_IMPLICATIONS = {
  CANDLES: [
    "TIMESTAMP",
  ],
};

const hasKnownCapability = (
  capability
) =>
  DATA_CAPABILITIES.includes(
    capability
  );

const expandCapabilities = (
  capabilities
) => {
  const expanded =
    new Set(
      capabilities
    );

  let changed = true;

  while (changed) {
    changed = false;

    for (
      const capability of
      [...expanded]
    ) {
      const implied =
        CAPABILITY_IMPLICATIONS[
          capability
        ] || [];

      for (
        const item of implied
      ) {
        if (
          !expanded.has(item)
        ) {
          expanded.add(item);
          changed = true;
        }
      }
    }
  }

  return [
    ...expanded,
  ];
};

module.exports = {
  DATA_CAPABILITIES,
  CAPABILITY_IMPLICATIONS,
  hasKnownCapability,
  expandCapabilities,
};
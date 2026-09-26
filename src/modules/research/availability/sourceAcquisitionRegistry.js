const SOURCE_ACQUISITION_REGISTRY = {
  "BYBIT:LINEAR": [
    "CANDLES",
    "FUNDING",
    "OPEN_INTEREST",
    "MULTI_ASSET_CANDLES",
  ],
};

const buildSourceKey = ({
  venue,
  marketType,
}) => {
  return [
    String(venue).toUpperCase(),
    String(marketType).toUpperCase(),
  ].join(":");
};

const resolveSourceAcquirableCapabilities =
  ({
    venue,
    marketType,
  }) => {
    if (
      !venue ||
      !marketType
    ) {
      throw new Error(
        "INVALID_SOURCE_CONTEXT"
      );
    }

    const key =
      buildSourceKey({
        venue,
        marketType,
      });

    return [
      ...(
        SOURCE_ACQUISITION_REGISTRY[
          key
        ] || []
      ),
    ];
  };

module.exports = {
  SOURCE_ACQUISITION_REGISTRY,
  resolveSourceAcquirableCapabilities,
};
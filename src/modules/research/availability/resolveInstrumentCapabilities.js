const {
  findDatasetsByInstrumentContext,
} = require(
  "../../datasets/repositories/dataset.repository"
);

const {
  DATA_CAPABILITIES,
  expandCapabilities,
} = require(
  "./dataCapabilityRegistry"
);

const RESEARCH_READY_STAGES = [
  "CANONICAL",
  "PREPARED",
];

const RESEARCH_READY_QUALITY = [
  "PASS",
  "ACCEPTABLE_WITH_WARNINGS",
];

const DATASET_TYPE_CAPABILITY_MAP = {
  CANDLES:
    "CANDLES",

  FUNDING:
    "FUNDING",

  OPEN_INTEREST:
    "OPEN_INTEREST",

  TRADES:
    "TRADES",

  ORDER_BOOK:
    "ORDER_BOOK",

  LIQUIDATIONS:
    "LIQUIDATIONS",
};

const toPlain = (
  dataset
) => {
  if (
    dataset &&
    typeof dataset.toJSON ===
      "function"
  ) {
    return dataset.toJSON();
  }

  return dataset;
};

const normalizeDataset = (
  dataset
) => {
  const plain =
    toPlain(dataset);

  return {
    id:
      plain.id,

    name:
      plain.name,

    datasetType:
      plain.datasetType,

    stage:
      plain.stage,

    version:
      plain.version,

    venue:
      plain.venue,

    instrument:
      plain.instrument,

    marketType:
      plain.marketType,

    sourceTimeframe:
      plain.sourceTimeframe,

    startTime:
      plain.startTime,

    endTime:
      plain.endTime,

    rowCount:
      plain.rowCount,

    checksum:
      plain.checksum,

    storageUri:
      plain.storageUri,

    qualityStatus:
      plain.qualityStatus,
  };
};

const pickFirst = (
  datasets
) =>
  datasets.length > 0
    ? datasets[0]
    : null;

const buildCandleDatasetSummary = (
  datasets
) => {
  const candleDatasets =
    datasets.filter(
      (dataset) =>
        dataset.datasetType ===
        "CANDLES"
    );

  const canonical =
    candleDatasets.filter(
      (dataset) =>
        dataset.stage ===
        "CANONICAL"
    );

  const prepared =
    candleDatasets.filter(
      (dataset) =>
        dataset.stage ===
        "PREPARED"
    );

  const preparedByTimeframe =
    {};

  for (
    const dataset of prepared
  ) {
    const timeframe =
      dataset.sourceTimeframe;

    if (!timeframe) {
      continue;
    }

    if (
      !preparedByTimeframe[
        timeframe
      ]
    ) {
      preparedByTimeframe[
        timeframe
      ] = dataset;
    }
  }

  return {
    available:
      candleDatasets.length >
      0,

    canonical:
      pickFirst(
        canonical
      ),

    prepared:
      preparedByTimeframe,

    datasetCount:
      candleDatasets.length,
  };
};

const buildGenericDatasetSummary =
  ({
    datasets,
    datasetType,
  }) => {
    const matches =
      datasets.filter(
        (dataset) =>
          dataset.datasetType ===
          datasetType
      );

    return {
      available:
        matches.length > 0,

      primary:
        pickFirst(
          matches
        ),

      datasetCount:
        matches.length,
    };
  };

const resolveInstrumentCapabilities =
  async ({
    venue,
    instrument,
    marketType,
  }) => {
    if (
      !venue ||
      !instrument ||
      !marketType
    ) {
      throw new Error(
        "INVALID_INSTRUMENT_CONTEXT"
      );
    }

    const rows =
      await findDatasetsByInstrumentContext(
        {
          venue,
          instrument,
          marketType,

          stages:
            RESEARCH_READY_STAGES,

          qualityStatuses:
            RESEARCH_READY_QUALITY,
        }
      );

    const datasets =
      rows.map(
        normalizeDataset
      );

    const availableBase =
      new Set();

    for (
      const dataset of datasets
    ) {
      const capability =
        DATASET_TYPE_CAPABILITY_MAP[
          dataset.datasetType
        ];

      if (capability) {
        availableBase.add(
          capability
        );
      }
    }

    const available =
      expandCapabilities(
        [
          ...availableBase,
        ]
      );

    const availableSet =
      new Set(
        available
      );

    const missing =
      DATA_CAPABILITIES.filter(
        (capability) =>
          !availableSet.has(
            capability
          )
      );

    const datasetSummary = {
      CANDLES:
        buildCandleDatasetSummary(
          datasets
        ),

      FUNDING:
        buildGenericDatasetSummary({
          datasets,
          datasetType:
            "FUNDING",
        }),

      OPEN_INTEREST:
        buildGenericDatasetSummary({
          datasets,
          datasetType:
            "OPEN_INTEREST",
        }),

      TRADES:
        buildGenericDatasetSummary({
          datasets,
          datasetType:
            "TRADES",
        }),

      ORDER_BOOK:
        buildGenericDatasetSummary({
          datasets,
          datasetType:
            "ORDER_BOOK",
        }),

      LIQUIDATIONS:
        buildGenericDatasetSummary({
          datasets,
          datasetType:
            "LIQUIDATIONS",
        }),
    };

    return {
      instrumentContext: {
        venue,
        instrument,
        marketType,
      },

      available,

      missing,

      datasets:
        datasetSummary,

      researchReadyDatasetCount:
        datasets.length,
    };
  };

module.exports = {
  resolveInstrumentCapabilities,
};
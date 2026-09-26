const {
  getFeatureById,
  listFeatures,
  listFeaturesByFamily,
} = require(
  "../src/modules/research/registry/featureRegistry"
);

const {
  getTargetById,
  listTargets,
} = require(
  "../src/modules/research/registry/targetRegistry"
);

const run = () => {
  console.log(
    "\n===== FEATURES ====="
  );

  console.table(
    listFeatures().map(
      (feature) => ({
        id:
          feature.id,

        family:
          feature.family,

        status:
          feature.status,

        version:
          feature.version,
      })
    )
  );

  console.log(
    "\n===== VOLATILITY FEATURES ====="
  );

  console.table(
    listFeaturesByFamily(
      "VOLATILITY"
    )
  );

  console.log(
    "\n===== TARGETS ====="
  );

  console.table(
    listTargets()
  );

  console.log(
    "\n===== LOOKUP ====="
  );

  console.log({
    lunarPhase:
      getFeatureById(
        "LUNAR_PHASE"
      ),

    futureVolatility:
      getTargetById(
        "FUTURE_REALIZED_VOLATILITY"
      ),
  });
};

run();
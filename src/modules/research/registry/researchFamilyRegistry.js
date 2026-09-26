const RESEARCH_FAMILIES = [
  {
    id: "RETURN_STRUCTURE",
    name: "Return Structure",
    description:
      "Predictability and dependence in returns, momentum, reversal and directional structure",
  },

  {
    id: "VOLATILITY_STRUCTURE",
    name: "Volatility Structure",
    description:
      "Volatility clustering, persistence, realized volatility and volatility regimes",
  },

  {
    id: "CALENDAR",
    name: "Calendar",
    description:
      "Time-of-day, weekday, weekend, month and other calendar seasonality",
  },

  {
    id: "SESSION",
    name: "Trading Sessions",
    description:
      "Asia, Europe, US sessions, opens, closes and session overlaps",
  },

  {
    id: "VOLUME",
    name: "Volume",
    description:
      "Volume levels, shocks, changes and abnormal activity",
  },

  {
    id: "CANDLE_STRUCTURE",
    name: "Candle Structure",
    description:
      "OHLC-derived body, wick, range and close-location effects",
  },

  {
    id: "REGIME",
    name: "Market Regimes",
    description:
      "Conditional effects across volatility, trend and drawdown regimes",
  },

  {
    id: "DERIVATIVES_FUNDING",
    name: "Funding",
    description:
      "Funding level, sign, extremes and funding-related market effects",
  },

  {
    id: "DERIVATIVES_OI",
    name: "Open Interest",
    description:
      "Open interest level, change and shock effects",
  },

  {
    id: "BASIS_PREMIUM",
    name: "Basis and Premium",
    description:
      "Spot-perpetual basis, premium and convergence effects",
  },

  {
    id: "LIQUIDATIONS",
    name: "Liquidations",
    description:
      "Liquidation shocks, imbalance and post-liquidation market response",
  },

  {
    id: "MICROSTRUCTURE",
    name: "Microstructure",
    description:
      "Order book, spread, depth, imbalance and trade-flow effects",
  },

  {
    id: "CROSS_ASSET",
    name: "Cross Asset",
    description:
      "Leader-follower and lagged relationships between assets",
  },

  {
    id: "CLUSTER_RELATIVE",
    name: "Cluster Relative",
    description:
      "Relative shocks, catch-up and reversion inside asset clusters",
  },

  {
    id: "CORRELATION_REGIME",
    name: "Correlation Regime",
    description:
      "Changes in correlation, beta and factor relationships",
  },

  {
    id: "MACRO_EVENT",
    name: "Macro Events",
    description:
      "Scheduled macroeconomic releases and policy events",
  },

  {
    id: "CRYPTO_EVENT",
    name: "Crypto Events",
    description:
      "Crypto-specific scheduled and structural events",
  },

  {
    id: "ON_CHAIN",
    name: "On Chain",
    description:
      "Blockchain flows, holders, exchange flows and network activity",
  },

  {
    id: "MARKET_FLOW",
    name: "Market Flow",
    description:
      "Capital and asset flows between venues and market segments",
  },

  {
    id: "EXPERIMENTAL",
    name: "Experimental",
    description:
      "Non-standard hypotheses such as lunar phase and other anomalies",
  },

  {
    id: "INTERACTION",
    name: "Interactions",
    description:
      "Interactions between multiple validated or candidate features",
  },

  {
    id: "NEGATIVE_CONTROL",
    name: "Negative Controls",
    description:
      "Placebo and shuffled hypotheses used to detect false discoveries",
  },

  {
    id: "CUSTOM",
    name: "Custom Research",
    description:
      "User-defined hypotheses and custom composite conditions",
  },
];

const getResearchFamily = (
  id
) =>
  RESEARCH_FAMILIES.find(
    (family) =>
      family.id === id
  ) || null;

const listResearchFamilies = () =>
  RESEARCH_FAMILIES.map(
    (family) => ({
      ...family,
    })
  );

const hasResearchFamily = (
  id
) =>
  getResearchFamily(id) !==
  null;

module.exports = {
  RESEARCH_FAMILIES,
  getResearchFamily,
  listResearchFamilies,
  hasResearchFamily,
};
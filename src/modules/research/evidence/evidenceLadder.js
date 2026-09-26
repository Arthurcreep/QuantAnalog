const EVIDENCE_LADDER = [
  {
    level: 0,
    code: "NO_EVIDENCE",
    label: "No Evidence",
  },

  {
    level: 1,
    code: "DESCRIPTIVE",
    label: "Descriptive",
  },

  {
    level: 2,
    code: "STATISTICAL_CANDIDATE",
    label: "Statistical Candidate",
  },

  {
    level: 3,
    code: "MULTIPLE_TESTING_ADJUSTED",
    label: "Multiple-Testing Adjusted",
  },

  {
    level: 4,
    code: "OOS_CANDIDATE",
    label: "OOS Candidate",
  },

  {
    level: 5,
    code: "ROBUST_CANDIDATE",
    label: "Robust Candidate",
  },

  {
    level: 6,
    code: "ECONOMIC_CANDIDATE",
    label: "Economic Candidate",
  },

  {
    level: 7,
    code: "FORWARD_VALIDATED",
    label: "Forward Validated",
  },

  {
    level: 8,
    code: "DEPLOYABLE",
    label: "Deployable",
  },
];

const getEvidenceLevel = (
  level
) =>
  EVIDENCE_LADDER.find(
    (item) =>
      item.level === level
  ) || null;

const buildEvidenceLevel = (
  level
) => {
  const definition =
    getEvidenceLevel(level);

  if (!definition) {
    throw new Error(
      `INVALID_EVIDENCE_LEVEL:${level}`
    );
  }

  return {
    ...definition,
  };
};

module.exports = {
  EVIDENCE_LADDER,
  getEvidenceLevel,
  buildEvidenceLevel,
};
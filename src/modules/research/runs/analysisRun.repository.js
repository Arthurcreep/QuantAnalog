const AnalysisRun = require(
  "./analysisRun.model"
);

const createAnalysisRun = async (
  data,
  options = {}
) =>
  AnalysisRun.create(
    data,
    options
  );

const findAnalysisRunById = async (
  id,
  options = {}
) =>
  AnalysisRun.findByPk(
    id,
    options
  );

module.exports = {
  createAnalysisRun,
  findAnalysisRunById,
};
import http from
  "./http.js";

const getForecastResult =
  async ({
    forecastRunId,
    benchmarkForecastRunId = null,
  }) => {
    const params =
      {};

    if (
      benchmarkForecastRunId
    ) {
      params.benchmarkForecastRunId =
        benchmarkForecastRunId;
    }

    const response =
      await http.get(
        `/forecasts/${forecastRunId}/result`,
        {
          params,
        }
      );

    return response
      .data
      .data;
  };

const listForecastRuns = async ({ signal } = {}) => {
  const response = await http.get("/forecasts", { signal });
  return response.data.data.forecastRuns;
};

export {
  listForecastRuns,
  getForecastResult,
};
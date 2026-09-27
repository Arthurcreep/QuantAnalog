import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import DatasetQualityPage from
  "./pages/DatasetQualityPage.jsx";

import ForecastResultPage from
  "./pages/ForecastResultPage.jsx";

const DEFAULT_GARCH_RUN =
  "75e0712d-ad69-4f10-8bc2-f82147db01a6";

const DEFAULT_BASELINE_RUN =
  "87272179-e508-45b4-b5a9-ebe45db777ff";

const App =
  () => {
    return (
      <Routes>
        <Route
          path="/"
          element={
            <Navigate
              replace
              to={
                `/forecasts/${DEFAULT_GARCH_RUN}` +
                `?benchmarkForecastRunId=${DEFAULT_BASELINE_RUN}`
              }
            />
          }
        />

        <Route
          path="/forecasts/:id"
          element={
            <ForecastResultPage />
          }
        />

        <Route
          path="/datasets/:id"
          element={
            <DatasetQualityPage />
          }
        />
      </Routes>
    );
  };

export default App;
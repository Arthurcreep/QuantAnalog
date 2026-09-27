import { Link, Route, Routes } from "react-router-dom";
import DatasetQualityPage from "./pages/DatasetQualityPage.jsx";
import ForecastResultPage from "./pages/ForecastResultPage.jsx";
import ForecastsPage from "./pages/ForecastsPage.jsx";

const App = () => (
  <>
    <nav className="bg-zinc-950 px-6 py-3 text-sky-300"><Link to="/">QuantLog · Прогнозы</Link></nav>
    <Routes>
      <Route path="/" element={<ForecastsPage />} />
      <Route path="/forecasts" element={<ForecastsPage />} />
      <Route path="/forecasts/:id" element={<ForecastResultPage />} />
      <Route path="/datasets/:id" element={<DatasetQualityPage />} />
      <Route path="*" element={<div className="p-8">Страница не найдена. <Link to="/">К прогнозам</Link></div>} />
    </Routes>
  </>
);

export default App;

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listForecastRuns } from "../api/forecastApi.js";

const ForecastsPage = () => {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await listForecastRuns({ signal: controller.signal });
        if (!controller.signal.aborted) setRuns(result);
      } catch (requestError) {
        if (!controller.signal.aborted) setError(requestError.response?.data?.error?.message || "Не удалось загрузить прогнозы. Проверьте соединение с сервером.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [attempt]);

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-12 text-zinc-100">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm text-zinc-400">QuantLog</p>
        <h1 className="mt-2 text-3xl font-semibold">Прогнозы</h1>
        <p className="mt-3 text-zinc-400">Последние 50 сохранённых запусков. Выберите прогноз для просмотра результатов.</p>
        {loading && <p className="mt-8" role="status">Загрузка прогнозов…</p>}
        {!loading && error && (
          <div className="mt-8 rounded-xl border border-red-900 p-6" role="alert">
            <p>{error}</p>
            <button type="button" className="mt-4 rounded bg-zinc-800 px-4 py-2" onClick={() => setAttempt((value) => value + 1)}>Повторить</button>
          </div>
        )}
        {!loading && !error && runs.length === 0 && (
          <section className="mt-8 rounded-xl border border-zinc-800 p-6">
            <h2 className="text-lg font-medium">Сохранённых прогнозов пока нет</h2>
            <p className="mt-2 text-zinc-400">После первого запуска прогноза он появится здесь.</p>
          </section>
        )}
        {!loading && !error && runs.length > 0 && (
          <ul className="mt-8 space-y-3">
            {runs.map((run) => (
              <li key={run.id} className="rounded-xl border border-zinc-800 p-5">
                <Link className="font-medium text-sky-300 hover:underline" to={`/forecasts/${run.id}`}>{run.modelId} · {run.modelTimeframe}</Link>
                <p className="mt-1 text-sm text-zinc-400">{new Date(run.issuedAt).toLocaleString("ru-RU")} · {run.target}</p>
                <Link className="mt-2 inline-block text-sm text-zinc-400 hover:underline" to={`/datasets/${run.datasetId}`}>Данные прогноза</Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
};

export default ForecastsPage;

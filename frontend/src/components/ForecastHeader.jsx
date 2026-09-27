const ForecastHeader =
    ({
        context,
        forecastRun,
        lifecycle,
    }) => {
        return (
            <header className="border-b border-zinc-800 bg-zinc-950/90">
                <div className="mx-auto max-w-7xl px-6 py-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
                                QuantLog / Forecast Result
                            </div>

                            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                                {context.instrument ||
                                    "Instrument"}
                            </h1>

                            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-400">
                                <span>
                                    Venue:{" "}
                                    <strong className="font-medium text-zinc-200">
                                        {context.venue ||
                                            "—"}
                                    </strong>
                                </span>

                                <span>
                                    Market:{" "}
                                    <strong className="font-medium text-zinc-200">
                                        {context.marketType ||
                                            "—"}
                                    </strong>
                                </span>

                                <span>
                                    Timeframe:{" "}
                                    <strong className="font-medium text-zinc-200">
                                        {forecastRun.modelTimeframe}
                                    </strong>
                                </span>

                                <span>
                                    Target:{" "}
                                    <strong className="font-medium text-zinc-200">
                                        {forecastRun.target}
                                    </strong>
                                </span>
                            </div>
                        </div>

                        <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm">
                            <div className="text-zinc-500">
                                Lifecycle
                            </div>

                            <div className="mt-1 font-medium text-emerald-400">
                                {lifecycle.status}
                            </div>
                        </div>
                    </div>
                </div>
            </header>
        );
    };

export default ForecastHeader;
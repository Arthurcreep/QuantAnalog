import {
    formatUtcDate,
} from "../utils/formatters.js";

const DatasetHeader =
    ({
        dataset,
    }) => {
        return (
            <header className="border-b border-zinc-800 bg-zinc-950/90">
                <div className="mx-auto max-w-7xl px-6 py-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
                                QuantLog / Dataset Quality
                            </div>

                            <h1 className="mt-2 text-3xl font-semibold">
                                {dataset.instrument}
                            </h1>

                            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-400">
                                <span>
                                    Venue:{" "}
                                    <strong className="text-zinc-200">
                                        {dataset.venue}
                                    </strong>
                                </span>

                                <span>
                                    Market:{" "}
                                    <strong className="text-zinc-200">
                                        {dataset.marketType}
                                    </strong>
                                </span>

                                <span>
                                    Stage:{" "}
                                    <strong className="text-zinc-200">
                                        {dataset.stage}
                                    </strong>
                                </span>

                                <span>
                                    Timeframe:{" "}
                                    <strong className="text-zinc-200">
                                        {dataset.sourceTimeframe}
                                    </strong>
                                </span>

                                <span>
                                    UTC:{" "}
                                    <strong className="text-zinc-200">
                                        {formatUtcDate(
                                            dataset.startTime
                                        )}
                                        {" — "}
                                        {formatUtcDate(
                                            dataset.endTime
                                        )}
                                    </strong>
                                </span>
                            </div>
                        </div>

                        <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3">
                            <div className="text-xs text-zinc-500">
                                Quality Status
                            </div>

                            <div className="mt-1 font-medium text-amber-400">
                                {dataset.qualityStatus}
                            </div>
                        </div>
                    </div>
                </div>
            </header>
        );
    };

export default DatasetHeader;
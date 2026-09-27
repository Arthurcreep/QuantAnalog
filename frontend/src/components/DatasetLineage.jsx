import {
    formatUtcDate,
} from "../utils/formatters.js";

const DatasetLineage =
    ({
        lineage,
    }) => {
        return (
            <section className="rounded-xl border border-zinc-800 bg-zinc-900/60">
                <div className="border-b border-zinc-800 px-5 py-4">
                    <h2 className="text-lg font-semibold">
                        Dataset Lineage
                    </h2>

                    <p className="mt-1 text-sm text-zinc-500">
                        Parents:{" "}
                        {lineage.summary.parentCount}
                        {" · "}
                        Children:{" "}
                        {lineage.summary.childCount}
                    </p>
                </div>

                <div className="space-y-8 p-5">
                    <div>
                        <h3 className="mb-3 text-sm font-medium text-zinc-300">
                            Derived datasets
                        </h3>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-zinc-800 text-xs uppercase text-zinc-500">
                                    <tr>
                                        <th className="px-3 py-3">
                                            Timeframe
                                        </th>

                                        <th className="px-3 py-3">
                                            Stage
                                        </th>

                                        <th className="px-3 py-3">
                                            Transformation
                                        </th>

                                        <th className="px-3 py-3">
                                            Incomplete
                                        </th>

                                        <th className="px-3 py-3">
                                            Quality
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {lineage.children.map(
                                        (item) => (
                                            <tr
                                                key={
                                                    item.lineage.id
                                                }
                                                className="border-b border-zinc-800/70"
                                            >
                                                <td className="px-3 py-3 font-medium">
                                                    {
                                                        item.dataset
                                                            ?.sourceTimeframe
                                                    }
                                                </td>

                                                <td className="px-3 py-3 text-zinc-400">
                                                    {
                                                        item.dataset
                                                            ?.stage
                                                    }
                                                </td>

                                                <td className="px-3 py-3 text-zinc-400">
                                                    {
                                                        item.lineage
                                                            .transformationType
                                                    }
                                                    {"@"}
                                                    {
                                                        item.lineage
                                                            .transformationVersion
                                                    }
                                                </td>

                                                <td className="px-3 py-3 font-mono text-zinc-400">
                                                    {
                                                        item.lineage
                                                            .metadata
                                                            ?.incompleteBucketCount ??
                                                        "—"
                                                    }
                                                </td>

                                                <td className="px-3 py-3 text-zinc-400">
                                                    {
                                                        item.dataset
                                                            ?.qualityStatus
                                                    }
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div>
                        <h3 className="mb-3 text-sm font-medium text-zinc-300">
                            Source datasets
                        </h3>

                        <div className="max-h-[420px] overflow-auto rounded-lg border border-zinc-800">
                            <table className="w-full text-left text-sm">
                                <thead className="sticky top-0 bg-zinc-900 text-xs uppercase text-zinc-500">
                                    <tr>
                                        <th className="px-3 py-3">
                                            Timeframe
                                        </th>

                                        <th className="px-3 py-3">
                                            Start UTC
                                        </th>

                                        <th className="px-3 py-3">
                                            End UTC
                                        </th>

                                        <th className="px-3 py-3">
                                            Quality
                                        </th>

                                        <th className="px-3 py-3">
                                            Transformation
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {lineage.parents.map(
                                        (item) => (
                                            <tr
                                                key={
                                                    item.lineage.id
                                                }
                                                className="border-t border-zinc-800"
                                            >
                                                <td className="px-3 py-3 font-medium">
                                                    {
                                                        item.dataset
                                                            ?.sourceTimeframe
                                                    }
                                                </td>

                                                <td className="px-3 py-3 text-zinc-400">
                                                    {formatUtcDate(
                                                        item.dataset
                                                            ?.startTime
                                                    )}
                                                </td>

                                                <td className="px-3 py-3 text-zinc-400">
                                                    {formatUtcDate(
                                                        item.dataset
                                                            ?.endTime
                                                    )}
                                                </td>

                                                <td className="px-3 py-3 text-zinc-400">
                                                    {
                                                        item.dataset
                                                            ?.qualityStatus
                                                    }
                                                </td>

                                                <td className="px-3 py-3 text-zinc-400">
                                                    {
                                                        item.lineage
                                                            .transformationType
                                                    }
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>
        );
    };

export default DatasetLineage;
const MetricCard =
    ({
        title,
        value,
        subtitle = null,
    }) => {
        return (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
                <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                    {title}
                </div>

                <div className="mt-3 break-words text-xl font-semibold text-zinc-100">
                    {value}
                </div>

                {subtitle && (
                    <div className="mt-2 text-xs text-zinc-500">
                        {subtitle}
                    </div>
                )}
            </div>
        );
    };

export default MetricCard;
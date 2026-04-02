import { entityMeta } from "./form-state";

export type CatalogView = "tvShows" | "seasons" | "episodes" | "watchlist";

const viewLabel: Record<CatalogView, string> = {
  tvShows: entityMeta.tvShows.title,
  seasons: entityMeta.seasons.title,
  episodes: entityMeta.episodes.title,
  watchlist: entityMeta.watchlist.title,
};

export function TopNav({
  view,
  onChange,
  counts,
}: {
  view: CatalogView;
  onChange: (next: CatalogView) => void;
  counts: Record<CatalogView, number>;
}) {
  const items: Array<{ key: CatalogView; label: string }> = [
    { key: "tvShows", label: viewLabel.tvShows },
    { key: "seasons", label: viewLabel.seasons },
    { key: "episodes", label: viewLabel.episodes },
    { key: "watchlist", label: viewLabel.watchlist },
  ];

  return (
    <nav className="glass-panel rounded-[1.75rem] p-3">
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const active = item.key === view;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              className={[
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition cursor-pointer",
                active
                  ? "border-transparent bg-[var(--accent)] text-black"
                  : "border-[var(--card-border)] bg-[var(--panel-solid)] text-[var(--foreground)] hover:-translate-y-0.5",
              ].join(" ")}
              aria-current={active ? "page" : undefined}
            >
              <span>{item.label}</span>
              <span
                className={[
                  "rounded-full px-2 py-0.5 text-[11px] font-mono uppercase tracking-[0.12em]",
                  active ? "bg-black/15 text-black" : "bg-[var(--panel-muted)] text-[var(--muted-foreground)]",
                ].join(" ")}
              >
                {counts[item.key]}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}


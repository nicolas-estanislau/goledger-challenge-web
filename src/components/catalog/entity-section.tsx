import type { AssetKey, AssetType } from "@/src/lib/goledger/types";

import type { CatalogItem } from "./form-state";
import { entityMeta } from "./form-state";
import { formatDate, formatDateTime } from "./utils";

export function EntitySection({
  assetType,
  items,
  onCreate,
  onEdit,
  onDelete,
}: {
  assetType: AssetType;
  items: CatalogItem[];
  onCreate: (assetType: AssetType) => void;
  onEdit: (assetType: AssetType, item: CatalogItem) => void;
  onDelete: (key: AssetKey) => Promise<void>;
}) {
  const meta = entityMeta[assetType];

  return (
    <section className="glass-panel overflow-hidden rounded-[1.75rem]">
      <div className={`bg-gradient-to-r ${meta.accent} px-5 py-5`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
              {items.length} items
            </p>
            <h2 className="mt-2 text-2xl font-semibold">{meta.title}</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted-foreground)]">
              {meta.blurb}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onCreate(assetType)}
            className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black hover:-translate-y-0.5 cursor-pointer"
          >
            New
          </button>
        </div>
      </div>

      <div className="space-y-3 p-4">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--card-border)] bg-[var(--panel-muted)] px-4 py-6 text-sm text-[var(--muted-foreground)]">
            No records match the current filter.
          </div>
        ) : (
          items.map((item) => (
            <article
              key={item.blockchainKey}
              className="rounded-3xl border border-[var(--card-border)] bg-[var(--panel-solid)] p-4 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <EntityCardBody item={item} />
                  <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                    Updated {formatDateTime(item.updatedAt)}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(assetType, item)}
                    className="rounded-full border border-[var(--card-border)] bg-[var(--panel-muted)] px-4 py-2 text-sm font-medium text-[var(--foreground)] cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void onDelete(item.key)}
                    className="rounded-full border border-[var(--danger-fg)]/25 bg-[var(--danger-bg)] px-4 py-2 text-sm font-medium text-[var(--danger-fg)] cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function EntityCardBody({ item }: { item: CatalogItem }) {
  if (item.kind === "tvShows") {
    return (
      <>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-xl font-semibold">{item.title}</h3>
          <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium text-[var(--accent-strong)]">
            {item.recommendedAge}+ years
          </span>
        </div>
        <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
          {item.description}
        </p>
      </>
    );
  }

  if (item.kind === "seasons") {
    return (
      <>
        <h3 className="text-xl font-semibold">{item.tvShowTitle}</h3>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Season <strong>{item.number}</strong> • Year <strong>{item.year}</strong>
        </p>
      </>
    );
  }

  if (item.kind === "episodes") {
    return (
      <>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-xl font-semibold">{item.title}</h3>
          <span className="rounded-full bg-[var(--olive)] px-3 py-1 text-xs font-medium text-black">
            Episode {item.episodeNumber}
          </span>
          {item.rating !== null ? (
            <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium text-[var(--accent-strong)]">
              Rating {item.rating}
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          {item.seasonLabel} • {formatDate(item.releaseDate)}
        </p>
        <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
          {item.description}
        </p>
      </>
    );
  }

  return (
    <>
      <h3 className="text-xl font-semibold">{item.title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
        {item.description || "No description."}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {item.tvShowTitles.length > 0 ? (
          item.tvShowTitles.map((title) => (
            <span
              key={title}
              className="rounded-full bg-[var(--foreground)] px-3 py-1 text-xs font-medium text-[var(--background)]"
            >
              {title}
            </span>
          ))
        ) : (
          <span className="rounded-full bg-[var(--panel-muted)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)]">
            Empty watchlist
          </span>
        )}
      </div>
    </>
  );
}

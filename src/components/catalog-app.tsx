"use client";

import type { Dispatch, ReactNode, SetStateAction } from "react";
import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";

import type {
  AssetKey,
  AssetType,
  CatalogData,
  EpisodeItem,
  EpisodePayload,
  SeasonItem,
  SeasonPayload,
  TvShowItem,
  TvShowPayload,
  WatchlistItem,
  WatchlistPayload,
} from "@/src/lib/goledger/types";

type ThemeMode = "system" | "light" | "dark";

type FormState = {
  tvShows: TvShowPayload;
  seasons: SeasonPayload;
  episodes: EpisodePayload;
  watchlist: WatchlistPayload;
};

type ModalState =
  | { mode: "create"; assetType: AssetType }
  | { mode: "edit"; assetType: AssetType };

type CatalogItem = TvShowItem | SeasonItem | EpisodeItem | WatchlistItem;

const emptyFormState: FormState = {
  tvShows: { title: "", description: "", recommendedAge: 12 },
  seasons: { number: 1, year: new Date().getFullYear(), tvShowKey: "" },
  episodes: {
    episodeNumber: 1,
    title: "",
    description: "",
    releaseDate: "",
    rating: null,
    seasonKey: "",
  },
  watchlist: { title: "", description: "", tvShowKeys: [] },
};

const entityMeta: Record<AssetType, { title: string; blurb: string; accent: string }> = {
  tvShows: {
    title: "TV Shows",
    blurb: "Series base catalog with identity, synopsis, and audience rating.",
    accent: "from-[var(--accent-soft)] via-transparent to-transparent",
  },
  seasons: {
    title: "Seasons",
    blurb: "Organize the timeline and map each season back to its show.",
    accent: "from-[var(--olive)]/45 via-transparent to-transparent",
  },
  episodes: {
    title: "Episodes",
    blurb: "Track launch dates, episode order, and optional ratings.",
    accent: "from-[var(--accent-soft)] via-transparent to-transparent",
  },
  watchlist: {
    title: "Watchlists",
    blurb: "Bundle favorite shows into lists ready to revisit later.",
    accent: "from-[var(--olive)]/45 via-transparent to-transparent",
  },
};

function formatDate(value: string) {
  if (!value) return "No date";

  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

function formatDateTime(value: string) {
  if (!value) return "Unknown";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function normalizeDateInput(value: string) {
  return value ? value.slice(0, 10) : "";
}

function resolveSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function cycleTheme(mode: ThemeMode): ThemeMode {
  if (mode === "system") return "light";
  if (mode === "light") return "dark";
  return "system";
}

export default function CatalogApp({ initialData }: { initialData: CatalogData }) {
  const [catalog, setCatalog] = useState(initialData);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [formState, setFormState] = useState<FormState>(emptyFormState);
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [isPending, startTransition] = useTransition();

  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  const filtered = useMemo(() => {
    if (!deferredSearch) return catalog;

    const matches = (parts: Array<string | number | null | undefined>) =>
      parts.some((part) => String(part ?? "").toLowerCase().includes(deferredSearch));

    return {
      tvShows: catalog.tvShows.filter((item) =>
        matches([item.title, item.description, item.recommendedAge]),
      ),
      seasons: catalog.seasons.filter((item) =>
        matches([item.tvShowTitle, item.number, item.year]),
      ),
      episodes: catalog.episodes.filter((item) =>
        matches([
          item.title,
          item.description,
          item.tvShowTitle,
          item.seasonLabel,
          item.episodeNumber,
        ]),
      ),
      watchlist: catalog.watchlist.filter((item) =>
        matches([item.title, item.description, item.tvShowTitles.join(" ")]),
      ),
    };
  }, [catalog, deferredSearch]);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("theme-mode");
    if (savedTheme === "system" || savedTheme === "light" || savedTheme === "dark") {
      setThemeMode(savedTheme);
    }
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const syncTheme = () => {
      const nextTheme = themeMode === "system" ? resolveSystemTheme() : themeMode;
      document.documentElement.dataset.theme = nextTheme;
      document.documentElement.style.colorScheme = nextTheme;
      setResolvedTheme(nextTheme);
    };

    if (themeMode === "system") {
      window.localStorage.removeItem("theme-mode");
    } else {
      window.localStorage.setItem("theme-mode", themeMode);
    }

    syncTheme();
    media.addEventListener("change", syncTheme);
    return () => media.removeEventListener("change", syncTheme);
  }, [themeMode]);

  async function refreshCatalog(successMessage?: string) {
    startTransition(async () => {
      try {
        setError(null);
        const response = await fetch("/api/catalog", { cache: "no-store" });
        if (!response.ok) throw new Error("Could not refresh catalog.");
        setCatalog((await response.json()) as CatalogData);
        if (successMessage) setStatus(successMessage);
      } catch (refreshError) {
        setError(
          refreshError instanceof Error
            ? refreshError.message
            : "Failed to refresh data.",
        );
      }
    });
  }

  function openCreate(assetType: AssetType) {
    setError(null);
    setStatus(null);
    setModal({ mode: "create", assetType });
    setFormState((current) => ({
      ...current,
      [assetType]:
        assetType === "seasons"
          ? {
            ...emptyFormState.seasons,
            tvShowKey: catalog.tvShows[0]?.blockchainKey ?? "",
          }
          : assetType === "episodes"
            ? {
              ...emptyFormState.episodes,
              seasonKey: catalog.seasons[0]?.blockchainKey ?? "",
            }
            : assetType === "watchlist"
              ? emptyFormState.watchlist
              : emptyFormState.tvShows,
    }));
  }

  function openEdit(assetType: AssetType, item: CatalogItem) {
    setError(null);
    setStatus(null);
    setModal({ mode: "edit", assetType });

    switch (assetType) {
      case "tvShows": {
        const tvShow = item as TvShowItem;
        setFormState((current) => ({
          ...current,
          tvShows: {
            title: tvShow.title,
            description: tvShow.description,
            recommendedAge: tvShow.recommendedAge,
          },
        }));
        return;
      }
      case "seasons": {
        const season = item as SeasonItem;
        setFormState((current) => ({
          ...current,
          seasons: {
            number: season.number,
            year: season.year,
            tvShowKey: season.tvShowKey,
          },
        }));
        return;
      }
      case "episodes": {
        const episode = item as EpisodeItem;
        setFormState((current) => ({
          ...current,
          episodes: {
            episodeNumber: episode.episodeNumber,
            title: episode.title,
            description: episode.description,
            releaseDate: normalizeDateInput(episode.releaseDate),
            rating: episode.rating,
            seasonKey: episode.seasonKey,
          },
        }));
        return;
      }
      case "watchlist": {
        const watchlist = item as WatchlistItem;
        setFormState((current) => ({
          ...current,
          watchlist: {
            title: watchlist.title,
            description: watchlist.description,
            tvShowKeys: watchlist.tvShowKeys,
          },
        }));
      }
    }
  }

  async function persistAsset() {
    if (!modal) return;

    try {
      setError(null);
      setStatus(null);
      const response = await fetch("/api/assets", {
        method: modal.mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetType: modal.assetType,
          values: formState[modal.assetType],
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message ?? "Could not save the asset.");
      }

      setModal(null);
      await refreshCatalog(modal.mode === "create" ? "Asset created." : "Asset updated.");
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Could not save the asset.",
      );
    }
  }

  async function removeAsset(key: AssetKey) {
    try {
      setError(null);
      setStatus(null);
      const response = await fetch("/api/assets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message ?? "Could not remove the asset.");
      }

      await refreshCatalog("Asset removed.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete the asset.",
      );
    }
  }

  const stats = [
    { label: "TV shows", value: catalog.tvShows.length },
    { label: "Seasons", value: catalog.seasons.length },
    { label: "Episodes", value: catalog.episodes.length },
    { label: "Watchlists", value: catalog.watchlist.length },
  ];

  return (
    <main className="film-grid min-h-screen px-4 py-6 text-[var(--foreground)] sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="glass-panel relative overflow-hidden rounded-[2rem] px-6 py-7 sm:px-8">
          <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-[var(--accent-soft)] to-transparent blur-2xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <span className="inline-flex rounded-full border border-[var(--card-border)] bg-[var(--panel-solid)] px-3 py-1 font-mono text-xs uppercase tracking-[0.28em] text-[var(--muted-foreground)]">
                GoLedger challenge
              </span>
              <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">ScreenVault</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)] sm:text-base">
                A cinematic control room to manage TV shows, seasons, episodes, and
                watchlists on the blockchain API.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-[var(--card-border)] bg-[var(--panel-solid)] px-4 py-3 shadow-sm"
                >
                  <div className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                    {stat.label}
                  </div>
                  <div className="mt-2 text-3xl font-semibold">{stat.value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="glass-panel rounded-[1.75rem] p-5">
            <label className="text-xs font-medium uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
              Search everything
            </label>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Try a title, season, episode, rating..."
              className="mt-3 w-full rounded-2xl border border-[var(--card-border)] bg-[var(--panel-solid)] px-4 py-3 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)] focus:border-[var(--accent)]"
            />
          </div>

          <div className="glass-panel rounded-[1.75rem] p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-medium uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
                Sync status
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setThemeMode((current) => cycleTheme(current))}
                  className="rounded-full border border-[var(--card-border)] bg-[var(--panel-solid)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] hover:-translate-y-0.5"
                >
                  Theme: {themeMode === "system" ? `System (${resolvedTheme})` : themeMode}
                </button>
                <button
                  type="button"
                  onClick={() => void refreshCatalog("Catalog synchronized.")}
                  className="rounded-full border border-[var(--card-border)] bg-[var(--panel-solid)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] hover:-translate-y-0.5"
                >
                  Refresh
                </button>
              </div>
            </div>

            <p className="mt-3 text-sm text-[var(--muted-foreground)]">
              {isPending
                ? "Refreshing data from GoLedger..."
                : "Mutations are proxied through Next.js so Basic Auth stays on the server."}
            </p>

            {status ? (
              <p className="mt-3 rounded-2xl bg-[var(--success-bg)] px-3 py-2 text-sm text-[var(--success-fg)]">
                {status}
              </p>
            ) : null}

            {error ? (
              <p className="mt-3 rounded-2xl bg-[var(--danger-bg)] px-3 py-2 text-sm text-[var(--danger-fg)]">
                {error}
              </p>
            ) : null}
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <EntitySection
            assetType="tvShows"
            items={filtered.tvShows}
            onCreate={openCreate}
            onEdit={openEdit}
            onDelete={removeAsset}
          />
          <EntitySection
            assetType="seasons"
            items={filtered.seasons}
            onCreate={openCreate}
            onEdit={openEdit}
            onDelete={removeAsset}
          />
          <EntitySection
            assetType="episodes"
            items={filtered.episodes}
            onCreate={openCreate}
            onEdit={openEdit}
            onDelete={removeAsset}
          />
          <EntitySection
            assetType="watchlist"
            items={filtered.watchlist}
            onCreate={openCreate}
            onEdit={openEdit}
            onDelete={removeAsset}
          />
        </section>
      </div>

      {modal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-sm">
          <div className="glass-panel max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] p-6 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
                  {modal.mode === "create" ? "Create asset" : "Edit asset"}
                </p>
                <h2 className="mt-2 text-3xl font-semibold">
                  {entityMeta[modal.assetType].title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-full border border-[var(--card-border)] bg-[var(--panel-solid)] px-3 py-1.5 text-sm text-[var(--foreground)]"
              >
                Close
              </button>
            </div>

            <div className="mt-6">
              <AssetForm
                assetType={modal.assetType}
                mode={modal.mode}
                formState={formState}
                setFormState={setFormState}
                catalog={catalog}
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-full border border-[var(--card-border)] bg-[var(--panel-solid)] px-4 py-2 text-sm font-medium text-[var(--foreground)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void persistAsset()}
                className="rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-black hover:bg-[var(--accent-strong)]"
              >
                {modal.mode === "create" ? "Save asset" : "Update asset"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function EntitySection({
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
            className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black hover:-translate-y-0.5"
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
                    className="rounded-full border border-[var(--card-border)] bg-[var(--panel-muted)] px-4 py-2 text-sm font-medium text-[var(--foreground)]"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void onDelete(item.key)}
                    className="rounded-full border border-[var(--danger-fg)]/25 bg-[var(--danger-bg)] px-4 py-2 text-sm font-medium text-[var(--danger-fg)]"
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

function AssetForm({
  assetType,
  mode,
  formState,
  setFormState,
  catalog,
}: {
  assetType: AssetType;
  mode: "create" | "edit";
  formState: FormState;
  setFormState: Dispatch<SetStateAction<FormState>>;
  catalog: CatalogData;
}) {
  const fieldClassName =
    "mt-2 w-full rounded-2xl border border-[var(--card-border)] bg-[var(--panel-solid)] px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]";

  const keyFieldHint =
    mode === "edit"
      ? "Primary key fields are locked during edits to preserve blockchain identity."
      : null;

  if (assetType === "tvShows") {
    const values = formState.tvShows;

    return (
      <div className="grid gap-4">
        <Field label="Title" hint={keyFieldHint}>
          <input
            value={values.title}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                tvShows: { ...current.tvShows, title: event.target.value },
              }))
            }
            disabled={mode === "edit"}
            className={fieldClassName}
          />
        </Field>

        <Field label="Recommended age">
          <input
            type="number"
            min={0}
            value={values.recommendedAge ?? ""}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                tvShows: {
                  ...current.tvShows,
                  recommendedAge: Number(event.target.value),
                },
              }))
            }
            className={fieldClassName}
          />
        </Field>

        <Field label="Description">
          <textarea
            rows={5}
            value={values.description}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                tvShows: { ...current.tvShows, description: event.target.value },
              }))
            }
            className={fieldClassName}
          />
        </Field>
      </div>
    );
  }

  if (assetType === "seasons") {
    const values = formState.seasons;

    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="TV show" hint={keyFieldHint}>
          <select
            value={values.tvShowKey}
            disabled={mode === "edit"}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                seasons: { ...current.seasons, tvShowKey: event.target.value },
              }))
            }
            className={fieldClassName}
          >
            {catalog.tvShows.map((show) => (
              <option key={show.blockchainKey} value={show.blockchainKey}>
                {show.title}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Season number" hint={keyFieldHint}>
          <input
            type="number"
            min={1}
            disabled={mode === "edit"}
            value={values.number}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                seasons: { ...current.seasons, number: Number(event.target.value) },
              }))
            }
            className={fieldClassName}
          />
        </Field>

        <Field label="Release year">
          <input
            type="number"
            value={values.year}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                seasons: { ...current.seasons, year: Number(event.target.value) },
              }))
            }
            className={fieldClassName}
          />
        </Field>
      </div>
    );
  }

  if (assetType === "episodes") {
    const values = formState.episodes;

    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Season" hint={keyFieldHint}>
          <select
            value={values.seasonKey}
            disabled={mode === "edit"}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                episodes: { ...current.episodes, seasonKey: event.target.value },
              }))
            }
            className={fieldClassName}
          >
            {catalog.seasons.map((season) => (
              <option key={season.blockchainKey} value={season.blockchainKey}>
                {season.tvShowTitle} • Season {season.number}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Episode number" hint={keyFieldHint}>
          <input
            type="number"
            min={1}
            disabled={mode === "edit"}
            value={values.episodeNumber}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                episodes: {
                  ...current.episodes,
                  episodeNumber: Number(event.target.value),
                },
              }))
            }
            className={fieldClassName}
          />
        </Field>

        <Field label="Title">
          <input
            value={values.title}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                episodes: { ...current.episodes, title: event.target.value },
              }))
            }
            className={fieldClassName}
          />
        </Field>

        <Field label="Release date">
          <input
            type="date"
            value={values.releaseDate}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                episodes: { ...current.episodes, releaseDate: event.target.value },
              }))
            }
            className={fieldClassName}
          />
        </Field>

        <Field label="Rating">
          <input
            type="number"
            min={0}
            max={10}
            step="0.1"
            value={values.rating ?? ""}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                episodes: {
                  ...current.episodes,
                  rating: event.target.value === "" ? null : Number(event.target.value),
                },
              }))
            }
            className={fieldClassName}
          />
        </Field>

        <div className="sm:col-span-2">
          <Field label="Description">
            <textarea
              rows={5}
              value={values.description}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  episodes: { ...current.episodes, description: event.target.value },
                }))
              }
              className={fieldClassName}
            />
          </Field>
        </div>
      </div>
    );
  }

  const values = formState.watchlist;

  return (
    <div className="grid gap-4">
      <Field label="Title" hint={keyFieldHint}>
        <input
          value={values.title}
          disabled={mode === "edit"}
          onChange={(event) =>
            setFormState((current) => ({
              ...current,
              watchlist: { ...current.watchlist, title: event.target.value },
            }))
          }
          className={fieldClassName}
        />
      </Field>

      <Field label="Description">
        <textarea
          rows={4}
          value={values.description}
          onChange={(event) =>
            setFormState((current) => ({
              ...current,
              watchlist: { ...current.watchlist, description: event.target.value },
            }))
          }
          className={fieldClassName}
        />
      </Field>

      <Field label="Included TV shows">
        <div className="mt-2 grid gap-2 rounded-3xl border border-[var(--card-border)] bg-[var(--panel-muted)] p-3">
          {catalog.tvShows.map((show) => {
            const checked = values.tvShowKeys.includes(show.blockchainKey);

            return (
              <label
                key={show.blockchainKey}
                className="flex cursor-pointer items-center justify-between rounded-2xl border border-transparent px-3 py-2 hover:border-[var(--card-border)] hover:bg-[var(--panel-solid)]"
              >
                <span className="text-sm text-[var(--foreground)]">{show.title}</span>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    setFormState((current) => ({
                      ...current,
                      watchlist: {
                        ...current.watchlist,
                        tvShowKeys: checked
                          ? current.watchlist.tvShowKeys.filter(
                            (key) => key !== show.blockchainKey,
                          )
                          : [...current.watchlist.tvShowKeys, show.blockchainKey],
                      },
                    }))
                  }
                />
              </label>
            );
          })}
        </div>
      </Field>
    </div>
  );
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string | null;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-[var(--foreground)]">{label}</span>
      {children}
      {hint ? <p className="mt-2 text-xs text-[var(--muted-foreground)]">{hint}</p> : null}
    </label>
  );
}

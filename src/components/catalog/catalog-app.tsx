"use client";

import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";

import type {
  AssetKey,
  AssetType,
  CatalogData,
  EpisodeItem,
  SeasonItem,
  TvShowItem,
  WatchlistItem,
} from "@/src/lib/goledger/types";

import { AssetForm } from "./asset-form";
import type { CatalogItem, FormState, ModalState, ThemeMode } from "./form-state";
import { emptyFormState, entityMeta } from "./form-state";
import { EpisodesScreen } from "./screens/episodes-screen";
import { SeasonsScreen } from "./screens/seasons-screen";
import { TvShowsScreen } from "./screens/tvshows-screen";
import { WatchlistScreen } from "./screens/watchlist-screen";
import type { CatalogView } from "./top-nav";
import { TopNav } from "./top-nav";
import { normalizeDateInput, resolveSystemTheme } from "./utils";

export default function CatalogApp({ initialData }: { initialData: CatalogData }) {
  const [catalog, setCatalog] = useState(initialData);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [formState, setFormState] = useState<FormState>(emptyFormState);
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [isPending, startTransition] = useTransition();
  const [view, setView] = useState<CatalogView>("tvShows");

  // Evita travar a UI ao digitar (debounce visual com React)
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

  // Carrega preferência de tema salva no localStorage
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

  // Fecha o modal ao pressionar ESC
  useEffect(() => {
    if (!modal) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setModal(null);
    }

    window.addEventListener("keydown", onKeyDown);
    // Remove o listener ao desmontar ou atualizar
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modal]);

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

  const navCounts: Record<CatalogView, number> = {
    tvShows: catalog.tvShows.length,
    seasons: catalog.seasons.length,
    episodes: catalog.episodes.length,
    watchlist: catalog.watchlist.length,
  };

  return (
    <main className="film-grid min-h-screen px-4 py-6 text-[var(--foreground)] sm:px-6 lg:px-10">

      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex justify-end">
          <div
            className="theme-toggle inline-grid grid-cols-3 gap-0.5 rounded-full p-0.75"
            role="radiogroup"
            aria-label="Tema do site"
          >
            <div className="relative rounded-full p-1.5 *:size-7 has-checked:bg-white has-checked:ring has-checked:inset-ring has-checked:ring-gray-950/10 has-checked:inset-ring-white/10 sm:p-0 dark:has-checked:bg-gray-600 dark:has-checked:text-white dark:has-checked:ring-transparent">
              <input
                type="radio"
                className="absolute inset-0 cursor-pointer appearance-none"
                name="theme-mode"
                aria-label="Tema do sistema"
                value="system"
                checked={themeMode === "system"}
                onChange={() => setThemeMode("system")}
              />
              <svg viewBox="0 0 28 28" fill="none" aria-hidden>
                <path
                  d="M7.5 8.5C7.5 7.94772 7.94772 7.5 8.5 7.5H19.5C20.0523 7.5 20.5 7.94772 20.5 8.5V16.5C20.5 17.0523 20.0523 17.5 19.5 17.5H8.5C7.94772 17.5 7.5 17.0523 7.5 16.5V8.5Z"
                  stroke="currentColor"
                />
                <path
                  d="M7.5 8.5C7.5 7.94772 7.94772 7.5 8.5 7.5H19.5C20.0523 7.5 20.5 7.94772 20.5 8.5V14.5C20.5 15.0523 20.0523 15.5 19.5 15.5H8.5C7.94772 15.5 7.5 15.0523 7.5 14.5V8.5Z"
                  stroke="currentColor"
                />
                <path
                  d="M16.5 20.5V17.5H11.5V20.5M16.5 20.5H11.5M16.5 20.5H17.5M11.5 20.5H10.5"
                  stroke="currentColor"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="relative rounded-full p-1.5 *:size-7 has-checked:bg-white has-checked:ring has-checked:inset-ring has-checked:ring-gray-950/10 has-checked:inset-ring-white/10 sm:p-0 dark:has-checked:bg-gray-600 dark:has-checked:text-white dark:has-checked:ring-transparent">
              <input
                type="radio"
                className="absolute inset-0 cursor-pointer appearance-none"
                name="theme-mode"
                aria-label="Tema claro"
                value="light"
                checked={themeMode === "light"}
                onChange={() => setThemeMode("light")}
              />
              <svg viewBox="0 0 28 28" fill="none" aria-hidden>
                <circle cx="14" cy="14" r="3.5" stroke="currentColor" />
                <path d="M14 8.5V6.5" stroke="currentColor" strokeLinecap="round" />
                <path d="M17.889 10.1115L19.3032 8.69727" stroke="currentColor" strokeLinecap="round" />
                <path d="M19.5 14L21.5 14" stroke="currentColor" strokeLinecap="round" />
                <path d="M17.889 17.8885L19.3032 19.3027" stroke="currentColor" strokeLinecap="round" />
                <path d="M14 21.5V19.5" stroke="currentColor" strokeLinecap="round" />
                <path d="M8.69663 19.3029L10.1108 17.8887" stroke="currentColor" strokeLinecap="round" />
                <path d="M6.5 14L8.5 14" stroke="currentColor" strokeLinecap="round" />
                <path d="M8.69663 8.69711L10.1108 10.1113" stroke="currentColor" strokeLinecap="round" />
              </svg>
            </div>
            <div className="relative rounded-full p-1.5 *:size-7 has-checked:bg-white has-checked:ring has-checked:inset-ring has-checked:ring-gray-950/10 has-checked:inset-ring-white/10 sm:p-0 dark:has-checked:bg-gray-600 dark:has-checked:text-white dark:has-checked:ring-transparent">
              <input
                type="radio"
                className="absolute inset-0 cursor-pointer appearance-none"
                name="theme-mode"
                aria-label="Tema escuro"
                value="dark"
                checked={themeMode === "dark"}
                onChange={() => setThemeMode("dark")}
              />
              <svg viewBox="0 0 28 28" fill="none" aria-hidden>
                <path
                  d="M10.5 9.99914C10.5 14.1413 13.8579 17.4991 18 17.4991C19.0332 17.4991 20.0176 17.2902 20.9132 16.9123C19.7761 19.6075 17.109 21.4991 14 21.4991C9.85786 21.4991 6.5 18.1413 6.5 13.9991C6.5 10.8902 8.39167 8.22304 11.0868 7.08594C10.7089 7.98159 10.5 8.96597 10.5 9.99914Z"
                  stroke="currentColor"
                  strokeLinejoin="round"
                />
                <path
                  d="M16.3561 6.50754L16.5 5.5L16.6439 6.50754C16.7068 6.94752 17.0525 7.29321 17.4925 7.35607L18.5 7.5L17.4925 7.64393C17.0525 7.70679 16.7068 8.05248 16.6439 8.49246L16.5 9.5L16.3561 8.49246C16.2932 8.05248 15.9475 7.70679 15.5075 7.64393L14.5 7.5L15.5075 7.35607C15.9475 7.29321 16.2932 6.94752 16.3561 6.50754Z"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M20.3561 11.5075L20.5 10.5L20.6439 11.5075C20.7068 11.9475 21.0525 12.2932 21.4925 12.3561L22.5 12.5L21.4925 12.6439C21.0525 12.7068 20.7068 13.0525 20.6439 13.4925L20.5 14.5L20.3561 13.4925C20.2932 13.0525 19.9475 12.7068 19.5075 12.6439L18.5 12.5L19.5075 12.3561C19.9475 12.2932 20.2932 11.9475 20.3561 11.5075Z"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

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
                  onClick={() => void refreshCatalog("Catalog synchronized.")}
                  className="rounded-full border border-[var(--card-border)] bg-[var(--panel-solid)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] hover:-translate-y-0.5 cursor-pointer"
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

        <TopNav view={view} onChange={setView} counts={navCounts} />

        <section className="grid gap-5">
          {view === "tvShows" ? (
            <TvShowsScreen
              items={filtered.tvShows}
              onCreate={() => openCreate("tvShows")}
              onEdit={(item) => openEdit("tvShows", item)}
              onDelete={removeAsset}
            />
          ) : null}
          {view === "seasons" ? (
            <SeasonsScreen
              items={filtered.seasons}
              onCreate={() => openCreate("seasons")}
              onEdit={(item) => openEdit("seasons", item)}
              onDelete={removeAsset}
            />
          ) : null}
          {view === "episodes" ? (
            <EpisodesScreen
              items={filtered.episodes}
              onCreate={() => openCreate("episodes")}
              onEdit={(item) => openEdit("episodes", item)}
              onDelete={removeAsset}
            />
          ) : null}
          {view === "watchlist" ? (
            <WatchlistScreen
              items={filtered.watchlist}
              onCreate={() => openCreate("watchlist")}
              onEdit={(item) => openEdit("watchlist", item)}
              onDelete={removeAsset}
            />
          ) : null}
        </section>
      </div>

      {modal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-sm"
          onClick={() => setModal(null)}
          role="presentation"
        >
          <div
            className="glass-panel max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] p-6 sm:p-7"
            onClick={(event) => event.stopPropagation()}
          >
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
                className="rounded-full border border-[var(--card-border)] bg-[var(--panel-solid)] px-3 py-1.5 text-sm text-[var(--foreground)] cursor-pointer"
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
                className="rounded-full border border-[var(--card-border)] bg-[var(--panel-solid)] px-4 py-2 text-sm font-medium text-[var(--foreground)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void persistAsset()}
                className="rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-black hover:bg-[var(--accent-strong)] cursor-pointer"
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

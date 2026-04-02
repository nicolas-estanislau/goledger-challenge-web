import type {
  AssetType,
  EpisodeItem,
  EpisodePayload,
  SeasonItem,
  SeasonPayload,
  TvShowItem,
  TvShowPayload,
  WatchlistItem,
  WatchlistPayload,
} from "@/src/lib/goledger/types";

export type ThemeMode = "system" | "light" | "dark";

export type FormState = {
  tvShows: TvShowPayload;
  seasons: SeasonPayload;
  episodes: EpisodePayload;
  watchlist: WatchlistPayload;
};

export type ModalState =
  | { mode: "create"; assetType: AssetType }
  | { mode: "edit"; assetType: AssetType };

export type CatalogItem = TvShowItem | SeasonItem | EpisodeItem | WatchlistItem;

export const emptyFormState: FormState = {
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

export const entityMeta: Record<
  AssetType,
  { title: string; blurb: string; accent: string }
> = {
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

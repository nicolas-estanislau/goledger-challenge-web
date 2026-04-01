export type AssetType = "tvShows" | "seasons" | "episodes" | "watchlist";

export type AssetRef = {
  "@assetType": "tvShows" | "seasons";
  "@key": string;
};

export type TvShowKey = {
  "@assetType": "tvShows";
  title: string;
};

export type SeasonKey = {
  "@assetType": "seasons";
  number: number;
  tvShow: AssetRef;
};

export type EpisodeKey = {
  "@assetType": "episodes";
  episodeNumber: number;
  season: AssetRef;
};

export type WatchlistKey = {
  "@assetType": "watchlist";
  title: string;
};

export type AssetKey = TvShowKey | SeasonKey | EpisodeKey | WatchlistKey;

export type TvShowItem = {
  kind: "tvShows";
  blockchainKey: string;
  key: TvShowKey;
  title: string;
  description: string;
  recommendedAge: number;
  updatedAt: string;
};

export type SeasonItem = {
  kind: "seasons";
  blockchainKey: string;
  key: SeasonKey;
  number: number;
  year: number;
  tvShowKey: string;
  tvShowTitle: string;
  updatedAt: string;
};

export type EpisodeItem = {
  kind: "episodes";
  blockchainKey: string;
  key: EpisodeKey;
  episodeNumber: number;
  title: string;
  description: string;
  releaseDate: string;
  rating: number | null;
  seasonKey: string;
  seasonLabel: string;
  tvShowTitle: string;
  updatedAt: string;
};

export type WatchlistItem = {
  kind: "watchlist";
  blockchainKey: string;
  key: WatchlistKey;
  title: string;
  description: string;
  tvShowKeys: string[];
  tvShowTitles: string[];
  updatedAt: string;
};

export type CatalogData = {
  tvShows: TvShowItem[];
  seasons: SeasonItem[];
  episodes: EpisodeItem[];
  watchlist: WatchlistItem[];
};

export type TvShowPayload = {
  title: string;
  description: string;
  recommendedAge: number;
};

export type SeasonPayload = {
  number: number;
  year: number;
  tvShowKey: string;
};

export type EpisodePayload = {
  episodeNumber: number;
  title: string;
  description: string;
  releaseDate: string;
  rating: number | null;
  seasonKey: string;
};

export type WatchlistPayload = {
  title: string;
  description: string;
  tvShowKeys: string[];
};

export type AssetPayloadMap = {
  tvShows: TvShowPayload;
  seasons: SeasonPayload;
  episodes: EpisodePayload;
  watchlist: WatchlistPayload;
};

export function createAssetRef(
  assetType: "tvShows" | "seasons",
  blockchainKey: string,
): AssetRef {
  return {
    "@assetType": assetType,
    "@key": blockchainKey,
  };
}

export function createTvShowKey(title: string): TvShowKey {
  return {
    "@assetType": "tvShows",
    title,
  };
}

export function createSeasonKey(number: number, tvShowKey: string): SeasonKey {
  return {
    "@assetType": "seasons",
    number,
    tvShow: createAssetRef("tvShows", tvShowKey),
  };
}

export function createEpisodeKey(
  episodeNumber: number,
  seasonKey: string,
): EpisodeKey {
  return {
    "@assetType": "episodes",
    episodeNumber,
    season: createAssetRef("seasons", seasonKey),
  };
}

export function createWatchlistKey(title: string): WatchlistKey {
  return {
    "@assetType": "watchlist",
    title,
  };
}

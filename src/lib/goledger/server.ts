import "server-only";

import type {
  AssetKey,
  AssetPayloadMap,
  AssetType,
  CatalogData,
  EpisodeItem,
  SeasonItem,
  TvShowItem,
  WatchlistItem,
} from "@/src/lib/goledger/types";
import {
  createAssetRef,
  createEpisodeKey,
  createSeasonKey,
  createTvShowKey,
  createWatchlistKey,
} from "@/src/lib/goledger/types";

type RawAsset = {
  "@assetType": AssetType;
  "@key": string;
  "@lastUpdated"?: string;
  title?: string;
  description?: string;
  recommendedAge?: number;
  number?: number;
  year?: number;
  tvShow?: {
    "@assetType": "tvShows";
    "@key": string;
  };
  episodeNumber?: number;
  releaseDate?: string;
  rating?: number;
  season?: {
    "@assetType": "seasons";
    "@key": string;
  };
  tvShows?: Array<{
    "@assetType": "tvShows";
    "@key": string;
  }>;
};

type SearchResponse = {
  result: RawAsset[];
};

const apiBaseUrl =
  process.env.GOLEDGER_API_BASE_URL ??
  "http://ec2-50-19-36-138.compute-1.amazonaws.com";

function getAuthHeader() {
  // GoLedger usa autenticação Basic via env vars.
  // Isso é necessário porque a API não suporta OAuth/JWT.
  const username = process.env.GOLEDGER_API_USERNAME;
  const password = process.env.GOLEDGER_API_PASSWORD;

  if (!username || !password) {
    throw new Error(
      "Missing GOLEDGER_API_USERNAME or GOLEDGER_API_PASSWORD environment variables.",
    );
  }

  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
}

async function goledgerFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "*/*",
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `GoLedger request failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

async function searchAssets(assetType: AssetType) {
  const response = await goledgerFetch<SearchResponse>("/api/query/search", {
    method: "POST",
    body: JSON.stringify({
      query: {
        selector: {
          "@assetType": assetType,
        },
      },
    }),
  });

  return response.result;
}

// Orquestra a agregação de dados vindos da API GoLedger.
// A API retorna dados desnormalizados (sem joins),
// então aqui fazemos:
// - fetch paralelo de todos os assets
// - criação de mapas para lookup (tvShows, seasons)
// - enriquecimento dos dados (ex: seasonLabel, tvShowTitle)
// - ordenação para consumo na UI
export async function getCatalogData(): Promise<CatalogData> {
  const [tvShowsRaw, seasonsRaw, episodesRaw, watchlistRaw] = await Promise.all([
    searchAssets("tvShows"),
    searchAssets("seasons"),
    searchAssets("episodes"),
    searchAssets("watchlist"),
  ]);

  const tvShows = tvShowsRaw
    .map<TvShowItem>((item) => ({
      kind: "tvShows",
      blockchainKey: item["@key"],
      key: createTvShowKey(item.title ?? ""),
      title: item.title ?? "",
      description: item.description ?? "",
      recommendedAge: item.recommendedAge ?? 0,
      updatedAt: item["@lastUpdated"] ?? "",
    }))
    .sort((left, right) => left.title.localeCompare(right.title));

  const tvShowMap = new Map(tvShows.map((item) => [item.blockchainKey, item]));

  const seasons = seasonsRaw
    .map<SeasonItem>((item) => {
      const tvShowKey = item.tvShow?.["@key"] ?? "";
      const tvShow = tvShowMap.get(tvShowKey);

      return {
        kind: "seasons",
        blockchainKey: item["@key"],
        key: createSeasonKey(item.number ?? 0, tvShowKey),
        number: item.number ?? 0,
        year: item.year ?? 0,
        tvShowKey,
        tvShowTitle: tvShow?.title ?? "TV show not found",
        updatedAt: item["@lastUpdated"] ?? "",
      };
    })
    .sort(
      (left, right) =>
        left.tvShowTitle.localeCompare(right.tvShowTitle) ||
        left.number - right.number,
    );

  const seasonMap = new Map(seasons.map((item) => [item.blockchainKey, item]));

  const episodes = episodesRaw
    .map<EpisodeItem>((item) => {
      const seasonKey = item.season?.["@key"] ?? "";
      const season = seasonMap.get(seasonKey);

      return {
        kind: "episodes",
        blockchainKey: item["@key"],
        key: createEpisodeKey(item.episodeNumber ?? 0, seasonKey),
        episodeNumber: item.episodeNumber ?? 0,
        title: item.title ?? "",
        description: item.description ?? "",
        releaseDate: item.releaseDate ?? "",
        rating: typeof item.rating === "number" ? item.rating : null,
        seasonKey,
        seasonLabel: season
          ? `${season.tvShowTitle} • Season ${season.number}`
          : "Season not found",
        tvShowTitle: season?.tvShowTitle ?? "TV show not found",
        updatedAt: item["@lastUpdated"] ?? "",
      };
    })
    .sort(
      (left, right) =>
        left.tvShowTitle.localeCompare(right.tvShowTitle) ||
        left.seasonLabel.localeCompare(right.seasonLabel) ||
        left.episodeNumber - right.episodeNumber,
    );

  const watchlist = watchlistRaw
    .map<WatchlistItem>((item) => {
      const tvShowKeys = (item.tvShows ?? []).map((show) => show["@key"]);

      return {
        kind: "watchlist",
        blockchainKey: item["@key"],
        key: createWatchlistKey(item.title ?? ""),
        title: item.title ?? "",
        description: item.description ?? "",
        tvShowKeys,
        tvShowTitles: tvShowKeys.map(
          (showKey) => tvShowMap.get(showKey)?.title ?? "TV show not found",
        ),
        updatedAt: item["@lastUpdated"] ?? "",
      };
    })
    .sort((left, right) => left.title.localeCompare(right.title));

  return {
    tvShows,
    seasons,
    episodes,
    watchlist,
  };
}

export function createAssetPayload<T extends AssetType>(
  assetType: T,
  values: AssetPayloadMap[T],
) {
  switch (assetType) {
    case "tvShows": {
      const tvShow = values as AssetPayloadMap["tvShows"];
      return {
        "@assetType": "tvShows",
        title: tvShow.title.trim(),
        description: tvShow.description.trim(),
        recommendedAge: Number(tvShow.recommendedAge),
      };
    }
    case "seasons": {
      const season = values as AssetPayloadMap["seasons"];
      return {
        "@assetType": "seasons",
        number: Number(season.number),
        year: Number(season.year),
        tvShow: createAssetRef("tvShows", season.tvShowKey),
      };
    }
    case "episodes": {
      const episode = values as AssetPayloadMap["episodes"];
      return {
        "@assetType": "episodes",
        episodeNumber: Number(episode.episodeNumber),
        title: episode.title.trim(),
        description: episode.description.trim(),
        // API exige data em formato ISO string
        releaseDate: new Date(episode.releaseDate).toISOString(),
        rating:
          episode.rating === null || episode.rating === undefined
            ? undefined
            : Number(episode.rating),
        season: createAssetRef("seasons", episode.seasonKey),
      };
    }
    case "watchlist": {
      const watchlist = values as AssetPayloadMap["watchlist"];
      return {
        "@assetType": "watchlist",
        title: watchlist.title.trim(),
        description: watchlist.description.trim(),
        tvShows: watchlist.tvShowKeys.map((showKey: string) =>
          createAssetRef("tvShows", showKey),
        ),
      };
    }
  }
}

export async function createAsset<T extends AssetType>(
  assetType: T,
  values: AssetPayloadMap[T],
) {
  return goledgerFetch("/api/invoke/createAsset", {
    method: "POST",
    body: JSON.stringify({
      asset: [createAssetPayload(assetType, values)],
    }),
  });
}

export async function updateAsset<T extends AssetType>(
  assetType: T,
  values: AssetPayloadMap[T],
) {
  return goledgerFetch("/api/invoke/updateAsset", {
    method: "PUT",
    body: JSON.stringify({
      update: createAssetPayload(assetType, values),
    }),
  });
}

export async function deleteAsset(key: AssetKey) {
  return goledgerFetch("/api/invoke/deleteAsset", {
    method: "DELETE",
    body: JSON.stringify({
      key,
    }),
  });
}

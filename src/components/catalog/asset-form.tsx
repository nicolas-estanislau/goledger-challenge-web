import type { Dispatch, SetStateAction } from "react";

import type { AssetType, CatalogData } from "@/src/lib/goledger/types";

import { Field } from "./field";
import type { FormState } from "./form-state";

export function AssetForm({
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

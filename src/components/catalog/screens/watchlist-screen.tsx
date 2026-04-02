import type { AssetKey } from "@/src/lib/goledger/types";

import type { CatalogItem } from "../form-state";
import { EntitySection } from "../entity-section";

export function WatchlistScreen({
  items,
  onCreate,
  onEdit,
  onDelete,
}: {
  items: CatalogItem[];
  onCreate: () => void;
  onEdit: (item: CatalogItem) => void;
  onDelete: (key: AssetKey) => Promise<void>;
}) {
  return (
    <EntitySection
      assetType="watchlist"
      items={items}
      onCreate={() => onCreate()}
      onEdit={(_, item) => onEdit(item)}
      onDelete={onDelete}
    />
  );
}


import type { AssetKey } from "@/src/lib/goledger/types";

import type { CatalogItem } from "../form-state";
import { EntitySection } from "../entity-section";

export function EpisodesScreen({
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
      assetType="episodes"
      items={items}
      onCreate={() => onCreate()}
      onEdit={(_, item) => onEdit(item)}
      onDelete={onDelete}
    />
  );
}


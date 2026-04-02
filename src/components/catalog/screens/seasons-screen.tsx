import type { AssetKey } from "@/src/lib/goledger/types";

import type { CatalogItem } from "../form-state";
import { EntitySection } from "../entity-section";

export function SeasonsScreen({
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
      assetType="seasons"
      items={items}
      onCreate={() => onCreate()}
      onEdit={(_, item) => onEdit(item)}
      onDelete={onDelete}
    />
  );
}


import CatalogApp from "@/src/components/catalog-app";
import { getCatalogData } from "@/src/lib/goledger/server";

/**
 * Server-rendered home: `getCatalogData()` runs once per request on the server
 * (same four GoLedger search queries and normalization as `GET /api/catalog`,
 * which the client calls on Refresh).
 */
export default async function Home() {
  const initialData = await getCatalogData();

  return <CatalogApp initialData={initialData} />;
}

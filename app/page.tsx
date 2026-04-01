import CatalogApp from "@/src/components/catalog-app";
import { getCatalogData } from "@/src/lib/goledger/server";

export default async function Home() {
  const initialData = await getCatalogData();

  return <CatalogApp initialData={initialData} />;
}

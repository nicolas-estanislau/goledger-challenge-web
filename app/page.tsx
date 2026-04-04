import CatalogApp from "@/src/components/catalog/catalog-app";
import { getCatalogData } from "@/src/lib/goledger/server";
/**

* Página inicial renderizada no servidor: `getCatalogData()` é executada uma vez por solicitação no servidor
* (as mesmas quatro consultas de pesquisa GoLedger e normalização `GET /api/catalog`,

* que o cliente chama ao atualizar a página).

*/
export default async function Home() {
  const initialData = await getCatalogData();

  return <CatalogApp initialData={initialData} />;
}

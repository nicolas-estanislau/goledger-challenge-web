import { NextResponse } from "next/server";

import { getCatalogData } from "@/src/lib/goledger/server";

export async function GET() {
  try {
    const data = await getCatalogData();
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load catalog";

    return NextResponse.json({ message }, { status: 500 });
  }
}

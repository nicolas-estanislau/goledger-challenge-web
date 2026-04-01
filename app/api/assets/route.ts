import { NextResponse } from "next/server";

import type { AssetKey, AssetPayloadMap, AssetType } from "@/src/lib/goledger/types";
import {
  createAsset,
  deleteAsset,
  updateAsset,
} from "@/src/lib/goledger/server";

type MutationBody<T extends AssetType> = {
  assetType: T;
  values: AssetPayloadMap[T];
};

type DeleteBody = {
  key: AssetKey;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as MutationBody<AssetType>;
    await createAsset(body.assetType, body.values as never);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create asset";

    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as MutationBody<AssetType>;
    await updateAsset(body.assetType, body.values as never);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update asset";

    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as DeleteBody;
    await deleteAsset(body.key);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete asset";

    return NextResponse.json({ message }, { status: 500 });
  }
}

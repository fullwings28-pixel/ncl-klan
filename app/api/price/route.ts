// app/api/price/route.ts
import { NextResponse } from "next/server";
import { getPriceFromCS2Cap } from "@/lib/cs2cap";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const marketHashName = searchParams.get("market_hash_name");

  if (!marketHashName) {
    return NextResponse.json({ error: "market_hash_name is required" }, { status: 400 });
  }

  const price = await getPriceFromCS2Cap(marketHashName);
  if (price === null) {
    return NextResponse.json({ error: "Price not found" }, { status: 404 });
  }

  return NextResponse.json({ price });
}
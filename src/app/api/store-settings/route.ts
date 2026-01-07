import { NextResponse } from "next/server"
import { getStoreSettingsServer } from "@/lib/store-settings"

export async function GET() {
  const settings = await getStoreSettingsServer()
  return NextResponse.json({ settings })
}

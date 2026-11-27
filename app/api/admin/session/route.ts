import { handle, json, session } from "../../../../lib/server/core";
export const dynamic = "force-dynamic";
export async function GET() {
  return handle(async () => json(await session()));
}

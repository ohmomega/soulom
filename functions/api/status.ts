import { readDailyQuota, nextBangkokMidnight } from "../../server/dailyQuota";
import { readPositiveInteger, type SoulomEnv } from "../../server/env";
import { fingerprintClient, jsonResponse } from "../../server/http";
import { resolveStore } from "../../server/keyValueStore";
import { readServiceStatus } from "../../server/serviceHealth";

const DEFAULT_FREE_DAILY_MESSAGES = 20;

// Cheap check the app calls on open and while a problem is showing: KV reads only, never Gemini.
// Supporters pass ?quota=0 since they have no daily limit.
export const onRequestGet: PagesFunction<SoulomEnv> = async ({ request, env }) => {
  const store = resolveStore(env);
  const status = await readServiceStatus(store, Boolean(env.GEMINI_API_KEY));

  const wantsQuota = new URL(request.url).searchParams.get("quota") !== "0";
  let quota = null;
  if (wantsQuota) {
    try {
      const limit = readPositiveInteger(env.FREE_DAILY_MESSAGE_LIMIT, DEFAULT_FREE_DAILY_MESSAGES);
      quota = await readDailyQuota(store, "chat", await fingerprintClient(request), limit);
    } catch {
      quota = null;
    }
  }

  return jsonResponse({ status, quota, resetAt: nextBangkokMidnight() });
};

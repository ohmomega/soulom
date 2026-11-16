import { consumeDailyQuota, readDailyQuota } from "../../server/dailyQuota";
import type { SoulomEnv } from "../../server/env";
import { fingerprintClient, isPlainObject, jsonResponse, readJsonBody } from "../../server/http";
import { resolveStore } from "../../server/keyValueStore";
import { normalizeLicenseKey, verifyLicenseKey } from "../../server/license";

const DAILY_LICENSE_CHECKS = 30;

export const onRequestPost: PagesFunction<SoulomEnv> = async ({ request, env }) => {
  const body = await readJsonBody(request, 1024);
  if (!isPlainObject(body) || typeof body.licenseKey !== "string") {
    return jsonResponse({ error: "invalid_request" }, 400);
  }

  const store = resolveStore(env);
  const clientFingerprint = await fingerprintClient(request);
  const quota = await readDailyQuota(store, "license-check", clientFingerprint, DAILY_LICENSE_CHECKS);
  if (quota.remaining <= 0) {
    return jsonResponse({ error: "too_many_attempts" }, 429);
  }
  await consumeDailyQuota(store, "license-check", clientFingerprint, quota);

  const verdict = await verifyLicenseKey(body.licenseKey, env, store);
  return jsonResponse({ ...verdict, licenseKey: normalizeLicenseKey(body.licenseKey) });
};

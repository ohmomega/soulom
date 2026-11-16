import { consumeDailyQuota, readDailyQuota } from "../../server/dailyQuota";
import type { SoulomEnv } from "../../server/env";
import { fingerprintClient, jsonResponse, sha256Hex } from "../../server/http";
import { resolveStore } from "../../server/keyValueStore";
import {
  generateThaiLicenseKey,
  THAI_LICENSE_LIFETIME_SECONDS,
  thaiLicenseStoreKey,
  type ThaiLicenseRecord,
} from "../../server/license";
import { normalizeSlipResponse, receiverMatches } from "../../server/slipVerification";

const MAX_SLIP_BYTES = 5 * 1024 * 1024;
const DAILY_SLIP_ATTEMPTS = 10;
const USED_SLIP_RETENTION_SECONDS = 400 * 24 * 60 * 60;

export const onRequestPost: PagesFunction<SoulomEnv> = async ({ request, env }) => {
  if (!env.SLIP_VERIFY_URL || !env.SLIP_VERIFY_API_KEY) {
    return jsonResponse({ error: "slip_verification_unavailable" }, 503);
  }

  const store = resolveStore(env);
  const clientFingerprint = await fingerprintClient(request);
  const attempts = await readDailyQuota(store, "slip", clientFingerprint, DAILY_SLIP_ATTEMPTS);
  if (attempts.remaining <= 0) {
    return jsonResponse({ error: "too_many_attempts" }, 429);
  }

  const formData = await request.formData().catch(() => null);
  const slipImage = formData?.get("slip");
  if (!slipImage || typeof slipImage === "string") {
    return jsonResponse({ error: "slip_missing" }, 400);
  }
  if (!slipImage.type.startsWith("image/") || slipImage.size === 0 || slipImage.size > MAX_SLIP_BYTES) {
    return jsonResponse({ error: "slip_invalid_file" }, 400);
  }

  await consumeDailyQuota(store, "slip", clientFingerprint, attempts);

  const upstreamForm = new FormData();
  upstreamForm.append(env.SLIP_VERIFY_FILE_FIELD || "file", slipImage, slipImage.name || "slip.jpg");

  let upstreamPayload: unknown;
  try {
    const upstreamResponse = await fetch(env.SLIP_VERIFY_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.SLIP_VERIFY_API_KEY}` },
      body: upstreamForm,
    });
    upstreamPayload = await upstreamResponse.json().catch(() => null);
    if (!upstreamResponse.ok && upstreamResponse.status >= 500) {
      return jsonResponse({ error: "slip_service_unavailable" }, 502);
    }
  } catch {
    return jsonResponse({ error: "slip_service_unavailable" }, 502);
  }

  const slip = normalizeSlipResponse(upstreamPayload);
  if (!slip) {
    return jsonResponse({ error: "slip_unreadable" }, 422);
  }

  const minimumAmount = Number.parseFloat(env.SLIP_MIN_AMOUNT_THB ?? "");
  if (Number.isFinite(minimumAmount) && minimumAmount > 0 && (slip.amount ?? 0) < minimumAmount) {
    return jsonResponse({ error: "slip_amount_too_low", minimumAmount }, 422);
  }

  if (env.SLIP_RECEIVER_NAME && !receiverMatches(slip, env.SLIP_RECEIVER_NAME)) {
    return jsonResponse({ error: "slip_wrong_receiver" }, 422);
  }

  const usedSlipKey = `slip:${await sha256Hex(slip.transRef)}`;
  if (await store.get(usedSlipKey)) {
    return jsonResponse({ error: "slip_already_used" }, 409);
  }

  const licenseKey = generateThaiLicenseKey();
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + THAI_LICENSE_LIFETIME_SECONDS * 1000);
  const licenseRecord: ThaiLicenseRecord = {
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    transRef: slip.transRef,
  };

  await store.put(usedSlipKey, JSON.stringify({ redeemedAt: licenseRecord.issuedAt }), {
    expirationTtl: USED_SLIP_RETENTION_SECONDS,
  });
  await store.put(thaiLicenseStoreKey(licenseKey), JSON.stringify(licenseRecord), {
    expirationTtl: THAI_LICENSE_LIFETIME_SECONDS,
  });

  return jsonResponse({ licenseKey, expiresAt: licenseRecord.expiresAt });
};

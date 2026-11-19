<p align="center">
  <img src="public/icons/icon.svg" width="96" alt="Soulom icon" />
</p>

<h1 align="center">Soulom (โซลอม)</h1>

<p align="center">
  มีเรื่องอยากเล่า แต่ไม่อยากปลุกใคร<br />
  <sub>For the nights you need to talk.</sub>
</p>

<p align="center">
  <a href="https://soulom.pages.dev"><b>เปิด Soulom → soulom.pages.dev</b></a>
  &nbsp;·&nbsp;
  <a href="https://ko-fi.com/ohmomega">เลี้ยงกาแฟคนทำ</a>
  <!-- LAUNCH-LINKS: add itch.io / Product Hunt links here after posting -->
</p>

<p align="center">
  <img src="docs/launch/ph-1-chat-th.png" width="820" alt="หน้าแชทของ Soulom" />
</p>

Soulom เป็นเพื่อนคุย AI ภาษาไทย ไว้คุยตอนดึกที่คนอื่นหลับกันหมดแล้ว
เปิดเว็บแล้วพิมพ์ได้เลย ไม่ต้องสมัคร ไม่ต้องล็อกอิน Soulom จะไม่สั่งสอน และไม่รีบแก้ปัญหาให้ แค่ฟังแล้วถามต่อทีละเรื่อง
ครั้งหน้ากลับมาก็ยังจำได้ว่าคุยอะไรกันไว้

**เป็นแอปประเภทไหน:** เพื่อนคุย / AI companion, เรื่องใจ (wellbeing), เว็บที่ติดตั้งลงมือถือได้ (PWA)

- เลือกนิสัยได้ 3 แบบ: เพื่อนสนิท พี่ใจดี หรือผู้ฟังสุภาพ
- แชทเก็บอยู่ในเครื่องคุณเท่านั้น ไม่มีฐานข้อมูลเก็บแชทบนเซิร์ฟเวอร์ ถ้าจะย้ายเครื่องก็สำรองเป็นไฟล์ `.soulom` (ใส่รหัสผ่านได้)
- กด "เพิ่มลงหน้าจอหลัก" แล้วใช้เหมือนแอปทั่วไป ได้ทั้ง Android และ iPhone
- สลับไทย / อังกฤษได้
- ฟรี มีโควตาข้อความต่อวัน ไม่มีโฆษณา

ยังทำไม่ได้: ค้นเน็ต (เพราะฉะนั้นชื่อหนัง ราคา หรือข่าว อาจผิดได้) ดูรูป หรือฟังเสียง
และ Soulom ไม่ใช่หมอหรือนักบำบัด ถ้าเรื่องหนักจนไม่ไหว โทร 1323 ได้ฟรีตลอด 24 ชั่วโมง หรือ 1669 ถ้าฉุกเฉิน

### In English

Soulom is a free AI you can talk to late at night, made for Thai speakers first (it speaks English too).
Open the site and start typing. There's no account and no ads, and your chats are stored only on your device.
It won't lecture you. It listens, asks one question at a time, and remembers what you told it last time.
It's not therapy. If someone seems to be in danger, it points them to Thailand's 1323 and 1669 hotlines.

Built with React, Vite, TypeScript, Tailwind, Cloudflare Pages Functions and Google Gemini.

ชอบ Soulom และอยากช่วยค่าเซิร์ฟเวอร์ → [ko-fi.com/ohmomega](https://ko-fi.com/ohmomega)

---

> ส่วนด้านล่างสำหรับนักพัฒนา (Developer docs)

## สถาปัตยกรรม

```
┌──────────────── เบราว์เซอร์ (PWA) ────────────────┐
│ React + Vite + TypeScript + Tailwind              │
│                                                   │
│ localStorage                                      │
│  ├─ ประวัติแชททั้งหมด                              │
│  ├─ Memory Note (สรุป 5–8 บรรทัด ทุก 10 ข้อความ)    │
│  └─ License Key                                   │
│                                                   │
│ ส่งเฉพาะ 20 ข้อความล่าสุด + Memory Note ต่อคำขอ     │
│ ตรวจคำเสี่ยงทำร้ายตัวเอง → แถบสายด่วน 1323          │
│ Export/Import .soulom (Base64 หรือ PBKDF2+AES-GCM) │
└───────────────┬───────────────────────────────────┘
                │ /api/*
┌───────────────▼── Cloudflare Pages Functions ─────┐
│ /api/chat         persona + โควตา → Gemini Flash-Lite│
│ /api/license      ตรวจรหัสปลดล็อก                  │
│ /api/verify-slip  ตรวจสลิปพร้อมเพย์ → ออกรหัส 30 วัน │
│                                                   │
│ SOULOM_KV: ตัวนับโควตา (IP แบบ hash), รหัส SOULOM-TH, │
│            เลขอ้างอิงสลิปที่ใช้แล้ว                  │
└───────────────────────────────────────────────────┘
```

| โฟลเดอร์ | หน้าที่ |
| --- | --- |
| `src/hooks` | สถานะแชท (`useChatSession`) และสถานะผู้สนับสนุน (`useSupporterLicense`) |
| `src/lib` | เรียก API, localStorage, ตรวจคำเสี่ยง, schema, ไฟล์ `.soulom` |
| `src/components` | UI แชท, Supporter Space, หน้าต่างความทรงจำ |
| `functions/api` | Cloudflare Pages Functions (แต่ละไฟล์คือหนึ่ง endpoint) |
| `server` | โค้ดฝั่งเซิร์ฟเวอร์ที่ใช้ร่วมกัน: Gemini, persona, โควตา, license, KV |
| `public` | `manifest.json`, `sw.js`, ไอคอน, `promptpay-qr.png` |

### ความเป็นส่วนตัว

- ไม่มีการบันทึกเนื้อหาแชทบนเซิร์ฟเวอร์ ข้อความผ่าน Function แล้วส่งต่อไป Gemini เท่านั้น
- IP ถูก hash (SHA-256) ก่อนใช้เป็นคีย์นับโควตา และหมดอายุเองใน 2 วัน
- เลขอ้างอิงสลิปถูก hash ก่อนบันทึกเพื่อกันใช้ซ้ำ
- ข้อความที่กู้คืนจากไฟล์ถูกตรวจ schema อย่างเข้มงวดและแสดงผลเป็น plain text เสมอ (ไม่มี `dangerouslySetInnerHTML`)
- หมายเหตุ: Google Gemini API มีนโยบายข้อมูลของตัวเอง ถ้าใช้ API แบบไม่เสียเงิน Google อาจใช้ข้อมูลเพื่อปรับปรุงบริการ แนะนำเปิด billing สำหรับใช้งานจริง

## รันในเครื่อง

ต้องมี Node.js 20 ขึ้นไป

```bash
npm install
cp .env.example .env.local      # ใส่ VITE_KOFI_URL / VITE_LEMON_SQUEEZY_URL
```

สร้างไฟล์ `.dev.vars` (ไม่ถูก commit) สำหรับ secrets ฝั่ง Functions:

```ini
GEMINI_API_KEY=your-gemini-key
FREE_DAILY_MESSAGE_LIMIT=20
```

จากนั้นเปิดสองเทอร์มินัล:

```bash
npm run build && npm run dev:api   # Functions + KV จำลอง ที่ :8788
npm run dev                         # หน้าเว็บ Vite ที่ :5173 (proxy /api → :8788)
```

หรือทดสอบแบบเดียวกับ production ทั้งหมด: `npm run pages:preview`

ถ้ารันโดยไม่มี KV binding ระบบจะใช้ in-memory map แทนโดยอัตโนมัติ (ค่าหายเมื่อรีสตาร์ต)

สร้างไอคอน PNG ใหม่จากโค้ด: `npm run icons`

## Deploy บน Cloudflare Pages + KV

1. **สร้าง KV namespace** — Cloudflare Dashboard → Storage & Databases → KV → Create namespace ชื่อ `soulom-kv`
   (หรือ `npx wrangler kv namespace create soulom-kv`)
2. **สร้าง Pages project** — Workers & Pages → Create → Pages → Connect to Git → เลือก repo `soulom`
   - Framework preset: `None` (หรือ Vite)
   - Build command: `npm run build`
   - Build output directory: `dist`
3. **ผูก KV** — Pages project → Settings → Bindings → Add → KV namespace
   - Variable name: `SOULOM_KV` → เลือก `soulom-kv` (ทำทั้ง Production และ Preview)
4. **ตั้ง Environment variables** — Settings → Variables and Secrets
   - Secret: `GEMINI_API_KEY`, `LEMON_SQUEEZY_API_KEY`, `SLIP_VERIFY_API_KEY`
   - Plain text: `VITE_KOFI_URL`, `VITE_LEMON_SQUEEZY_URL`, `SLIP_VERIFY_URL`, `SLIP_VERIFY_FILE_FIELD`, `SLIP_MIN_AMOUNT_THB`, `SLIP_RECEIVER_NAME`, `FREE_DAILY_MESSAGE_LIMIT`
   - ตัวแปร `VITE_*` ถูกฝังตอน build ต้อง redeploy หลังแก้
5. **แทนที่ QR** — เปลี่ยน `public/promptpay-qr.png` เป็น QR รับเงินพร้อมเพย์จริงของคุณ (ไฟล์ปัจจุบันเป็นกรอบเปล่า)
6. Deploy แล้วเปิดเว็บบนมือถือ → Add to Home Screen

### ตัวแปรทั้งหมด

ดูรายละเอียดใน [`.env.example`](.env.example)

| ตัวแปร | ฝั่ง | ใช้ทำอะไร |
| --- | --- | --- |
| `GEMINI_API_KEY` | Functions | คีย์ Google AI Studio |
| `GEMINI_MODEL` | Functions | (ไม่บังคับ) ชื่อโมเดล คั่นด้วย `,` เพื่อสำรอง ค่าเริ่มต้น `gemini-3.5-flash-lite,gemini-3.1-flash-lite` |
| `SOULOM_KV` | Binding | โควตา, รหัส SOULOM-TH, สลิปที่ใช้แล้ว |
| `FREE_DAILY_MESSAGE_LIMIT` | Functions | ข้อความฟรีต่อวันต่อ IP (ค่าเริ่มต้น 20) |
| `LEMON_SQUEEZY_API_KEY` | Functions | เปิดการตรวจ License Key จาก Lemon Squeezy |
| `SLIP_VERIFY_URL` / `SLIP_VERIFY_API_KEY` | Functions | endpoint และคีย์ของบริการตรวจสลิป |
| `SLIP_VERIFY_FILE_FIELD` | Functions | ชื่อฟิลด์ไฟล์ (EasySlip=`file`, SlipOK=`files`) |
| `SLIP_MIN_AMOUNT_THB` | Functions | ยอดขั้นต่ำที่ออกรหัสให้ |
| `SLIP_RECEIVER_NAME` | Functions | ชื่อบัญชีผู้รับ กันสลิปที่โอนให้คนอื่น |
| `VITE_KOFI_URL` | Build | ลิงก์ Ko-fi / Buy Me a Coffee |
| `VITE_LEMON_SQUEEZY_URL` | Build | ลิงก์หน้าชำระเงิน Lemon Squeezy |

## ระบบโควตาและรหัสปลดล็อก

- ไม่มีรหัส: 20 ข้อความ/วัน/IP (นับตามวันเวลาไทย) ครบแล้ว API ตอบ `429 quota_exceeded` และหน้าแชทชวนเปิดพื้นที่สนับสนุนอย่างสุภาพ
- การสรุป Memory Note ใช้โควตาแยก (12 ครั้ง/วัน) ไม่กินโควตาแชท
- ส่ง header `X-License-Key`:
  - `SOULOM-TH-XXXX-XXXX-XXXX` → ตรวจกับ `SOULOM_KV` (ออกให้อัตโนมัติจากสลิป อายุ 30 วัน)
  - รูปแบบอื่น → ตรวจกับ Lemon Squeezy License API (cache ผล 6 ชม.)
- รหัสใช้ 12 ตัวอักษรสุ่ม (ราว 60 บิต) แทน 4 ตัว เพื่อไม่ให้เดารหัสได้ และ `/api/license` จำกัด 30 ครั้ง/วัน/IP

ออกรหัสให้ผู้สนับสนุนเอง (เช่น โอนผ่านช่องทางอื่น):

```bash
npx wrangler kv key put --namespace-id=<KV_ID> --remote \
  "license:SOULOM-TH-ABCD-EFGH-JKLM" \
  '{"issuedAt":"2026-11-16T00:00:00.000Z","expiresAt":"2026-12-16T00:00:00.000Z","transRef":"manual"}' \
  --ttl 2592000
```

## ไฟล์ความทรงจำ `.soulom`

```jsonc
// Quick Save
{ "format": "soulom", "version": 1, "mode": "quick", "payload": "<base64 ของ JSON>" }

// Vault Lock
{
  "format": "soulom", "version": 1, "mode": "vault",
  "hint": "คำใบ้ (ไม่เข้ารหัส)",
  "kdf": { "name": "PBKDF2", "hash": "SHA-256", "iterations": 600000, "salt": "<base64>" },
  "cipher": { "name": "AES-GCM", "iv": "<base64>" },
  "payload": "<ciphertext base64>"
}
```

payload ภายในคือ `{ exportedAt, messages[], memoryNote, licenseKey }` การ import จะปฏิเสธไฟล์ที่มี key เกิน ขาด หรือชนิดข้อมูลไม่ตรง

## License

[MIT](LICENSE) © ohmomega

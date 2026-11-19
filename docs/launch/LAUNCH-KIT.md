# Soulom Launch Kit

ชุดนี้มีทุกอย่างที่ต้องใช้ตอนลง itch.io และ Product Hunt: ข้อความพร้อมก๊อปวาง รูป และขั้นตอนทีละข้อ
ภาพทั้งหมดอยู่ในโฟลเดอร์เดียวกับไฟล์นี้ (`docs/launch/`)

| ไฟล์ | ขนาด | ใช้ที่ไหน |
| --- | --- | --- |
| `itch-cover.png` | 630×500 | itch.io → Cover image |
| `itch-shot-chat.png`, `itch-shot-guide.png` | 600×860 | itch.io → Screenshots |
| `ph-1-chat-th.png`, `ph-2-chat-en.png`, `ph-3-guide-th.png` | 1270×760 | Product Hunt → Gallery |
| `../../public/icons/icon-512.png` | 512×512 | Product Hunt → Thumbnail / itch.io icon |
| `og.png` | 1200×630 | รูปตอนแชร์ลิงก์ (ใส่ในเว็บแล้ว) |

---

## Soulom คืออะไร (ใช้อธิบายสั้นๆ ได้ทุกที่)

- **หมวด:** AI Companion (เพื่อนคุย/รับฟัง) · Wellbeing (สุขภาวะทางใจ) · Web app / PWA
- **ประโยคเดียว (TH):** เพื่อนคุย AI ตอนกลางคืน ที่ฟังจริง ไม่ตัดสิน
- **One line (EN):** A Thai-first AI companion that listens, not lectures
- **ลิงก์หลัก:** https://soulom.pages.dev
- **โค้ด:** https://github.com/ohmomega/soulom

---

## 1. itch.io

### ต้องทำเอง (ผมทำแทนไม่ได้ เพราะต้องล็อกอินบัญชีของคุณ)
1. สมัคร https://itch.io (มุมขวาบน Register) แล้วยืนยันอีเมล
2. กดรูปโปรไฟล์ → **Upload new project**
3. กรอกตามตารางด้านล่าง → กด **Save** (ตั้งเป็น Draft ก่อน ดูหน้าตาแล้วค่อยเปลี่ยนเป็น Public)

| ช่อง | ใส่อะไร |
| --- | --- |
| Title | `Soulom – AI companion that listens` |
| Project URL | `soulom` |
| Short description or tagline | `A Thai-first AI companion for lonely, sleepless nights. Free, no sign-up.` |
| Classification | **Tools** (ถ้าไม่ชอบเลือก **Other** ก็ได้) |
| Kind of project | **Downloadable** แล้ว **ไม่ต้องอัปโหลดไฟล์** (เราใส่ลิงก์ไปเว็บแทน) |
| Release status | **Released** |
| Pricing | **No payments** |
| Description | ก๊อปจาก "itch.io Description" ด้านล่าง |
| Genre | ปล่อยว่าง หรือเลือกที่ใกล้สุด |
| Tags | `ai`, `chatbot`, `companion`, `mental-health`, `wellbeing`, `relaxing`, `cozy`, `thai`, `pwa`, `web` |
| AI generation disclosure | เลือกว่า **ใช้ Generative AI** → ติ๊ก **Text** (ต้องบอกตามจริง เพราะคำตอบมาจาก AI) |
| Links | `https://soulom.pages.dev` (Play / Website) และ `https://github.com/ohmomega/soulom` (Source code) |
| Cover image | `itch-cover.png` |
| Screenshots | `itch-shot-chat.png`, `itch-shot-guide.png`, `ph-2-chat-en.png` |
| Visibility | Draft → ดูหน้าแล้วค่อยเปลี่ยนเป็น **Public** |

> ทำไมไม่อัปโหลดเป็น HTML ให้เล่นในหน้า itch? เพราะ Soulom ต้องคุยกับเซิร์ฟเวอร์ของเรา (`/api`) และแชทเก็บในเบราว์เซอร์
> ถ้าเปิดผ่านกรอบของ itch แชทจะแยกกับตอนเปิดเว็บตรงๆ และอาจหายง่าย ส่งคนไปที่เว็บจริงดีกว่า

### itch.io Description (ก๊อปทั้งก้อน)

```
🌙 Soulom (โซลอม) – a late-night companion that actually listens

▶ OPEN SOULOM: https://soulom.pages.dev
(works in any phone or computer browser, no download)

Soulom is a free, Thai-first AI listening companion for lonely or sleepless nights.
It doesn't lecture or try to fix you. It listens, asks gentle follow-up questions,
and remembers what you've shared.

WHAT IT DOES
✓ Chat instantly – no account, no login, no ads
✓ 3 personalities: Close friend · Kind older sister · Polite listener
✓ Remembers your story with a short memory note kept on your device
✓ Your chats stay on your device; back them up as a .soulom file (optional password)
✓ Installs like an app (Add to Home Screen on Android / iPhone)
✓ Thai and English

WHAT IT CAN'T DO (YET)
✕ Search the internet, so facts like titles or prices may be wrong
✕ See images, hear audio or open links
✕ Replace a therapist or doctor. If you're in danger, in Thailand call 1323 (free, 24/7) or 1669

Free daily messages. Optional supporter plan coming later.

Source code: https://github.com/ohmomega/soulom

---

🌙 Soulom – เพื่อนคุย AI ตอนกลางคืน ที่ฟังจริง ไม่ตัดสิน
เปิดใช้เลย: https://soulom.pages.dev
ฟรี ไม่ต้องสมัคร แชทเก็บในเครื่องคุณเท่านั้น ไม่มีโฆษณา
```

---

## 2. Product Hunt

### ต้องทำเอง
1. สมัคร https://www.producthunt.com (ใช้ Google หรือ X ได้) แล้วกรอกโปรไฟล์ให้ครบ ใส่รูปและชื่อจริงหรือชื่อเล่น
2. **ก่อนวันลง 1–2 สัปดาห์** ให้ใช้บัญชีปกติ เช่น กดโหวตหรือคอมเมนต์โปรดักต์อื่นบ้าง บัญชีที่ว่างเปล่ามักไม่ค่อยมีคนเห็น
   ถ้าเจอข้อความว่าบัญชียังโพสต์ไม่ได้ ให้รอตามที่เว็บบอก
3. กด **Submit** → **Launch a product** → ใส่ลิงก์ `https://soulom.pages.dev`
4. กรอกตามตารางด้านล่าง แล้วเลือกวันลง
5. **วันลง:** Product Hunt เริ่มนับวันใหม่ตอน 00:01 เวลาซานฟรานซิสโก = **ประมาณ 15:01 น. เวลาไทย** (ช่วงพฤศจิกายน–มีนาคม)
   ช่วงที่เหลือของปีจะเป็นประมาณ 14:01 น. ตั้งเวลาลงไว้ล่วงหน้าได้ และให้ว่างตอบคอมเมนต์ช่วงนั้น
6. ทันทีที่โพสต์ขึ้น ให้โพสต์ **Maker comment** ด้านล่างเป็นคอมเมนต์แรก แล้วแชร์ลิงก์ให้เพื่อน
   ขอให้เพื่อน "ลองใช้แล้วคอมเมนต์" ไม่ใช่แค่ "ช่วยโหวต" เพราะ Product Hunt ไม่ชอบการขอโหวตตรงๆ

| ช่อง | ใส่อะไร |
| --- | --- |
| Name | `Soulom` |
| Tagline (≤60 ตัวอักษร) | `A Thai-first AI companion that listens, not lectures` |
| Links | `https://soulom.pages.dev` + GitHub `https://github.com/ohmomega/soulom` |
| Topics | `Artificial Intelligence`, `Health & Fitness` (หรือ `Mental Health` ถ้ามี), `Productivity` หรือ `Open Source` |
| Description | ก๊อปจาก "PH Description" ด้านล่าง |
| Thumbnail | `public/icons/icon-512.png` |
| Gallery | `ph-1-chat-th.png`, `ph-2-chat-en.png`, `ph-3-guide-th.png` |
| Pricing | **Free** (ถ้ามีระบบผู้สนับสนุนแล้วค่อยเปลี่ยนเป็น Free Options) |
| Makers | ใส่ตัวคุณเอง (ติ๊ก I worked on this product) |
| Shoutouts / AI | ระบุว่าใช้ Google Gemini |

### PH Description

```
Soulom is a free, Thai-first AI listening companion for lonely or sleepless nights.
It listens without judging, asks one gentle question at a time, and remembers what
you've shared. No account, no ads, and your chats never leave your device.
Pick a personality (friend, kind sister, polite listener), chat in Thai or English,
and install it like an app.
```

### Maker comment (คอมเมนต์แรก)

```
Hi Product Hunt 👋

I built Soulom because a lot of people in Thailand have nobody to talk to at 2am,
and most AI chatbots answer like a search engine or a lecturer. I wanted one that
just listens.

What makes it different:
• Thai-first: it speaks natural Thai in 3 personalities (it also speaks English)
• Private by design: no account, and chats are stored only in your browser.
  You can export them as a password-protected .soulom file
• Remembers you: a short memory note, so it can ask "how did the interview go?"
• Safety: if someone seems at risk, it gently points to Thailand's 1323 / 1669 hotlines

It's free (daily message limit), open source, and runs on Cloudflare + Gemini.
I'd love feedback, especially on how the replies feel. Thank you for trying it!
```

---

## 3. ให้ Google เจอ Soulom

ผมใส่ข้อมูลที่ Google และโซเชียลอ่านไว้ในเว็บแล้ว ได้แก่ ชื่อเว็บ คำอธิบาย รูปตอนแชร์ลิงก์ `robots.txt` และ `sitemap.xml`
ที่เหลือคุณต้องทำเอง เพราะต้องล็อกอินด้วยบัญชี Google:

1. เข้า https://search.google.com/search-console → **Add property** → เลือก **URL prefix** → ใส่ `https://soulom.pages.dev/`
2. วิธียืนยัน: เลือก **HTML tag** → ก๊อปบรรทัด `<meta name="google-site-verification" ...>` มาให้ผม ผมจะใส่ในเว็บแล้ว deploy ให้
3. พอยืนยันได้แล้ว ไปที่เมนู **Sitemaps** → ใส่ `sitemap.xml` → Submit
4. เมนู **URL inspection** → ใส่ `https://soulom.pages.dev/` → **Request indexing**
5. (ไม่บังคับ) ทำแบบเดียวกันที่ https://www.bing.com/webmasters ซึ่งนำเข้าจาก Google Search Console ได้ในคลิกเดียว

ปกติ Google ใช้เวลาหลายวันถึงสองสามสัปดาห์กว่าจะเริ่มแสดงเว็บ

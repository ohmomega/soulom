const THAI_RISK_PHRASES = [
  "ฆ่าตัวตาย",
  "ฆ่าตัวเอง",
  "อยากตาย",
  "อยากจะตาย",
  "อยากตายๆไป",
  "ไม่อยากอยู่แล้ว",
  "ไม่อยากอยู่ต่อ",
  "ไม่อยากมีชีวิต",
  "ไม่อยากตื่น",
  "อยากหายไปจากโลก",
  "จบชีวิต",
  "จบชีวิตตัวเอง",
  "ปลิดชีพ",
  "ทำร้ายตัวเอง",
  "ทำร้ายร่างกายตัวเอง",
  "กรีดแขน",
  "กรีดข้อมือ",
  "กรีดตัวเอง",
  "ผูกคอ",
  "แขวนคอ",
  "กระโดดตึก",
  "กระโดดสะพาน",
  "กินยาตาย",
  "กินยาเกินขนาด",
  "ตายไปซะ",
  "ตายๆไปซะ",
  "ไม่มีเหตุผลให้อยู่",
  "อยู่ไปก็ไม่มีประโยชน์",
];

const ENGLISH_RISK_PATTERNS = [
  /\bsuicid(e|al)\b/,
  /\bkill(ing)?\s+my\s*self\b/,
  /\bend\s+(it\s+all|my\s+life)\b/,
  /\bwant\s+to\s+die\b/,
  /\bself[\s-]?harm(ing)?\b/,
  /\bcut(ting)?\s+my\s*self\b/,
  /\bdon'?t\s+want\s+to\s+(live|be\s+alive|exist)\b/,
];

function normalizeThai(text: string): string {
  return text.replace(/[\s​]+/g, "").replace(/ๆ+/g, "ๆ");
}

export function containsSelfHarmSignal(text: string): boolean {
  const compactThai = normalizeThai(text);
  if (THAI_RISK_PHRASES.some((phrase) => compactThai.includes(normalizeThai(phrase)))) return true;

  const lowered = text.toLowerCase();
  return ENGLISH_RISK_PATTERNS.some((pattern) => pattern.test(lowered));
}

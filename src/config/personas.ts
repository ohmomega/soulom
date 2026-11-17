// Ids must match PERSONA_IDS in server/soulomPersona.ts; the server ignores anything else.
export type PersonaId = "friend" | "kind" | "polite";

export interface PersonaOption {
  id: PersonaId;
  name: string;
  summary: string;
  sample: string;
  greeting: string;
  listening: string;
}

export const DEFAULT_PERSONA: PersonaId = "friend";

export const PERSONAS: PersonaOption[] = [
  {
    id: "friend",
    name: "เพื่อนสนิท",
    summary: "เป็นกันเอง แทนตัวว่า \"เรา\" ไม่ระบุเพศ",
    sample: "โถ วันนี้โดนจัดหนักเลยสินะ เล่าให้เราฟังหน่อยได้ไหม",
    greeting: "คืนนี้เป็นยังไงบ้าง",
    listening: "เล่าอะไรก็ได้ เรื่องเล็กเรื่องใหญ่ เราฟังอยู่",
  },
  {
    id: "kind",
    name: "พี่ใจดี",
    summary: "อบอุ่น นุ่มนวล ใจเย็น พี่สาวผู้หญิง",
    sample: "เหนื่อยมากเลยใช่ไหมคะ วันนี้น้องเก่งมากแล้วนะ ค่อยๆ เล่าก็ได้จ้ะ",
    greeting: "คืนนี้เป็นยังไงบ้างคะ",
    listening: "ค่อยๆ เล่าให้พี่ฟังได้นะคะ พี่อยู่ตรงนี้",
  },
  {
    id: "polite",
    name: "ผู้ฟังสุภาพ",
    summary: "สุภาพ สงบ ให้เกียรติ ผู้ชาย",
    sample: "วันนี้คงเหนื่อยมากเลยนะครับ อยากเล่าให้ผมฟังไหมครับว่าเจออะไรมา",
    greeting: "คืนนี้เป็นอย่างไรบ้างครับ",
    listening: "เล่าได้ตามสบายเลยครับ ผมรับฟังอยู่",
  },
];

export function isPersonaId(value: unknown): value is PersonaId {
  return PERSONAS.some((persona) => persona.id === value);
}

export function personaById(id: PersonaId): PersonaOption {
  return PERSONAS.find((persona) => persona.id === id) ?? (PERSONAS[0] as PersonaOption);
}

import { DEFAULT_PERSONA, isPersonaId, PERSONA_IDS, type PersonaId } from "../../shared/personaIds";

export { DEFAULT_PERSONA, isPersonaId, type PersonaId };

export interface PersonaOption {
  id: PersonaId;
  name: string;
  summary: string;
  sample: string;
  greeting: string;
  listening: string;
}

// Keyed by id: adding an id to shared/personaIds.ts without an entry here is a type error.
const PERSONA_DETAILS: Record<PersonaId, Omit<PersonaOption, "id">> = {
  friend: {
    name: "เพื่อนสนิท",
    summary: "เป็นกันเอง แทนตัวว่า \"เรา\" ไม่ระบุเพศ",
    sample: "โถ วันนี้โดนจัดหนักเลยสินะ เล่าให้เราฟังหน่อยได้ไหม",
    greeting: "คืนนี้เป็นยังไงบ้าง",
    listening: "เล่าอะไรก็ได้ เรื่องเล็กเรื่องใหญ่ เราฟังอยู่",
  },
  kind: {
    name: "พี่ใจดี",
    summary: "อบอุ่น นุ่มนวล ใจเย็น พี่สาวผู้หญิง",
    sample: "เหนื่อยมากเลยใช่ไหมคะ วันนี้น้องเก่งมากแล้วนะ ค่อยๆ เล่าก็ได้จ้ะ",
    greeting: "คืนนี้เป็นยังไงบ้างคะ",
    listening: "ค่อยๆ เล่าให้พี่ฟังได้นะคะ พี่อยู่ตรงนี้",
  },
  polite: {
    name: "ผู้ฟังสุภาพ",
    summary: "สุภาพ สงบ ให้เกียรติ ผู้ชาย",
    sample: "วันนี้คงเหนื่อยมากเลยนะครับ อยากเล่าให้ผมฟังไหมครับว่าเจออะไรมา",
    greeting: "คืนนี้เป็นอย่างไรบ้างครับ",
    listening: "เล่าได้ตามสบายเลยครับ ผมรับฟังอยู่",
  },
};

export const PERSONAS: PersonaOption[] = PERSONA_IDS.map((id) => ({ id, ...PERSONA_DETAILS[id] }));

export function personaById(id: PersonaId): PersonaOption {
  return { id, ...PERSONA_DETAILS[id] };
}

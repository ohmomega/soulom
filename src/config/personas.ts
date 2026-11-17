import { DEFAULT_PERSONA, isPersonaId, PERSONA_IDS, type PersonaId } from "../../shared/personaIds";
import type { Strings } from "../i18n/strings";

export { DEFAULT_PERSONA, isPersonaId, type PersonaId };

export interface PersonaOption {
  id: PersonaId;
  name: string;
  summary: string;
  sample: string;
  greeting: string;
  listening: string;
}

// Text lives in i18n/strings.ts (keyed by id, so a new id without text there is a type error).
export function personaOptions(t: Strings): PersonaOption[] {
  return PERSONA_IDS.map((id) => ({ id, ...t.persona.options[id] }));
}

export function personaById(id: PersonaId, t: Strings): PersonaOption {
  return { id, ...t.persona.options[id] };
}

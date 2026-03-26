export type ParsedPetNotes = {
  bio: string;
  specialNeeds: string | null;
  yardType: string | null;
  ageRange: string | null;
  energyLevel: string | null;
  attributeTags: string[];
};

/**
 * Pets store structured fields inside `pets.notes` (see add/edit pet flows).
 * First non-empty line is the short bio; following lines use `Label: value` prefixes.
 */
export function parsePetNotes(notes: string | null | undefined): ParsedPetNotes {
  const raw = typeof notes === "string" ? notes : "";
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const bio = lines[0] ?? "";

  const findValue = (prefix: string) => {
    const line = lines.find((l) => l.toLowerCase().startsWith(prefix));
    if (!line) return null;
    const idx = line.indexOf(":");
    if (idx === -1) return null;
    const v = line.slice(idx + 1).trim();
    return v || null;
  };

  const specialNeeds = findValue("special needs");
  const yardType = findValue("yard");
  const ageRange = findValue("age range");
  const energyLevel = findValue("energy level");

  const attributeTags = [yardType, ageRange, energyLevel].filter(
    (v): v is string => Boolean(v),
  );

  return {
    bio,
    specialNeeds,
    yardType,
    ageRange,
    energyLevel,
    attributeTags,
  };
}

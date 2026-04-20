export const LOCATIONS = ["PickleGarage", "Deep VK"] as const;
export type Location = (typeof LOCATIONS)[number];

export function isValidLocation(value: string): value is Location {
  return (LOCATIONS as readonly string[]).includes(value);
}

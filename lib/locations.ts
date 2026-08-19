export const LOCATIONS = ["PickleGarage", "Deep VK", "Stellarin IP (Indirapuram)", "Ryan International School"] as const;
export type Location = (typeof LOCATIONS)[number];

export function isValidLocation(value: string): value is Location {
  return (LOCATIONS as readonly string[]).includes(value);
}

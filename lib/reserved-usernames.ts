export const reservedUsernames = new Set([
  "api",
  "dashboard",
  "help",
  "onboarding",
  "privacy",
  "terms",
]);

export function isReservedUsername(username: string) {
  return reservedUsernames.has(username.trim().toLowerCase());
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isValidId(value: unknown): value is string {
  return isNonEmptyString(value);
}

/**
 * Converts a flat object into a query string.
 * Filters out null/undefined values and encodes components.
 */

export function toQueryParams<
  T extends Record<string, string | number | null | undefined>,
>(obj: T): string {
  const searchParams = new URLSearchParams();

  Object.entries(obj).forEach(([key, value]) => {
    // Only append if the value is defined and not null
    if (value !== undefined && value !== null) {
      // Handle arrays by appending multiple values for the same key
      if (Array.isArray(value)) {
        value.forEach((item) => searchParams.append(key, String(item)));
      } else {
        searchParams.set(key, String(value));
      }
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

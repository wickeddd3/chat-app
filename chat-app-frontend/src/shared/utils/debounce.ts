export function debounce<Args extends unknown[]>(
  func: (...args: Args) => void,
  delay: number,
): (...args: Args) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Args) => {
    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
}

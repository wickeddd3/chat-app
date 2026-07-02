import { toQueryParams, type QueryParams } from "./query-params";

describe("toQueryParams", () => {
  it("returns an empty string for an empty object", () => {
    expect(toQueryParams({})).toBe("");
  });

  it("serializes primitive values as a leading-? query string", () => {
    expect(toQueryParams({ query: "jane", cursor: 3 })).toBe(
      "?query=jane&cursor=3",
    );
  });

  it("omits keys whose value is null or undefined", () => {
    expect(toQueryParams({ query: "jane", cursor: null, page: undefined })).toBe(
      "?query=jane",
    );
  });

  it("returns an empty string when every value is null or undefined", () => {
    expect(toQueryParams({ cursor: null, page: undefined })).toBe("");
  });

  it("appends one entry per array item under the same key", () => {
    // The QueryParams type doesn't declare array values, but toQueryParams handles them at runtime
    const params = { memberIds: ["a", "b", "c"] } as unknown as QueryParams;

    expect(toQueryParams(params)).toBe(
      "?memberIds=a&memberIds=b&memberIds=c",
    );
  });

  it("URL-encodes special characters in values", () => {
    expect(toQueryParams({ query: "a b&c" })).toBe("?query=a+b%26c");
  });
});

import { tokenizeMessageLinks } from "./message-links";

const rendered = (content: string) =>
  tokenizeMessageLinks(content)
    .map((token) => token.value)
    .join("");

const links = (content: string) =>
  tokenizeMessageLinks(content).filter((token) => token.type === "link");

describe("tokenizeMessageLinks", () => {
  it("leaves text with no link as a single run", () => {
    expect(tokenizeMessageLinks("just a message")).toEqual([
      { type: "text", value: "just a message" },
    ]);
  });

  it("returns nothing for empty content", () => {
    expect(tokenizeMessageLinks("")).toEqual([]);
  });

  it("finds a bare url", () => {
    expect(tokenizeMessageLinks("https://example.com/docs")).toEqual([
      {
        type: "link",
        value: "https://example.com/docs",
        href: "https://example.com/docs",
      },
    ]);
  });

  it("keeps the surrounding text in order", () => {
    expect(tokenizeMessageLinks("see https://example.com now")).toEqual([
      { type: "text", value: "see " },
      {
        type: "link",
        value: "https://example.com",
        href: "https://example.com/",
      },
      { type: "text", value: " now" },
    ]);
  });

  it("finds every link in a message", () => {
    expect(links("https://a.dev and https://b.dev")).toHaveLength(2);
  });

  it("gives a bare www host an https scheme without rewriting the text", () => {
    expect(links("www.example.com")).toEqual([
      {
        type: "link",
        value: "www.example.com",
        href: "https://www.example.com/",
      },
    ]);
  });

  it("leaves a sentence's full stop out of the link", () => {
    expect(links("read https://example.com/a.")).toEqual([
      {
        type: "link",
        value: "https://example.com/a",
        href: "https://example.com/a",
      },
    ]);
  });

  it("leaves an unbalanced closing parenthesis out of the link", () => {
    expect(links("(see https://example.com/a)")[0]?.value).toBe(
      "https://example.com/a",
    );
  });

  it("keeps a balanced pair inside the link", () => {
    expect(links("https://en.wikipedia.org/wiki/Ruby_(gem)")[0]?.value).toBe(
      "https://en.wikipedia.org/wiki/Ruby_(gem)",
    );
  });

  it("refuses a javascript: url, leaving it as plain text", () => {
    const content = "javascript:alert(1)";

    expect(links(content)).toEqual([]);
    expect(rendered(content)).toBe(content);
  });

  it("refuses a scheme smuggled after an http-looking prefix", () => {
    // Not matched at all: the pattern only opens on http(s):// or www.
    expect(links("data:text/html;base64,PHNjcmlwdD4=")).toEqual([]);
  });

  it("preserves every character it was given", () => {
    const content =
      "line one\n  https://example.com/a?q=1&b=2 trailing\n\nlast www.b.dev.";

    expect(rendered(content)).toBe(content);
  });

  it("preserves content when a match cannot be resolved", () => {
    // A host the URL parser rejects — the text must survive intact.
    const content = "http:// broken";

    expect(rendered(content)).toBe(content);
  });

  it("does not treat a trailing-only match as a link", () => {
    expect(links("www.")).toEqual([]);
  });
});

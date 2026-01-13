import { describe, it, expect } from "bun:test";
import { ensureMdExtension } from "./paths";

describe("ensureMdExtension", () => {
  it("returns path unchanged if it already ends with .md", () => {
    expect(ensureMdExtension("notes/test.md")).toBe("notes/test.md");
    expect(ensureMdExtension("inbox.md")).toBe("inbox.md");
  });

  it("appends .md if path does not end with .md", () => {
    expect(ensureMdExtension("notes/test")).toBe("notes/test.md");
    expect(ensureMdExtension("inbox")).toBe("inbox.md");
    expect(ensureMdExtension("Investigations/2026-01-13-bug")).toBe("Investigations/2026-01-13-bug.md");
  });

  it("handles paths with multiple dots", () => {
    expect(ensureMdExtension("notes/v1.0.0-release")).toBe("notes/v1.0.0-release.md");
    expect(ensureMdExtension("notes/v1.0.0-release.md")).toBe("notes/v1.0.0-release.md");
  });

  it("handles empty string", () => {
    expect(ensureMdExtension("")).toBe(".md");
  });
});

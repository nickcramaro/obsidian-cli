import { describe, it, expect } from "bun:test";
import { formatOutput, OutputOptions } from "./output";

describe("formatOutput", () => {
  it("returns JSON string when json option is true", () => {
    const data = { title: "Test", content: "Hello" };
    const result = formatOutput(data, { json: true });
    expect(result).toBe(JSON.stringify(data, null, 2));
  });

  it("returns string as-is for human output", () => {
    const result = formatOutput("Hello world", { json: false });
    expect(result).toBe("Hello world");
  });

  it("formats objects as readable text for human output", () => {
    const data = { name: "test.md", size: 100 };
    const result = formatOutput(data, { json: false });
    expect(result).toContain("name: test.md");
    expect(result).toContain("size: 100");
  });

  it("formats arrays as lists for human output", () => {
    const data = ["file1.md", "file2.md", "file3.md"];
    const result = formatOutput(data, { json: false });
    expect(result).toContain("file1.md");
    expect(result).toContain("file2.md");
    expect(result).toContain("file3.md");
  });
});

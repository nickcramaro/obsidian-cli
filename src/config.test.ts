import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { getConfig, ConfigError } from "./config";

describe("getConfig", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("throws ConfigError when OBSIDIAN_API_KEY is not set", () => {
    delete process.env.OBSIDIAN_API_KEY;
    expect(() => getConfig()).toThrow(ConfigError);
  });

  it("returns config with API key when set", () => {
    process.env.OBSIDIAN_API_KEY = "test-key";
    const config = getConfig();
    expect(config.apiKey).toBe("test-key");
  });

  it("uses default URL when OBSIDIAN_API_URL is not set", () => {
    process.env.OBSIDIAN_API_KEY = "test-key";
    delete process.env.OBSIDIAN_API_URL;
    const config = getConfig();
    expect(config.apiUrl).toBe("https://127.0.0.1:27124");
  });

  it("uses custom URL when OBSIDIAN_API_URL is set", () => {
    process.env.OBSIDIAN_API_KEY = "test-key";
    process.env.OBSIDIAN_API_URL = "https://localhost:8080";
    const config = getConfig();
    expect(config.apiUrl).toBe("https://localhost:8080");
  });
});

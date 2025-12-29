import { describe, it, expect, mock, beforeEach } from "bun:test";
import { ObsidianClient, ApiError } from "./client";

describe("ObsidianClient", () => {
  let client: ObsidianClient;

  beforeEach(() => {
    client = new ObsidianClient("test-api-key", "https://127.0.0.1:27124");
  });

  describe("constructor", () => {
    it("stores API key and base URL", () => {
      expect(client).toBeDefined();
    });
  });

  describe("getStatus", () => {
    it("fetches server status from root endpoint", async () => {
      const mockResponse = {
        status: "OK",
        authenticated: true,
        service: "Obsidian Local REST API",
        versions: { obsidian: "1.5.0", self: "1.0.0" },
      };

      global.fetch = mock(() =>
        Promise.resolve(new Response(JSON.stringify(mockResponse), {
          headers: { "content-type": "application/json" }
        }))
      ) as unknown as typeof fetch;

      const status = await client.getStatus();
      expect(status.authenticated).toBe(true);
      expect(status.service).toBe("Obsidian Local REST API");
    });
  });

  describe("ApiError", () => {
    it("creates error with message and status", () => {
      const error = new ApiError("Not found", 404);
      expect(error.message).toBe("Not found");
      expect(error.status).toBe(404);
    });
  });
});

# Obsidian CLI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a CLI tool that interfaces with Obsidian's Local REST API plugin for managing notes from the terminal.

**Architecture:** Git-style subcommands (`obsidian note read`, `obsidian daily append`) backed by an HTTP client. Human-friendly output by default with `--json` flag for scripting.

**Tech Stack:** Bun runtime, Commander.js for CLI, native fetch for HTTP.

---

### Task 1: Project Setup

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `src/index.ts`

**Step 1: Create package.json**

```json
{
  "name": "obsidian-cli",
  "version": "0.1.0",
  "description": "CLI for Obsidian using Local REST API",
  "type": "module",
  "bin": {
    "obsidian": "./src/index.ts"
  },
  "scripts": {
    "start": "bun run src/index.ts",
    "test": "bun test",
    "lint": "bunx tsc --noEmit"
  },
  "dependencies": {
    "commander": "^12.1.0"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "typescript": "^5.0.0"
  }
}
```

**Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "types": ["bun-types"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: Create minimal entry point**

```typescript
#!/usr/bin/env bun

console.log("obsidian-cli");
```

**Step 4: Install dependencies**

Run: `bun install`
Expected: Dependencies installed, bun.lockb created

**Step 5: Test it runs**

Run: `bun run src/index.ts`
Expected: Outputs "obsidian-cli"

**Step 6: Commit**

```bash
git add -A
git commit -m "chore: initial project setup with Bun and Commander.js"
```

---

### Task 2: Configuration Module

**Files:**
- Create: `src/config.ts`
- Create: `src/config.test.ts`

**Step 1: Write the failing test**

```typescript
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
```

**Step 2: Run test to verify it fails**

Run: `bun test src/config.test.ts`
Expected: FAIL - Cannot find module "./config"

**Step 3: Write minimal implementation**

```typescript
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export interface Config {
  apiKey: string;
  apiUrl: string;
}

const DEFAULT_API_URL = "https://127.0.0.1:27124";

export function getConfig(): Config {
  const apiKey = process.env.OBSIDIAN_API_KEY;

  if (!apiKey) {
    throw new ConfigError(
      "OBSIDIAN_API_KEY not set. Get it from Obsidian Settings → Local REST API"
    );
  }

  return {
    apiKey,
    apiUrl: process.env.OBSIDIAN_API_URL || DEFAULT_API_URL,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `bun test src/config.test.ts`
Expected: All 4 tests PASS

**Step 5: Commit**

```bash
git add src/config.ts src/config.test.ts
git commit -m "feat: add configuration module with env var handling"
```

---

### Task 3: Output Utilities

**Files:**
- Create: `src/utils/output.ts`
- Create: `src/utils/output.test.ts`

**Step 1: Write the failing test**

```typescript
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
```

**Step 2: Run test to verify it fails**

Run: `bun test src/utils/output.test.ts`
Expected: FAIL - Cannot find module "./output"

**Step 3: Create utils directory and write implementation**

```typescript
export interface OutputOptions {
  json: boolean;
}

export function formatOutput(data: unknown, options: OutputOptions): string {
  if (options.json) {
    return JSON.stringify(data, null, 2);
  }

  if (typeof data === "string") {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => (typeof item === "string" ? item : formatObject(item))).join("\n");
  }

  if (typeof data === "object" && data !== null) {
    return formatObject(data as Record<string, unknown>);
  }

  return String(data);
}

function formatObject(obj: Record<string, unknown>): string {
  return Object.entries(obj)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
}

export function print(data: unknown, options: OutputOptions): void {
  console.log(formatOutput(data, options));
}
```

**Step 4: Run test to verify it passes**

Run: `bun test src/utils/output.test.ts`
Expected: All 4 tests PASS

**Step 5: Commit**

```bash
git add src/utils/output.ts src/utils/output.test.ts
git commit -m "feat: add output formatting utilities"
```

---

### Task 4: Error Handling Utilities

**Files:**
- Create: `src/utils/errors.ts`
- Create: `src/utils/errors.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect } from "bun:test";
import { CLIError, handleError } from "./errors";

describe("CLIError", () => {
  it("creates error with message and exit code", () => {
    const error = new CLIError("File not found", 1);
    expect(error.message).toBe("File not found");
    expect(error.exitCode).toBe(1);
  });

  it("defaults to exit code 1", () => {
    const error = new CLIError("Something went wrong");
    expect(error.exitCode).toBe(1);
  });
});

describe("handleError", () => {
  it("extracts message from CLIError", () => {
    const error = new CLIError("Custom error");
    const result = handleError(error);
    expect(result.message).toBe("Custom error");
    expect(result.exitCode).toBe(1);
  });

  it("extracts message from standard Error", () => {
    const error = new Error("Standard error");
    const result = handleError(error);
    expect(result.message).toBe("Standard error");
    expect(result.exitCode).toBe(1);
  });

  it("handles unknown error types", () => {
    const result = handleError("string error");
    expect(result.message).toBe("An unexpected error occurred");
    expect(result.exitCode).toBe(1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test src/utils/errors.test.ts`
Expected: FAIL - Cannot find module "./errors"

**Step 3: Write implementation**

```typescript
export class CLIError extends Error {
  exitCode: number;

  constructor(message: string, exitCode: number = 1) {
    super(message);
    this.name = "CLIError";
    this.exitCode = exitCode;
  }
}

export interface ErrorResult {
  message: string;
  exitCode: number;
}

export function handleError(error: unknown): ErrorResult {
  if (error instanceof CLIError) {
    return {
      message: error.message,
      exitCode: error.exitCode,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      exitCode: 1,
    };
  }

  return {
    message: "An unexpected error occurred",
    exitCode: 1,
  };
}

export function exitWithError(error: unknown): never {
  const { message, exitCode } = handleError(error);
  console.error(`Error: ${message}`);
  process.exit(exitCode);
}
```

**Step 4: Run test to verify it passes**

Run: `bun test src/utils/errors.test.ts`
Expected: All 5 tests PASS

**Step 5: Commit**

```bash
git add src/utils/errors.ts src/utils/errors.test.ts
git commit -m "feat: add error handling utilities"
```

---

### Task 5: API Client - Core Structure

**Files:**
- Create: `src/client.ts`
- Create: `src/client.test.ts`
- Create: `src/types.ts`

**Step 1: Create types file**

```typescript
export interface ServerStatus {
  status: string;
  authenticated: boolean;
  service: string;
  versions: {
    obsidian: string;
    self: string;
  };
}

export interface Note {
  content: string;
  frontmatter?: Record<string, unknown>;
  path?: string;
  tags?: string[];
}

export interface Command {
  id: string;
  name: string;
}

export interface SearchResult {
  filename: string;
  score?: number;
  matches?: Array<{
    match: { start: number; end: number };
    context: string;
  }>;
}

export interface DirectoryEntry {
  path: string;
  type: "file" | "directory";
}

export type Period = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";

export interface PatchOptions {
  operation: "append" | "prepend" | "replace";
  targetType: "heading" | "block" | "frontmatter";
  target: string;
  delimiter?: string;
  trimWhitespace?: boolean;
}
```

**Step 2: Write the failing test for client**

```typescript
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
        Promise.resolve(new Response(JSON.stringify(mockResponse)))
      );

      const status = await client.getStatus();
      expect(status.authenticated).toBe(true);
      expect(status.service).toBe("Obsidian Local REST API");
    });
  });
});
```

**Step 3: Run test to verify it fails**

Run: `bun test src/client.test.ts`
Expected: FAIL - Cannot find module "./client"

**Step 4: Write implementation**

```typescript
import type {
  ServerStatus,
  Note,
  Command,
  SearchResult,
  Period,
  PatchOptions,
} from "./types";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export class ObsidianClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, ""); // Remove trailing slash
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      ...((options.headers as Record<string, string>) || {}),
    };

    const response = await fetch(url, {
      ...options,
      headers,
      // @ts-expect-error Bun supports this option for self-signed certs
      tls: { rejectUnauthorized: false },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new ApiError(text || response.statusText, response.status);
    }

    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      return response.json();
    }

    return response.text() as T;
  }

  async getStatus(): Promise<ServerStatus> {
    return this.request<ServerStatus>("/");
  }

  async getActiveFile(format: "json" | "markdown" = "markdown"): Promise<Note | string> {
    const accept =
      format === "json" ? "application/vnd.olrapi.note+json" : "text/markdown";
    return this.request<Note | string>("/active/", {
      headers: { Accept: accept },
    });
  }

  async updateActiveFile(content: string): Promise<void> {
    await this.request("/active/", {
      method: "PUT",
      headers: { "Content-Type": "text/markdown" },
      body: content,
    });
  }

  async appendToActiveFile(content: string): Promise<void> {
    await this.request("/active/", {
      method: "POST",
      headers: { "Content-Type": "text/markdown" },
      body: content,
    });
  }

  async deleteActiveFile(): Promise<void> {
    await this.request("/active/", { method: "DELETE" });
  }

  async patchActiveFile(content: string, options: PatchOptions): Promise<void> {
    await this.request("/active/", {
      method: "PATCH",
      headers: {
        "Content-Type": "text/markdown",
        Operation: options.operation,
        "Target-Type": options.targetType,
        Target: encodeURIComponent(options.target),
        ...(options.delimiter && { "Target-Delimiter": options.delimiter }),
        ...(options.trimWhitespace !== undefined && {
          "Trim-Target-Whitespace": String(options.trimWhitespace),
        }),
      },
      body: content,
    });
  }

  async getFile(path: string, format: "json" | "markdown" = "markdown"): Promise<Note | string> {
    const accept =
      format === "json" ? "application/vnd.olrapi.note+json" : "text/markdown";
    return this.request<Note | string>(`/vault/${encodeURIComponent(path)}`, {
      headers: { Accept: accept },
    });
  }

  async createFile(path: string, content: string): Promise<void> {
    await this.request(`/vault/${encodeURIComponent(path)}`, {
      method: "PUT",
      headers: { "Content-Type": "text/markdown" },
      body: content,
    });
  }

  async updateFile(path: string, content: string): Promise<void> {
    await this.request(`/vault/${encodeURIComponent(path)}`, {
      method: "PUT",
      headers: { "Content-Type": "text/markdown" },
      body: content,
    });
  }

  async appendToFile(path: string, content: string): Promise<void> {
    await this.request(`/vault/${encodeURIComponent(path)}`, {
      method: "POST",
      headers: { "Content-Type": "text/markdown" },
      body: content,
    });
  }

  async deleteFile(path: string): Promise<void> {
    await this.request(`/vault/${encodeURIComponent(path)}`, {
      method: "DELETE",
    });
  }

  async patchFile(path: string, content: string, options: PatchOptions): Promise<void> {
    await this.request(`/vault/${encodeURIComponent(path)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "text/markdown",
        Operation: options.operation,
        "Target-Type": options.targetType,
        Target: encodeURIComponent(options.target),
        ...(options.delimiter && { "Target-Delimiter": options.delimiter }),
        ...(options.trimWhitespace !== undefined && {
          "Trim-Target-Whitespace": String(options.trimWhitespace),
        }),
      },
      body: content,
    });
  }

  async listDirectory(path: string = ""): Promise<string[]> {
    const endpoint = path ? `/vault/${encodeURIComponent(path)}/` : "/vault/";
    const result = await this.request<{ files: string[] }>(endpoint);
    return result.files || [];
  }

  async search(query: string, contextLength: number = 100): Promise<SearchResult[]> {
    return this.request<SearchResult[]>(
      `/search/simple/?query=${encodeURIComponent(query)}&contextLength=${contextLength}`
    );
  }

  async searchDQL(query: string): Promise<unknown[]> {
    return this.request<unknown[]>("/search/", {
      method: "POST",
      headers: { "Content-Type": "application/vnd.olrapi.dataview.dql+txt" },
      body: query,
    });
  }

  async getCommands(): Promise<Command[]> {
    return this.request<Command[]>("/commands/");
  }

  async executeCommand(commandId: string): Promise<void> {
    await this.request(`/commands/${encodeURIComponent(commandId)}/`, {
      method: "POST",
    });
  }

  async openFile(path: string, newLeaf: boolean = false): Promise<void> {
    const query = newLeaf ? "?newLeaf=true" : "";
    await this.request(`/open/${encodeURIComponent(path)}${query}`, {
      method: "POST",
    });
  }

  async getPeriodicNote(
    period: Period,
    date?: { year: number; month: number; day: number },
    format: "json" | "markdown" = "markdown"
  ): Promise<Note | string> {
    const accept =
      format === "json" ? "application/vnd.olrapi.note+json" : "text/markdown";
    const path = date
      ? `/periodic/${period}/${date.year}/${date.month}/${date.day}/`
      : `/periodic/${period}/`;
    return this.request<Note | string>(path, {
      headers: { Accept: accept },
    });
  }

  async appendToPeriodicNote(
    period: Period,
    content: string,
    date?: { year: number; month: number; day: number }
  ): Promise<void> {
    const path = date
      ? `/periodic/${period}/${date.year}/${date.month}/${date.day}/`
      : `/periodic/${period}/`;
    await this.request(path, {
      method: "POST",
      headers: { "Content-Type": "text/markdown" },
      body: content,
    });
  }

  async updatePeriodicNote(
    period: Period,
    content: string,
    date?: { year: number; month: number; day: number }
  ): Promise<void> {
    const path = date
      ? `/periodic/${period}/${date.year}/${date.month}/${date.day}/`
      : `/periodic/${period}/`;
    await this.request(path, {
      method: "PUT",
      headers: { "Content-Type": "text/markdown" },
      body: content,
    });
  }

  async deletePeriodicNote(
    period: Period,
    date?: { year: number; month: number; day: number }
  ): Promise<void> {
    const path = date
      ? `/periodic/${period}/${date.year}/${date.month}/${date.day}/`
      : `/periodic/${period}/`;
    await this.request(path, { method: "DELETE" });
  }

  async patchPeriodicNote(
    period: Period,
    content: string,
    options: PatchOptions,
    date?: { year: number; month: number; day: number }
  ): Promise<void> {
    const path = date
      ? `/periodic/${period}/${date.year}/${date.month}/${date.day}/`
      : `/periodic/${period}/`;
    await this.request(path, {
      method: "PATCH",
      headers: {
        "Content-Type": "text/markdown",
        Operation: options.operation,
        "Target-Type": options.targetType,
        Target: encodeURIComponent(options.target),
        ...(options.delimiter && { "Target-Delimiter": options.delimiter }),
        ...(options.trimWhitespace !== undefined && {
          "Trim-Target-Whitespace": String(options.trimWhitespace),
        }),
      },
      body: content,
    });
  }
}
```

**Step 5: Run test to verify it passes**

Run: `bun test src/client.test.ts`
Expected: All tests PASS

**Step 6: Commit**

```bash
git add src/types.ts src/client.ts src/client.test.ts
git commit -m "feat: add API client with full endpoint coverage"
```

---

### Task 6: Status Command

**Files:**
- Create: `src/commands/status.ts`
- Modify: `src/index.ts`

**Step 1: Write the status command**

```typescript
import { Command } from "commander";
import { getConfig } from "../config";
import { ObsidianClient } from "../client";
import { print } from "../utils/output";
import { exitWithError } from "../utils/errors";

export function registerStatusCommand(program: Command): void {
  program
    .command("status")
    .description("Check connection to Obsidian")
    .action(async () => {
      try {
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);
        const status = await client.getStatus();

        const json = program.opts().json;

        if (json) {
          print(status, { json: true });
        } else {
          console.log(`Connected to ${status.service}`);
          console.log(`Obsidian version: ${status.versions.obsidian}`);
          console.log(`Plugin version: ${status.versions.self}`);
          console.log(`Authenticated: ${status.authenticated ? "Yes" : "No"}`);
        }
      } catch (error) {
        exitWithError(error);
      }
    });
}
```

**Step 2: Update index.ts with CLI setup**

```typescript
#!/usr/bin/env bun

import { Command } from "commander";
import { registerStatusCommand } from "./commands/status";

const program = new Command();

program
  .name("obsidian")
  .description("CLI for Obsidian using Local REST API")
  .version("0.1.0")
  .option("--json", "Output as JSON");

registerStatusCommand(program);

program.parse();
```

**Step 3: Test manually**

Run: `OBSIDIAN_API_KEY=your-key bun run src/index.ts status`
Expected: Shows connection status or error message

**Step 4: Commit**

```bash
git add src/commands/status.ts src/index.ts
git commit -m "feat: add status command"
```

---

### Task 7: Note Command

**Files:**
- Create: `src/commands/note.ts`
- Modify: `src/index.ts`

**Step 1: Write the note command**

```typescript
import { Command } from "commander";
import { getConfig } from "../config";
import { ObsidianClient } from "../client";
import { print } from "../utils/output";
import { exitWithError } from "../utils/errors";
import type { PatchOptions } from "../types";

export function registerNoteCommand(program: Command): void {
  const note = program
    .command("note")
    .description("Manage vault notes");

  note
    .command("read <path>")
    .description("Read a note from the vault")
    .option("--metadata", "Include frontmatter and metadata")
    .action(async (path: string, options: { metadata?: boolean }) => {
      try {
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);
        const format = options.metadata ? "json" : "markdown";
        const content = await client.getFile(path, format);
        const json = program.opts().json;
        print(content, { json });
      } catch (error) {
        exitWithError(error);
      }
    });

  note
    .command("create <path> [content]")
    .description("Create a new note")
    .option("-f, --file <file>", "Read content from file")
    .action(async (path: string, content?: string, options?: { file?: string }) => {
      try {
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);

        let body = content || "";
        if (options?.file) {
          body = await Bun.file(options.file).text();
        }

        await client.createFile(path, body);
        const json = program.opts().json;
        print(json ? { success: true, path } : `Created: ${path}`, { json });
      } catch (error) {
        exitWithError(error);
      }
    });

  note
    .command("update <path> [content]")
    .description("Update an existing note")
    .option("-f, --file <file>", "Read content from file")
    .action(async (path: string, content?: string, options?: { file?: string }) => {
      try {
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);

        let body = content || "";
        if (options?.file) {
          body = await Bun.file(options.file).text();
        }

        await client.updateFile(path, body);
        const json = program.opts().json;
        print(json ? { success: true, path } : `Updated: ${path}`, { json });
      } catch (error) {
        exitWithError(error);
      }
    });

  note
    .command("delete <path>")
    .description("Delete a note")
    .action(async (path: string) => {
      try {
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);
        await client.deleteFile(path);
        const json = program.opts().json;
        print(json ? { success: true, path } : `Deleted: ${path}`, { json });
      } catch (error) {
        exitWithError(error);
      }
    });

  note
    .command("append <path> <content>")
    .description("Append content to a note")
    .action(async (path: string, content: string) => {
      try {
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);
        await client.appendToFile(path, content);
        const json = program.opts().json;
        print(json ? { success: true, path } : `Appended to: ${path}`, { json });
      } catch (error) {
        exitWithError(error);
      }
    });

  note
    .command("patch <path> <content>")
    .description("Insert content relative to a heading, block, or frontmatter")
    .requiredOption("--target <target>", "Target location (heading name, block ID, or frontmatter field)")
    .requiredOption("--type <type>", "Target type: heading, block, or frontmatter")
    .option("--operation <op>", "Operation: append, prepend, or replace", "append")
    .action(async (path: string, content: string, options: {
      target: string;
      type: string;
      operation: string;
    }) => {
      try {
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);

        const patchOptions: PatchOptions = {
          target: options.target,
          targetType: options.type as PatchOptions["targetType"],
          operation: options.operation as PatchOptions["operation"],
        };

        await client.patchFile(path, content, patchOptions);
        const json = program.opts().json;
        print(json ? { success: true, path } : `Patched: ${path}`, { json });
      } catch (error) {
        exitWithError(error);
      }
    });
}
```

**Step 2: Register in index.ts**

Add import and registration:

```typescript
import { registerNoteCommand } from "./commands/note";
// ...
registerNoteCommand(program);
```

**Step 3: Test manually**

Run: `OBSIDIAN_API_KEY=your-key bun run src/index.ts note read inbox.md`
Expected: Displays note content or error

**Step 4: Commit**

```bash
git add src/commands/note.ts src/index.ts
git commit -m "feat: add note command with CRUD operations"
```

---

### Task 8: Active Command

**Files:**
- Create: `src/commands/active.ts`
- Modify: `src/index.ts`

**Step 1: Write the active command**

```typescript
import { Command } from "commander";
import { getConfig } from "../config";
import { ObsidianClient } from "../client";
import { print } from "../utils/output";
import { exitWithError } from "../utils/errors";
import type { PatchOptions } from "../types";

export function registerActiveCommand(program: Command): void {
  const active = program
    .command("active")
    .description("Manage the currently active file in Obsidian");

  active
    .command("read")
    .description("Read the currently active file")
    .option("--metadata", "Include frontmatter and metadata")
    .action(async (options: { metadata?: boolean }) => {
      try {
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);
        const format = options.metadata ? "json" : "markdown";
        const content = await client.getActiveFile(format);
        const json = program.opts().json;
        print(content, { json });
      } catch (error) {
        exitWithError(error);
      }
    });

  active
    .command("update [content]")
    .description("Update the currently active file")
    .option("-f, --file <file>", "Read content from file")
    .action(async (content?: string, options?: { file?: string }) => {
      try {
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);

        let body = content || "";
        if (options?.file) {
          body = await Bun.file(options.file).text();
        }

        await client.updateActiveFile(body);
        const json = program.opts().json;
        print(json ? { success: true } : "Updated active file", { json });
      } catch (error) {
        exitWithError(error);
      }
    });

  active
    .command("delete")
    .description("Delete the currently active file")
    .action(async () => {
      try {
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);
        await client.deleteActiveFile();
        const json = program.opts().json;
        print(json ? { success: true } : "Deleted active file", { json });
      } catch (error) {
        exitWithError(error);
      }
    });

  active
    .command("append <content>")
    .description("Append content to the currently active file")
    .action(async (content: string) => {
      try {
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);
        await client.appendToActiveFile(content);
        const json = program.opts().json;
        print(json ? { success: true } : "Appended to active file", { json });
      } catch (error) {
        exitWithError(error);
      }
    });

  active
    .command("patch <content>")
    .description("Insert content relative to a heading, block, or frontmatter")
    .requiredOption("--target <target>", "Target location")
    .requiredOption("--type <type>", "Target type: heading, block, or frontmatter")
    .option("--operation <op>", "Operation: append, prepend, or replace", "append")
    .action(async (content: string, options: {
      target: string;
      type: string;
      operation: string;
    }) => {
      try {
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);

        const patchOptions: PatchOptions = {
          target: options.target,
          targetType: options.type as PatchOptions["targetType"],
          operation: options.operation as PatchOptions["operation"],
        };

        await client.patchActiveFile(content, patchOptions);
        const json = program.opts().json;
        print(json ? { success: true } : "Patched active file", { json });
      } catch (error) {
        exitWithError(error);
      }
    });
}
```

**Step 2: Register in index.ts**

Add import and registration:

```typescript
import { registerActiveCommand } from "./commands/active";
// ...
registerActiveCommand(program);
```

**Step 3: Commit**

```bash
git add src/commands/active.ts src/index.ts
git commit -m "feat: add active command for current file operations"
```

---

### Task 9: Daily Command (Alias for Periodic Daily)

**Files:**
- Create: `src/commands/daily.ts`
- Modify: `src/index.ts`

**Step 1: Write the daily command**

```typescript
import { Command } from "commander";
import { getConfig } from "../config";
import { ObsidianClient } from "../client";
import { print } from "../utils/output";
import { exitWithError } from "../utils/errors";
import type { PatchOptions } from "../types";

export function registerDailyCommand(program: Command): void {
  const daily = program
    .command("daily")
    .description("Manage daily notes (shortcut for periodic daily)");

  daily
    .command("read")
    .description("Read today's daily note")
    .option("--metadata", "Include frontmatter and metadata")
    .option("--date <date>", "Specific date (YYYY-MM-DD)")
    .action(async (options: { metadata?: boolean; date?: string }) => {
      try {
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);

        const date = options.date ? parseDate(options.date) : undefined;
        const format = options.metadata ? "json" : "markdown";
        const content = await client.getPeriodicNote("daily", date, format);
        const json = program.opts().json;
        print(content, { json });
      } catch (error) {
        exitWithError(error);
      }
    });

  daily
    .command("append <content>")
    .description("Append content to today's daily note")
    .option("--date <date>", "Specific date (YYYY-MM-DD)")
    .action(async (content: string, options: { date?: string }) => {
      try {
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);

        const date = options.date ? parseDate(options.date) : undefined;
        await client.appendToPeriodicNote("daily", content, date);
        const json = program.opts().json;
        print(json ? { success: true } : "Appended to daily note", { json });
      } catch (error) {
        exitWithError(error);
      }
    });

  daily
    .command("update [content]")
    .description("Update today's daily note")
    .option("-f, --file <file>", "Read content from file")
    .option("--date <date>", "Specific date (YYYY-MM-DD)")
    .action(async (content?: string, options?: { file?: string; date?: string }) => {
      try {
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);

        let body = content || "";
        if (options?.file) {
          body = await Bun.file(options.file).text();
        }

        const date = options?.date ? parseDate(options.date) : undefined;
        await client.updatePeriodicNote("daily", body, date);
        const json = program.opts().json;
        print(json ? { success: true } : "Updated daily note", { json });
      } catch (error) {
        exitWithError(error);
      }
    });

  daily
    .command("delete")
    .description("Delete today's daily note")
    .option("--date <date>", "Specific date (YYYY-MM-DD)")
    .action(async (options: { date?: string }) => {
      try {
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);

        const date = options.date ? parseDate(options.date) : undefined;
        await client.deletePeriodicNote("daily", date);
        const json = program.opts().json;
        print(json ? { success: true } : "Deleted daily note", { json });
      } catch (error) {
        exitWithError(error);
      }
    });

  daily
    .command("patch <content>")
    .description("Insert content relative to a heading, block, or frontmatter")
    .requiredOption("--target <target>", "Target location")
    .requiredOption("--type <type>", "Target type: heading, block, or frontmatter")
    .option("--operation <op>", "Operation: append, prepend, or replace", "append")
    .option("--date <date>", "Specific date (YYYY-MM-DD)")
    .action(async (content: string, options: {
      target: string;
      type: string;
      operation: string;
      date?: string;
    }) => {
      try {
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);

        const patchOptions: PatchOptions = {
          target: options.target,
          targetType: options.type as PatchOptions["targetType"],
          operation: options.operation as PatchOptions["operation"],
        };

        const date = options.date ? parseDate(options.date) : undefined;
        await client.patchPeriodicNote("daily", content, patchOptions, date);
        const json = program.opts().json;
        print(json ? { success: true } : "Patched daily note", { json });
      } catch (error) {
        exitWithError(error);
      }
    });
}

function parseDate(dateStr: string): { year: number; month: number; day: number } {
  const [year, month, day] = dateStr.split("-").map(Number);
  return { year, month, day };
}
```

**Step 2: Register in index.ts**

Add import and registration:

```typescript
import { registerDailyCommand } from "./commands/daily";
// ...
registerDailyCommand(program);
```

**Step 3: Commit**

```bash
git add src/commands/daily.ts src/index.ts
git commit -m "feat: add daily command for daily notes"
```

---

### Task 10: Periodic Command

**Files:**
- Create: `src/commands/periodic.ts`
- Modify: `src/index.ts`

**Step 1: Write the periodic command**

```typescript
import { Command } from "commander";
import { getConfig } from "../config";
import { ObsidianClient } from "../client";
import { print } from "../utils/output";
import { exitWithError } from "../utils/errors";
import type { Period, PatchOptions } from "../types";

const VALID_PERIODS: Period[] = ["daily", "weekly", "monthly", "quarterly", "yearly"];

export function registerPeriodicCommand(program: Command): void {
  const periodic = program
    .command("periodic <period>")
    .description("Manage periodic notes (daily, weekly, monthly, quarterly, yearly)");

  periodic
    .command("read")
    .description("Read the current periodic note")
    .option("--metadata", "Include frontmatter and metadata")
    .option("--date <date>", "Specific date (YYYY-MM-DD)")
    .action(async (options: { metadata?: boolean; date?: string }) => {
      try {
        const period = validatePeriod(periodic.args[0]);
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);

        const date = options.date ? parseDate(options.date) : undefined;
        const format = options.metadata ? "json" : "markdown";
        const content = await client.getPeriodicNote(period, date, format);
        const json = program.opts().json;
        print(content, { json });
      } catch (error) {
        exitWithError(error);
      }
    });

  periodic
    .command("append <content>")
    .description("Append content to the periodic note")
    .option("--date <date>", "Specific date (YYYY-MM-DD)")
    .action(async (content: string, options: { date?: string }) => {
      try {
        const period = validatePeriod(periodic.args[0]);
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);

        const date = options.date ? parseDate(options.date) : undefined;
        await client.appendToPeriodicNote(period, content, date);
        const json = program.opts().json;
        print(json ? { success: true } : `Appended to ${period} note`, { json });
      } catch (error) {
        exitWithError(error);
      }
    });

  periodic
    .command("update [content]")
    .description("Update the periodic note")
    .option("-f, --file <file>", "Read content from file")
    .option("--date <date>", "Specific date (YYYY-MM-DD)")
    .action(async (content?: string, options?: { file?: string; date?: string }) => {
      try {
        const period = validatePeriod(periodic.args[0]);
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);

        let body = content || "";
        if (options?.file) {
          body = await Bun.file(options.file).text();
        }

        const date = options?.date ? parseDate(options.date) : undefined;
        await client.updatePeriodicNote(period, body, date);
        const json = program.opts().json;
        print(json ? { success: true } : `Updated ${period} note`, { json });
      } catch (error) {
        exitWithError(error);
      }
    });

  periodic
    .command("delete")
    .description("Delete the periodic note")
    .option("--date <date>", "Specific date (YYYY-MM-DD)")
    .action(async (options: { date?: string }) => {
      try {
        const period = validatePeriod(periodic.args[0]);
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);

        const date = options.date ? parseDate(options.date) : undefined;
        await client.deletePeriodicNote(period, date);
        const json = program.opts().json;
        print(json ? { success: true } : `Deleted ${period} note`, { json });
      } catch (error) {
        exitWithError(error);
      }
    });

  periodic
    .command("patch <content>")
    .description("Insert content relative to a heading, block, or frontmatter")
    .requiredOption("--target <target>", "Target location")
    .requiredOption("--type <type>", "Target type: heading, block, or frontmatter")
    .option("--operation <op>", "Operation: append, prepend, or replace", "append")
    .option("--date <date>", "Specific date (YYYY-MM-DD)")
    .action(async (content: string, options: {
      target: string;
      type: string;
      operation: string;
      date?: string;
    }) => {
      try {
        const period = validatePeriod(periodic.args[0]);
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);

        const patchOptions: PatchOptions = {
          target: options.target,
          targetType: options.type as PatchOptions["targetType"],
          operation: options.operation as PatchOptions["operation"],
        };

        const date = options.date ? parseDate(options.date) : undefined;
        await client.patchPeriodicNote(period, content, patchOptions, date);
        const json = program.opts().json;
        print(json ? { success: true } : `Patched ${period} note`, { json });
      } catch (error) {
        exitWithError(error);
      }
    });
}

function validatePeriod(period: string): Period {
  if (!VALID_PERIODS.includes(period as Period)) {
    throw new Error(`Invalid period: ${period}. Must be one of: ${VALID_PERIODS.join(", ")}`);
  }
  return period as Period;
}

function parseDate(dateStr: string): { year: number; month: number; day: number } {
  const [year, month, day] = dateStr.split("-").map(Number);
  return { year, month, day };
}
```

**Step 2: Register in index.ts**

Add import and registration:

```typescript
import { registerPeriodicCommand } from "./commands/periodic";
// ...
registerPeriodicCommand(program);
```

**Step 3: Commit**

```bash
git add src/commands/periodic.ts src/index.ts
git commit -m "feat: add periodic command for all periodic note types"
```

---

### Task 11: Search Command

**Files:**
- Create: `src/commands/search.ts`
- Modify: `src/index.ts`

**Step 1: Write the search command**

```typescript
import { Command } from "commander";
import { getConfig } from "../config";
import { ObsidianClient } from "../client";
import { print } from "../utils/output";
import { exitWithError } from "../utils/errors";

export function registerSearchCommand(program: Command): void {
  program
    .command("search <query>")
    .description("Search for content in the vault")
    .option("--dql", "Use Dataview DQL query instead of simple search")
    .option("--context <length>", "Context length for simple search", "100")
    .action(async (query: string, options: { dql?: boolean; context: string }) => {
      try {
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);
        const json = program.opts().json;

        if (options.dql) {
          const results = await client.searchDQL(query);
          print(results, { json });
        } else {
          const results = await client.search(query, parseInt(options.context));

          if (json) {
            print(results, { json: true });
          } else {
            if (results.length === 0) {
              console.log("No results found.");
              return;
            }

            for (const result of results) {
              console.log(`\n${result.filename}`);
              if (result.matches) {
                for (const match of result.matches) {
                  console.log(`  ...${match.context}...`);
                }
              }
            }
          }
        }
      } catch (error) {
        exitWithError(error);
      }
    });
}
```

**Step 2: Register in index.ts**

Add import and registration:

```typescript
import { registerSearchCommand } from "./commands/search";
// ...
registerSearchCommand(program);
```

**Step 3: Commit**

```bash
git add src/commands/search.ts src/index.ts
git commit -m "feat: add search command with simple and DQL modes"
```

---

### Task 12: Commands Command

**Files:**
- Create: `src/commands/commands.ts`
- Modify: `src/index.ts`

**Step 1: Write the commands command**

```typescript
import { Command } from "commander";
import { getConfig } from "../config";
import { ObsidianClient } from "../client";
import { print } from "../utils/output";
import { exitWithError } from "../utils/errors";

export function registerCommandsCommand(program: Command): void {
  const commands = program
    .command("commands")
    .description("List and execute Obsidian commands");

  commands
    .command("list")
    .description("List all available commands")
    .action(async () => {
      try {
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);
        const commandList = await client.getCommands();
        const json = program.opts().json;

        if (json) {
          print(commandList, { json: true });
        } else {
          for (const cmd of commandList) {
            console.log(`${cmd.id}: ${cmd.name}`);
          }
        }
      } catch (error) {
        exitWithError(error);
      }
    });

  commands
    .command("exec <commandId>")
    .description("Execute a command by ID")
    .action(async (commandId: string) => {
      try {
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);
        await client.executeCommand(commandId);
        const json = program.opts().json;
        print(json ? { success: true, commandId } : `Executed: ${commandId}`, { json });
      } catch (error) {
        exitWithError(error);
      }
    });
}
```

**Step 2: Register in index.ts**

Add import and registration:

```typescript
import { registerCommandsCommand } from "./commands/commands";
// ...
registerCommandsCommand(program);
```

**Step 3: Commit**

```bash
git add src/commands/commands.ts src/index.ts
git commit -m "feat: add commands command to list and execute Obsidian commands"
```

---

### Task 13: Open Command

**Files:**
- Create: `src/commands/open.ts`
- Modify: `src/index.ts`

**Step 1: Write the open command**

```typescript
import { Command } from "commander";
import { getConfig } from "../config";
import { ObsidianClient } from "../client";
import { print } from "../utils/output";
import { exitWithError } from "../utils/errors";

export function registerOpenCommand(program: Command): void {
  program
    .command("open <path>")
    .description("Open a file in Obsidian")
    .option("--new-leaf", "Open in a new leaf/tab")
    .action(async (path: string, options: { newLeaf?: boolean }) => {
      try {
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);
        await client.openFile(path, options.newLeaf);
        const json = program.opts().json;
        print(json ? { success: true, path } : `Opened: ${path}`, { json });
      } catch (error) {
        exitWithError(error);
      }
    });
}
```

**Step 2: Register in index.ts**

Add import and registration:

```typescript
import { registerOpenCommand } from "./commands/open";
// ...
registerOpenCommand(program);
```

**Step 3: Commit**

```bash
git add src/commands/open.ts src/index.ts
git commit -m "feat: add open command to open files in Obsidian"
```

---

### Task 14: Vault Command

**Files:**
- Create: `src/commands/vault.ts`
- Modify: `src/index.ts`

**Step 1: Write the vault command**

```typescript
import { Command } from "commander";
import { getConfig } from "../config";
import { ObsidianClient } from "../client";
import { print } from "../utils/output";
import { exitWithError } from "../utils/errors";

export function registerVaultCommand(program: Command): void {
  const vault = program
    .command("vault")
    .description("Browse vault files and directories");

  vault
    .command("list [path]")
    .description("List files in a directory")
    .action(async (path?: string) => {
      try {
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);
        const files = await client.listDirectory(path);
        const json = program.opts().json;

        if (json) {
          print(files, { json: true });
        } else {
          for (const file of files) {
            console.log(file);
          }
        }
      } catch (error) {
        exitWithError(error);
      }
    });
}
```

**Step 2: Register in index.ts**

Add import and registration:

```typescript
import { registerVaultCommand } from "./commands/vault";
// ...
registerVaultCommand(program);
```

**Step 3: Commit**

```bash
git add src/commands/vault.ts src/index.ts
git commit -m "feat: add vault command to list files and directories"
```

---

### Task 15: Final Index.ts and README

**Files:**
- Modify: `src/index.ts` (final version)
- Create: `README.md`

**Step 1: Final index.ts**

```typescript
#!/usr/bin/env bun

import { Command } from "commander";
import { registerStatusCommand } from "./commands/status";
import { registerNoteCommand } from "./commands/note";
import { registerActiveCommand } from "./commands/active";
import { registerDailyCommand } from "./commands/daily";
import { registerPeriodicCommand } from "./commands/periodic";
import { registerSearchCommand } from "./commands/search";
import { registerCommandsCommand } from "./commands/commands";
import { registerOpenCommand } from "./commands/open";
import { registerVaultCommand } from "./commands/vault";

const program = new Command();

program
  .name("obsidian")
  .description("CLI for Obsidian using Local REST API")
  .version("0.1.0")
  .option("--json", "Output as JSON");

registerStatusCommand(program);
registerNoteCommand(program);
registerActiveCommand(program);
registerDailyCommand(program);
registerPeriodicCommand(program);
registerSearchCommand(program);
registerCommandsCommand(program);
registerOpenCommand(program);
registerVaultCommand(program);

program.parse();
```

**Step 2: Create README.md**

```markdown
# Obsidian CLI

A command-line interface for [Obsidian](https://obsidian.md/) using the [Local REST API](https://github.com/coddingtonbear/obsidian-local-rest-api) plugin.

## Prerequisites

1. [Obsidian](https://obsidian.md/) installed
2. [Local REST API plugin](https://github.com/coddingtonbear/obsidian-local-rest-api) installed and enabled
3. [Bun](https://bun.sh/) runtime

## Installation

```bash
git clone git@github.com:nickcramaro/obsidian-cli.git
cd obsidian-cli
bun install
bun link
```

## Configuration

Set environment variables in your shell profile:

```bash
export OBSIDIAN_API_KEY="your-api-key-from-obsidian-settings"
export OBSIDIAN_API_URL="https://127.0.0.1:27124"  # optional, this is the default
```

Get your API key from: Obsidian Settings → Local REST API

## Usage

### Check Connection

```bash
obsidian status
```

### Notes

```bash
# Read a note
obsidian note read inbox.md

# Create a note
obsidian note create "projects/idea.md" "# My Idea"

# Update a note
obsidian note update inbox.md "New content"

# Append to a note
obsidian note append inbox.md "- New item"

# Delete a note
obsidian note delete old-note.md

# Patch a note (insert at specific location)
obsidian note patch inbox.md "New task" --target "## Tasks" --type heading --operation append
```

### Active File

```bash
# Read currently open file
obsidian active read

# Append to active file
obsidian active append "New content"
```

### Daily Notes

```bash
# Read today's daily note
obsidian daily read

# Append to today's note
obsidian daily append "- Meeting notes"

# Work with specific date
obsidian daily read --date 2025-01-15
```

### Periodic Notes

```bash
# Read weekly note
obsidian periodic weekly read

# Append to monthly note
obsidian periodic monthly append "## Goals"
```

### Search

```bash
# Simple search
obsidian search "project ideas"

# Dataview DQL query
obsidian search "TABLE file.name FROM \"projects\"" --dql
```

### Commands

```bash
# List available commands
obsidian commands list

# Execute a command
obsidian commands exec "app:reload"
```

### Open Files

```bash
# Open file in Obsidian
obsidian open inbox.md

# Open in new tab
obsidian open inbox.md --new-leaf
```

### Vault

```bash
# List root directory
obsidian vault list

# List specific directory
obsidian vault list projects/
```

## Global Options

- `--json` - Output as JSON (for scripting)
- `--help` - Show help

## License

MIT
```

**Step 3: Commit**

```bash
git add src/index.ts README.md
git commit -m "docs: add README with usage instructions"
```

---

### Task 16: Push to Remote

**Step 1: Push to GitHub**

```bash
git push -u origin main
```

---

## Summary

This plan creates a complete Obsidian CLI with:

- **9 commands**: status, note, active, daily, periodic, search, commands, open, vault
- **Full CRUD operations** on notes
- **Periodic notes support** for all periods
- **Search** with simple and DQL modes
- **Command execution** from terminal
- **Human-friendly output** with `--json` flag for scripting

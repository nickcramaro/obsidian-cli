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
      // @ts-ignore Bun supports this option for self-signed certs
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

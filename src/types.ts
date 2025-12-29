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

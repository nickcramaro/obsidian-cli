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

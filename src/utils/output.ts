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

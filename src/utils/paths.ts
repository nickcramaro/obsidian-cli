/**
 * Ensures a path has the .md extension.
 * If the path already ends with .md, returns it unchanged.
 * Otherwise, appends .md to the path.
 */
export function ensureMdExtension(path: string): string {
  if (path.endsWith(".md")) {
    return path;
  }
  return `${path}.md`;
}

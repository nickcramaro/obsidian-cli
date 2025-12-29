# Obsidian CLI Design

A command-line interface for Obsidian using the Local REST API plugin.

## Prerequisites

1. [Obsidian](https://obsidian.md/) with [Local REST API plugin](https://github.com/coddingtonbear/obsidian-local-rest-api) installed and enabled
2. [Bun](https://bun.sh/) runtime
3. API key from Obsidian Settings → Local REST API

## Tech Stack

- **Runtime**: Bun
- **CLI Framework**: Commander.js
- **HTTP**: Native fetch (built into Bun)

## Configuration

Environment variables only (12-factor style):

- `OBSIDIAN_API_KEY` (required) - API key from plugin settings
- `OBSIDIAN_API_URL` (optional) - Defaults to `https://127.0.0.1:27124`

Certificate verification is skipped since the API runs locally.

## Project Structure

```
obsidian-cli/
├── src/
│   ├── index.ts          # Entry point, CLI setup
│   ├── client.ts         # HTTP client wrapper for the API
│   ├── config.ts         # Environment variable handling
│   ├── commands/
│   │   ├── note.ts       # note read|create|update|delete|append|patch
│   │   ├── active.ts     # active read|update|delete|append|patch
│   │   ├── daily.ts      # daily [read|append|...] (alias for periodic daily)
│   │   ├── periodic.ts   # periodic <period> [date] read|append|...
│   │   ├── search.ts     # search <query> [--dql]
│   │   ├── commands.ts   # commands list|exec <id>
│   │   └── open.ts       # open <file> [--new-leaf]
│   └── utils/
│       ├── output.ts     # Human vs JSON output formatting
│       └── errors.ts     # Error handling & display
├── package.json
├── tsconfig.json
└── README.md
```

## Command Structure

```
obsidian <command> <subcommand> [args] [options]
```

### Global Options

- `--json` - Output as JSON
- `--help` - Show help

### Commands

| Command | Subcommands | Example |
|---------|-------------|---------|
| `note` | `read`, `create`, `update`, `delete`, `append`, `patch` | `obsidian note read inbox.md` |
| `active` | `read`, `update`, `delete`, `append`, `patch` | `obsidian active read` |
| `daily` | `read`, `append`, `update`, `delete`, `patch` | `obsidian daily append "- Buy milk"` |
| `periodic` | `read`, `append`, `update`, `delete`, `patch` | `obsidian periodic weekly read` |
| `search` | (none) | `obsidian search "project ideas"` |
| `commands` | `list`, `exec` | `obsidian commands exec "app:reload"` |
| `open` | (none) | `obsidian open inbox.md --new-leaf` |
| `vault` | `list` | `obsidian vault list [path]` |
| `status` | (none) | `obsidian status` (check connection) |

### Patch Operations

Patch uses flags for targeting:

```bash
obsidian note patch inbox.md "new content" \
  --target "## Tasks" \
  --operation append \
  --type heading
```

## API Client

```typescript
class ObsidianClient {
  constructor(apiKey: string, baseUrl: string)

  // Core methods matching API structure
  getActiveFile(format?: 'json' | 'markdown'): Promise<Note | string>
  getFile(path: string, format?: 'json' | 'markdown'): Promise<Note | string>
  createFile(path: string, content: string): Promise<void>
  updateFile(path: string, content: string): Promise<void>
  appendToFile(path: string, content: string): Promise<void>
  deleteFile(path: string): Promise<void>
  patchFile(path: string, content: string, options: PatchOptions): Promise<void>

  listDirectory(path?: string): Promise<string[]>
  search(query: string, contextLength?: number): Promise<SearchResult[]>
  searchDQL(query: string): Promise<any[]>

  getCommands(): Promise<Command[]>
  executeCommand(id: string): Promise<void>

  openFile(path: string, newLeaf?: boolean): Promise<void>
  getStatus(): Promise<ServerStatus>

  getPeriodicNote(period: Period, date?: Date): Promise<Note | string>
  appendToPeriodicNote(period: Period, content: string, date?: Date): Promise<void>
  updatePeriodicNote(period: Period, content: string, date?: Date): Promise<void>
  deletePeriodicNote(period: Period, date?: Date): Promise<void>
  patchPeriodicNote(period: Period, content: string, options: PatchOptions, date?: Date): Promise<void>
}
```

## Output Handling

- **Default**: Human-friendly output (markdown rendered, tables for lists, colored status)
- **`--json` flag**: Raw JSON output for scripting

## Error Handling

Clear, actionable error messages:

- `Error: OBSIDIAN_API_KEY not set. Get it from Obsidian Settings → Local REST API`
- `Error: Cannot connect to Obsidian. Is the Local REST API plugin running?`
- `Error: File not found: projects/missing.md`

## Installation

```bash
git clone git@github.com:nickcramaro/obsidian-cli.git
cd obsidian-cli
bun install
bun link
```

## Setup

Add to shell profile:

```bash
export OBSIDIAN_API_KEY="your-key-from-obsidian-settings"
export OBSIDIAN_API_URL="https://127.0.0.1:27124"  # optional
```

## Usage Examples

```bash
# Check connection
obsidian status

# Read current file in Obsidian
obsidian active read

# Quick capture to daily note
obsidian daily append "- Meeting notes from standup"

# Create a new note
obsidian note create "projects/new-idea.md" "# New Idea\n\nDetails here..."

# Search vault
obsidian search "quarterly review"

# List available commands
obsidian commands list

# Open a file in Obsidian
obsidian open "inbox.md"

# List files in a folder
obsidian vault list "projects/"
```

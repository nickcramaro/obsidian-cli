# Obsidian CLI

A command-line interface for [Obsidian](https://obsidian.md/) using the [Local REST API](https://github.com/coddingtonbear/obsidian-local-rest-api) plugin.

## Prerequisites

1. [Obsidian](https://obsidian.md/) installed
2. [Local REST API plugin](https://github.com/coddingtonbear/obsidian-local-rest-api) installed and enabled

## Installation

```bash
curl -fsSL https://raw.githubusercontent.com/nickcramaro/obsidian-cli/main/install.sh | bash
```

Or install to a custom location:

```bash
INSTALL_DIR=~/.local/bin curl -fsSL https://raw.githubusercontent.com/nickcramaro/obsidian-cli/main/install.sh | bash
```

## Configuration

Set your API key (get it from Obsidian Settings → Local REST API):

```bash
export OBSIDIAN_API_KEY="your-api-key"
```

Optionally set a custom API URL (default is `https://127.0.0.1:27124`):

```bash
export OBSIDIAN_API_URL="https://localhost:8080"
```

Add these to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.) to persist them.

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

## Building from Source

Requires [Bun](https://bun.sh/):

```bash
git clone https://github.com/nickcramaro/obsidian-cli.git
cd obsidian-cli
bun install
bun run build
```

## License

MIT

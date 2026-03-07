# Supabase MCP Setup (VS Code)

This project is configured to use the official Supabase MCP server via `.vscode/mcp.json`.

## 1) Create a Supabase personal access token

In Supabase dashboard:
- Go to `Account Settings` -> `Access Tokens`
- Create a token for MCP usage

## 2) Export token in your shell

Add this to your shell profile (`~/.zshrc` on macOS zsh):

```bash
export SUPABASE_ACCESS_TOKEN="your_supabase_pat_here"
```

Then reload:

```bash
source ~/.zshrc
```

## 3) Restart VS Code

Fully restart VS Code so the MCP server picks up the new environment variable.

## 4) Optional: lock MCP to a single Supabase project

If you want MCP limited to one project, edit `.vscode/mcp.json` and add args:

```json
"args": [
  "-y",
  "@supabase/mcp-server-supabase@latest",
  "--project-ref",
  "your_project_ref"
]
```

## 5) Optional: force read-only mode

Add `"--read-only"` to args in `.vscode/mcp.json`:

```json
"args": [
  "-y",
  "@supabase/mcp-server-supabase@latest",
  "--read-only"
]
```

## Current workspace config

`./.vscode/mcp.json` runs:
- package: `@supabase/mcp-server-supabase@latest`
- auth source: `SUPABASE_ACCESS_TOKEN` environment variable


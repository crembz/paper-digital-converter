# Paper → Digital Converter

Desktop app that converts paper notes (photos/PDFs) into digital markdown using LLM vision models.

## Features

- Drag & drop images or PDFs
- Batch processing for multiple files
- Configurable LLM provider (OpenAI, Anthropic, or OpenAI-compatible)
- Conflict resolution when output files already exist (rename, overwrite, skip)
- Real-time conversion progress tracking
- Editable markdown output
- Dark theme UI

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- An API key for your chosen LLM provider

## Getting Started

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Configuration

On first launch, select your LLM provider and enter your API key in the app settings panel.

### Environment Variables (Optional)

Override config by setting these in a `.env` file:

| Variable | Description |
|---|---|
| `VITE_LLM_PROVIDER` | `openai`, `anthropic`, or custom provider name |
| `VITE_LLM_MODEL` | Model name (e.g. `gpt-4o`, `claude-sonnet-4-20250514`) |
| `VITE_LLM_API_KEY` | API key |
| `VITE_LLM_BASE_URL` | Custom API base URL (for OpenAI-compatible providers) |

## Usage

1. **Configure** your LLM provider in the settings panel
2. **Upload** images or PDFs via drag & drop or file picker
3. **Convert** — click Convert, select an output folder
4. **Edit** — review and edit the generated markdown in the output panel
5. **Save** — the markdown is saved to your chosen folder automatically

### Batch Conversion

Upload multiple files at once. After selecting an output folder, choose how to handle existing files:

- **Skip existing files** — leave unchanged files untouched
- **Overwrite existing** — replace existing files
- **Rename & process** — keep both files with a timestamped rename

## Tech Stack

- **Framework**: Electron + React
- **Build**: Vite + electron-builder
- **PDF Rendering**: pdfjs-dist
- **LLM Integration**: OpenAI SDK, Anthropic SDK
- **UI**: Custom dark theme (Catppuccin Mocha palette)

## License

MIT

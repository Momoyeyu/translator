# Translator Agent

An ACPs-compliant multi-language document translation agent with intelligent chunking, term clarification, and post-translation chat assistant.

## Features

- **Multi-format support**: Plain text, Markdown, PDF, DOCX, HTML
- **Intelligent pipeline**: Plan → Clarify → Translate → Unify
- **Term management**: Automatic specialized term extraction with user confirmation
- **Large document handling**: Smart chunking with cross-chunk context coherence
- **Multi-language**: Any target language supported via LLM
- **ACPs compliant**: Discoverable and callable by other agents via AIP RPC
- **Export**: Markdown and PDF output

## Architecture

- **Backend**: FastAPI (async) + PostgreSQL + Redis + Kafka
- **Frontend**: React + Arco Design + TypeScript
- **Protocol**: ACPs v2.0.0 (AIP Partner)

## Getting Started

See [Design Document](docs/specs/2026-03-13-translator-agent-design.md) for full architecture details.

## License

[MIT](LICENSE)

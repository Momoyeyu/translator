def build_plan_messages(extracted_text: str, config: dict) -> list[dict]:
    chunk_strategy = config.get("chunk_strategy", "auto")
    max_tokens = config.get("max_chunk_tokens", 2000)

    return [
        {
            "role": "system",
            "content": (
                "You are a document analysis expert. Analyze the given text and split it into "
                "translation-ready chunks. Each chunk should be a coherent section that can be "
                "translated independently while maintaining context.\n\n"
                f"Chunk strategy: {chunk_strategy}\n"
                f"Target max tokens per chunk: {max_tokens}\n\n"
                "Return a JSON array where each element has:\n"
                '- "chunk_index": integer starting from 0\n'
                '- "source_text": the text content of this chunk\n'
                '- "metadata": {"title": section title or null, "level": heading level or 0}'
            ),
        },
        {"role": "user", "content": extracted_text},
    ]

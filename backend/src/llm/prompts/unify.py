def build_unify_messages(translated_chunks: list[dict], target_lang: str) -> list[dict]:
    combined = "\n\n---CHUNK_BOUNDARY---\n\n".join(c["translated_text"] for c in translated_chunks)

    return [
        {
            "role": "system",
            "content": (
                "You are a professional editor. The following text has been translated in chunks. "
                "Your job is to:\n"
                "1. Remove chunk boundary markers (---CHUNK_BOUNDARY---)\n"
                "2. Fix any transition issues between chunks\n"
                "3. Ensure consistent terminology throughout\n"
                "4. Preserve all Markdown formatting\n"
                "5. Output the complete, polished translated document\n\n"
                f"Target language: {target_lang}\n"
                "Output ONLY the final document, no explanations."
            ),
        },
        {"role": "user", "content": combined},
    ]

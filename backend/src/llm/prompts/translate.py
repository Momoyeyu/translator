def build_translate_messages(
    source_text: str,
    target_lang: str,
    glossary: list[dict],
    previous_context: str = "",
    config: dict | None = None,
) -> list[dict]:
    glossary_str = ""
    if glossary:
        lines = [f"- {t['source_term']} → {t['translated_term']}" for t in glossary]
        glossary_str = "\nMandatory terminology:\n" + "\n".join(lines) + "\n"

    context_str = ""
    if previous_context:
        context_str = f"\nPrevious section ending (for coherence):\n{previous_context}\n"

    formality = (config or {}).get("formality", "neutral")

    return [
        {
            "role": "system",
            "content": (
                f"You are a professional translator. Translate the following text to {target_lang}. "
                f"Formality: {formality}. Preserve the original formatting (Markdown, lists, etc.)."
                f"{glossary_str}{context_str}\n"
                "Output ONLY the translated text, no explanations."
            ),
        },
        {"role": "user", "content": source_text},
    ]

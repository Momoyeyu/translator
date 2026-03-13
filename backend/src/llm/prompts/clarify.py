def build_clarify_messages(source_text: str, source_lang: str, target_lang: str) -> list[dict]:
    return [
        {
            "role": "system",
            "content": (
                "You are a translation specialist. Identify specialized terms, proper nouns, "
                "and domain-specific vocabulary in the source text that need careful translation "
                f"from {source_lang} to {target_lang}.\n\n"
                "Return a JSON array where each element has:\n"
                '- "source_term": the original term\n'
                '- "translated_term": your proposed translation\n'
                '- "context": a short excerpt showing where the term appears\n\n'
                "Only include terms where translation choice matters. Skip common words."
            ),
        },
        {"role": "user", "content": source_text},
    ]

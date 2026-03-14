def build_clarify_messages(source_text: str, source_lang: str, target_lang: str) -> list[dict]:
    return [
        {
            "role": "system",
            "content": (
                "You are a translation specialist. Identify specialized terms, proper nouns, "
                "and domain-specific vocabulary in the source text that need careful translation "
                f"from {source_lang} to {target_lang}.\n\n"
                "For each term, assign a confidence score between 0.0 and 1.0 indicating how "
                "certain you are about the translation:\n"
                "- 0.0-0.3: Very uncertain, likely needs human review\n"
                "- 0.3-0.7: Somewhat uncertain, could benefit from verification\n"
                "- 0.7-1.0: Highly confident in the translation\n\n"
                "If a term is ambiguous or domain-specific and you think a web search would help "
                "clarify its meaning, set search_suggested to true.\n\n"
                "Return a JSON array where each element has:\n"
                '- "source_term": the original term\n'
                '- "translated_term": your proposed translation\n'
                '- "confidence": your confidence score (0.0-1.0)\n'
                '- "context": a short excerpt showing where the term appears\n'
                '- "search_suggested": boolean, true if web search would help clarify\n\n'
                "Only include terms where translation choice matters. Skip common words."
            ),
        },
        {"role": "user", "content": source_text},
    ]

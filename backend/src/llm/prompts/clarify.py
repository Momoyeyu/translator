def build_clarify_messages(source_text: str, source_lang: str, target_lang: str) -> list[dict]:
    return [
        {
            "role": "system",
            "content": (
                "You are a translation specialist. Your task is to identify and evaluate "
                f"specialized terms for translation from {source_lang} to {target_lang}.\n\n"
                "Follow this 4-step process:\n"
                "1. Identify all specialized terms, proper nouns, and domain-specific vocabulary "
                "in the source text that need careful translation.\n"
                "2. For each term, consider what a web search might reveal about standard "
                "translations — are there competing translations, established conventions, or "
                "domain-specific usages?\n"
                "3. Assign a confidence score based on how certain you are of the correct "
                "translation, considering potential conflicting translations:\n"
                "   - 0.0-0.3: Very uncertain, multiple valid translations or no clear standard\n"
                "   - 0.3-0.7: Somewhat uncertain, likely correct but alternatives exist\n"
                "   - 0.7-1.0: Highly confident, well-established translation\n"
                "4. Return ALL terms with confidence scores — the system will filter high-confidence "
                "terms automatically and only present uncertain ones for human review.\n\n"
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

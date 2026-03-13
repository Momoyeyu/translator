def build_chat_messages(
    conversation_history: list[dict],
    user_message: str,
    source_lang: str,
    target_lang: str,
    glossary: list[dict],
    translation_summary: str = "",
) -> list[dict]:
    glossary_str = ""
    if glossary:
        lines = [f"- {t['source_term']} → {t['translated_term']}" for t in glossary]
        glossary_str = "\nCurrent glossary:\n" + "\n".join(lines)

    messages = [
        {
            "role": "system",
            "content": (
                "You are a translation assistant. You help the user understand and refine "
                f"a translation from {source_lang} to {target_lang}.\n"
                f"{glossary_str}\n"
                f"Translation summary: {translation_summary or 'Not available'}\n\n"
                "You can answer questions about translation choices, explain terminology, "
                "and suggest improvements."
            ),
        },
    ]
    messages.extend(conversation_history)
    messages.append({"role": "user", "content": user_message})
    return messages

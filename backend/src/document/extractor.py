import io


class UnsupportedFormatError(Exception):
    def __init__(self, mime_type: str):
        super().__init__(f"Unsupported document format: {mime_type}")
        self.mime_type = mime_type


SUPPORTED_MIME_TYPES = {
    "text/plain",
    "text/markdown",
    "text/x-markdown",
    "text/html",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


def extract_text(data: bytes, mime_type: str) -> str:
    if mime_type not in SUPPORTED_MIME_TYPES:
        raise UnsupportedFormatError(mime_type)

    if mime_type in ("text/plain", "text/markdown", "text/x-markdown"):
        return data.decode("utf-8")

    if mime_type == "text/html":
        return _extract_html(data)

    if mime_type == "application/pdf":
        return _extract_pdf(data)

    if mime_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return _extract_docx(data)

    raise UnsupportedFormatError(mime_type)


def _extract_html(data: bytes) -> str:
    from bs4 import BeautifulSoup

    soup = BeautifulSoup(data, "html.parser")
    return soup.get_text(separator="\n", strip=True)


def _extract_pdf(data: bytes) -> str:
    import fitz

    doc = fitz.open(stream=data, filetype="pdf")
    parts = [page.get_text() for page in doc]
    doc.close()
    return "\n".join(parts)


def _extract_docx(data: bytes) -> str:
    from docx import Document

    doc = Document(io.BytesIO(data))
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip())

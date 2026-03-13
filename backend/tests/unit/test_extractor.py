import pytest
from document.extractor import UnsupportedFormatError, extract_text


def test_extract_plain_text():
    result = extract_text(b"Hello, world!", "text/plain")
    assert result == "Hello, world!"


def test_extract_markdown():
    data = "# Title\n\nParagraph".encode("utf-8")
    result = extract_text(data, "text/markdown")
    assert result == "# Title\n\nParagraph"


def test_unsupported_format_raises():
    with pytest.raises(UnsupportedFormatError):
        extract_text(b"data", "application/zip")


def test_extract_html():
    html = b"<html><body><h1>Title</h1><p>Content</p></body></html>"
    result = extract_text(html, "text/html")
    assert "Title" in result
    assert "Content" in result

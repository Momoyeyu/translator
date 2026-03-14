"""Markdown -> PDF conversion via markdown + WeasyPrint."""
import html

import markdown
from weasyprint import HTML


def markdown_to_pdf(md_text: str, title: str = "") -> bytes:
    """Convert markdown string to PDF bytes.

    Uses markdown lib to convert to HTML, then WeasyPrint to render PDF.
    Includes a clean stylesheet for readable output.
    """
    escaped_title = html.escape(title)

    # Convert markdown to HTML
    html_body = markdown.markdown(
        md_text,
        extensions=["tables", "fenced_code", "toc", "codehilite"],
    )

    # Wrap with full HTML + CSS
    full_html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>{escaped_title}</title>
<style>
  @page {{
    size: A4;
    margin: 2.5cm;
  }}
  body {{
    font-family: "Noto Sans SC", "Noto Sans", "Helvetica Neue", Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #333;
  }}
  h1 {{ font-size: 20pt; margin-top: 0; }}
  h2 {{ font-size: 16pt; margin-top: 1.2em; }}
  h3 {{ font-size: 13pt; margin-top: 1em; }}
  p {{ margin: 0.6em 0; text-align: justify; }}
  code {{
    font-family: "Source Code Pro", "Courier New", monospace;
    font-size: 9pt;
    background: #f5f5f5;
    padding: 2px 4px;
    border-radius: 3px;
  }}
  pre {{
    background: #f5f5f5;
    padding: 12px;
    border-radius: 4px;
    overflow-x: auto;
    font-size: 9pt;
    line-height: 1.4;
  }}
  pre code {{ background: none; padding: 0; }}
  table {{
    border-collapse: collapse;
    width: 100%;
    margin: 1em 0;
    font-size: 10pt;
  }}
  th, td {{
    border: 1px solid #ddd;
    padding: 8px 12px;
    text-align: left;
  }}
  th {{ background: #f0f0f0; font-weight: 600; }}
  blockquote {{
    border-left: 3px solid #ccc;
    margin: 1em 0;
    padding: 0.5em 1em;
    color: #666;
  }}
  hr {{ border: none; border-top: 1px solid #ddd; margin: 1.5em 0; }}
</style>
</head>
<body>
{html_body}
</body>
</html>"""

    return HTML(string=full_html).write_pdf()

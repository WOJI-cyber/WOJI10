/**
 * Export utilities for Korean Public Sector Civil Service documents.
 * Produces HWP-compatible HTML format, DOC, TXT, and formatted clipboard payloads.
 */

export function copyToClipboard(text: string, title?: string): Promise<boolean> {
  // Convert markdown to clean civil service formatted text for HWP
  const cleanText = text
    .replace(/^#+\s*(.*)$/gm, "$1")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1");

  return navigator.clipboard
    .writeText(cleanText)
    .then(() => true)
    .catch(() => false);
}

export function downloadAsHwpDoc(content: string, filename: string, isOfficialNotice: boolean = false) {
  // Hancom Office (HWP) and Microsoft Word recognize HTML with specific Office metadata
  const title = filename.replace(/\.[^/.]+$/, "");
  
  // Format markdown to HTML for rich Word/HWP import
  const htmlContent = convertMarkdownToDocumentHtml(content, title, isOfficialNotice);

  const blob = new Blob(["\ufeff" + htmlContent], {
    type: "application/msword;charset=utf-8",
  });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  // Use .doc which Hancom HWP opens natively preserving fonts and tables
  a.download = `${title}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadAsTxt(content: string, filename: string) {
  const blob = new Blob(["\ufeff" + content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function convertMarkdownToDocumentHtml(markdown: string, docTitle: string, isNotice: boolean): string {
  // Simple robust markdown to clean HTML converter
  let html = markdown
    // Headings
    .replace(/^# (.*$)/gim, '<h1 style="font-size: 18pt; font-family: 굴림, Batang, sans-serif; font-weight: bold; text-align: center; margin: 20pt 0 15pt 0;">$1</h1>')
    .replace(/^## (.*$)/gim, '<h2 style="font-size: 14pt; font-family: 굴림, sans-serif; font-weight: bold; margin: 15pt 0 8pt 0; color: #111;">$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 style="font-size: 12pt; font-family: 굴림, sans-serif; font-weight: bold; margin: 10pt 0 5pt 0;">$1</h3>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Citations
    .replace(/\[출처:\s*([^\]]+)\]/g, '<span style="color: #2b6cb0; font-size: 9.5pt; font-weight: normal; background-color: #ebf8ff; padding: 1px 4px; border: 1px solid #bee3f8; border-radius: 2px;">[출처: $1]</span>')
    .replace(/\[확인 필요\]/g, '<span style="color: #c05621; font-size: 9.5pt; font-weight: bold; background-color: #feebc8; padding: 1px 4px; border: 1px solid #fbd38d; border-radius: 2px;">[확인 필요]</span>')
    // Line breaks
    .replace(/\n\n/g, "</p><p style=\"margin: 4pt 0; line-height: 160%; font-family: 'Malgun Gothic', 맑은 고딕, 굴림; font-size: 11pt;\">")
    .replace(/\n/g, "<br/>");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${docTitle}</title>
  <style>
    body {
      font-family: 'Malgun Gothic', '맑은 고딕', 'Batang', 바탕, 굴림, sans-serif;
      font-size: 11pt;
      line-height: 160%;
      color: #1a202c;
      padding: 30mm 20mm;
      max-width: 210mm;
      margin: 0 auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12pt 0;
    }
    th, td {
      border: 1px solid #4a5568;
      padding: 6pt 8pt;
      text-align: left;
      font-size: 10pt;
    }
    th {
      background-color: #edf2f7;
      font-weight: bold;
      text-align: center;
    }
    @page {
      size: A4 portrait;
      margin: 20mm 15mm 20mm 15mm;
    }
  </style>
</head>
<body>
  <div style="font-size: 9pt; color: #718096; text-align: right; margin-bottom: 10pt;">
    [보건소 회의자료 관리번호: GM-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}]
  </div>
  ${html}
</body>
</html>
`;
}

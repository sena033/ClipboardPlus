import { useMemo } from 'react';
import { marked } from 'marked';

// Configure marked for safety
marked.setOptions({
  breaks: true,
  gfm: true,
});

interface PreviewProps {
  content: string;
}

export default function Preview({ content }: PreviewProps) {
  const html = useMemo(() => {
    try {
      return marked.parse(content || '');
    } catch {
      return '<p>Error rendering markdown</p>';
    }
  }, [content]);

  return (
    <div className="preview-pane">
      <div className="pane-header">Preview</div>
      <div
        className="preview-content markdown-body"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

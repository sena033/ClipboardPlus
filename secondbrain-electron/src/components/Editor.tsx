import { useRef, useEffect } from 'react';

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
}

export default function Editor({ content, onChange }: EditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevContentRef = useRef(content);

  // Restore cursor position after external content change (e.g., switching notes)
  useEffect(() => {
    if (textareaRef.current && content !== prevContentRef.current) {
      prevContentRef.current = content;
      // Don't reset cursor - let the user's scroll position stay
    }
  }, [content]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    prevContentRef.current = e.target.value;
    onChange(e.target.value);
  };

  // Tab key inserts spaces
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newVal = ta.value.substring(0, start) + '  ' + ta.value.substring(end);
      onChange(newVal);
      // Restore cursor after React re-render
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
  };

  return (
    <div className="editor-pane">
      <div className="pane-header">Editor</div>
      <textarea
        ref={textareaRef}
        className="editor-textarea"
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        placeholder="Start typing..."
      />
    </div>
  );
}

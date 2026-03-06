'use client';

import { useState, useRef, useEffect } from 'react';
import { Bold, Italic, List, AlignLeft, Code } from 'lucide-react';

interface TextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  label?: string;
  className?: string;
}

export default function TextEditor({ 
  value, 
  onChange, 
  placeholder = 'Enter description...', 
  required = false,
  label,
  className = '' 
}: TextEditorProps) {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value]);

  const insertText = (before: string, after: string = '') => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    onChange(newText);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const insertBulletPoint = () => {
    const lines = value.split('\n');
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const currentLine = value.substring(0, start).split('\n').length - 1;
    
    if (lines[currentLine] && !lines[currentLine].startsWith('• ')) {
      lines[currentLine] = '• ' + lines[currentLine];
      onChange(lines.join('\n'));
    } else {
      insertText('\n• ');
    }
  };

  const formatters = [
    { icon: Bold, label: 'Bold', action: () => insertText('**', '**') },
    { icon: Italic, label: 'Italic', action: () => insertText('*', '*') },
    { icon: Code, label: 'Code', action: () => insertText('`', '`') },
    { icon: List, label: 'Bullet List', action: insertBulletPoint },
  ];

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      
      <div className={`border rounded-lg bg-surface transition-colors ${
        isFocused ? 'border-blue-500 ring-1 ring-blue-500/20' : 'border-border'
      }`}>
        {/* Toolbar */}
        <div className="border-b border-border px-3 py-2 flex items-center gap-1">
          {formatters.map((formatter, index) => (
            <button
              key={index}
              type="button"
              onClick={formatter.action}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-surface-2 rounded transition-colors"
              title={formatter.label}
            >
              <formatter.icon className="w-4 h-4" />
            </button>
          ))}
        </div>
        
        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          required={required}
          rows={6}
          className="w-full bg-transparent text-white placeholder-gray-500 px-4 py-3 focus:outline-none resize-y min-h-[150px] max-h-[400px] overflow-y-auto text-sm leading-relaxed"
          style={{ 
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            lineHeight: '1.7'
          }}
        />
        
        {/* Status Bar */}
        <div className="border-t border-border px-3 py-1.5 text-xs text-gray-500 flex justify-between">
          <span>Markdown supported</span>
          <span>{value.length} characters</span>
        </div>
      </div>
    </div>
  );
}
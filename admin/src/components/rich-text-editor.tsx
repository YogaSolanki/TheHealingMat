"use client";

import { useEffect, useRef } from "react";

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

function toEditorHtml(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/<[a-z][\s\S]*>/i.test(trimmed)) return trimmed;
  return trimmed
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\r\n|\n|\r/g, "<br>");
}

function runCommand(command: string, value?: string) {
  document.execCommand(command, false, value);
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write the article body…",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastValueRef = useRef<string>("");

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const next = toEditorHtml(value);
    if (next === lastValueRef.current) return;
    if (editor.innerHTML !== next) {
      editor.innerHTML = next;
    }
    lastValueRef.current = next;
  }, [value]);

  function emitChange() {
    const editor = editorRef.current;
    if (!editor) return;
    const html = editor.innerHTML === "<br>" ? "" : editor.innerHTML;
    lastValueRef.current = html;
    onChange(html);
  }

  function format(command: string, commandValue?: string) {
    editorRef.current?.focus();
    runCommand(command, commandValue);
    emitChange();
  }

  const tools: {
    label: string;
    title: string;
    action: () => void;
    activeHint?: string;
  }[] = [
    {
      label: "B",
      title: "Bold",
      action: () => format("bold"),
      activeHint: "font-bold",
    },
    {
      label: "I",
      title: "Italic",
      action: () => format("italic"),
      activeHint: "italic",
    },
    {
      label: "U",
      title: "Underline",
      action: () => format("underline"),
      activeHint: "underline",
    },
    {
      label: "• List",
      title: "Bullet list",
      action: () => format("insertUnorderedList"),
    },
    {
      label: "1. List",
      title: "Numbered list",
      action: () => format("insertOrderedList"),
    },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-[#d5e0d5] bg-white">
      <div className="flex flex-wrap items-center gap-1 border-b border-[#e6ebe3] bg-[#FBF9F5] px-2 py-1.5">
        {tools.map((tool) => (
          <button
            key={tool.title}
            type="button"
            title={tool.title}
            onMouseDown={(event) => {
              event.preventDefault();
              tool.action();
            }}
            className={`rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-[#3d4a3c] transition hover:bg-white hover:text-[#1f6b3a] ${
              tool.activeHint ?? ""
            }`}
          >
            {tool.label}
          </button>
        ))}
      </div>

      <div
        ref={editorRef}
        role="textbox"
        aria-multiline="true"
        aria-label="Article body"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={emitChange}
        onBlur={emitChange}
        className="min-h-[160px] px-3 py-2.5 text-sm leading-relaxed text-[#3d4a3c] outline-none empty:before:pointer-events-none empty:before:text-[#9aa69c] empty:before:content-[attr(data-placeholder)] [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_a]:text-[#1f6b3a] [&_a]:underline"
      />
    </div>
  );
}

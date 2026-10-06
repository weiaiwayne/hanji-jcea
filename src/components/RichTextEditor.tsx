"use client";

import { useEffect, useRef } from "react";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link2,
  RemoveFormatting,
  Pilcrow,
} from "lucide-react";

/**
 * Lightweight rich text editor over contenteditable. Emits HTML.
 * Buttons use execCommand which remains supported in all major browsers.
 */
export default function RichTextEditor({
  initialHtml,
  onChange,
  minHeight = 320,
}: {
  initialHtml: string;
  onChange: (html: string) => void;
  minHeight?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== initialHtml) {
      ref.current.innerHTML = initialHtml;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function exec(command: string, value?: string) {
    ref.current?.focus();
    document.execCommand(command, false, value);
    if (ref.current) onChange(ref.current.innerHTML);
  }

  function addLink() {
    const url = prompt("Link URL (https://…):");
    if (url) exec("createLink", url);
  }

  const buttons: { label: string; icon: React.ReactNode; action: () => void }[] = [
    { label: "Bold", icon: <Bold className="h-4 w-4" />, action: () => exec("bold") },
    { label: "Italic", icon: <Italic className="h-4 w-4" />, action: () => exec("italic") },
    { label: "Heading 2", icon: <Heading2 className="h-4 w-4" />, action: () => exec("formatBlock", "<h2>") },
    { label: "Heading 3", icon: <Heading3 className="h-4 w-4" />, action: () => exec("formatBlock", "<h3>") },
    { label: "Paragraph", icon: <Pilcrow className="h-4 w-4" />, action: () => exec("formatBlock", "<p>") },
    { label: "Bulleted list", icon: <List className="h-4 w-4" />, action: () => exec("insertUnorderedList") },
    { label: "Numbered list", icon: <ListOrdered className="h-4 w-4" />, action: () => exec("insertOrderedList") },
    { label: "Insert link", icon: <Link2 className="h-4 w-4" />, action: addLink },
    { label: "Clear formatting", icon: <RemoveFormatting className="h-4 w-4" />, action: () => exec("removeFormat") },
  ];

  return (
    <div className="rounded-md border border-gray-300 shadow-sm">
      <div
        className="flex flex-wrap gap-1 border-b border-gray-200 bg-gray-50 p-2"
        role="toolbar"
        aria-label="Text formatting"
      >
        {buttons.map((b) => (
          <button
            key={b.label}
            type="button"
            title={b.label}
            aria-label={b.label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={b.action}
            className="rounded p-1.5 text-gray-600 hover:bg-white hover:text-primary-700"
          >
            {b.icon}
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Page content"
        onInput={() => ref.current && onChange(ref.current.innerHTML)}
        className="prose-jcea max-w-none px-4 py-3 text-sm focus:outline-none"
        style={{ minHeight }}
      />
    </div>
  );
}

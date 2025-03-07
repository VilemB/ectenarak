"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Bold, Italic, X, Check, HelpCircle } from "lucide-react";

// Simple tooltip component
const Tooltip = ({
  content,
  children,
}: {
  content: string;
  children: React.ReactNode;
}) => (
  <div className="group relative inline-block">
    {children}
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
      {content}
    </div>
  </div>
);

interface NoteEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  minRows?: number;
  maxRows?: number;
  showPreview?: boolean;
}

export function NoteEditor({
  value,
  onChange,
  onSubmit,
  onCancel,
  isSubmitting = false,
  placeholder = "Přidat poznámku...",
  autoFocus = false,
  minRows = 3,
  maxRows = 10,
  showPreview = false,
}: NoteEditorProps) {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showMarkdownHelp, setShowMarkdownHelp] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [rows, setRows] = useState(minRows);

  // Update rows based on content
  useEffect(() => {
    if (!textareaRef.current) return;

    const lineCount = (value.match(/\n/g) || []).length + 1;
    const newRows = Math.min(Math.max(lineCount, minRows), maxRows);
    setRows(newRows);
  }, [value, minRows, maxRows]);

  // Auto-focus the textarea if specified
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Insert text at cursor position
  const insertText = (
    before: string,
    after: string = "",
    isLineStart = false
  ) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    let newValue;
    let newCursorPos;

    if (isLineStart) {
      // For line-based formatting (quotes, lists)
      if (selectedText.length > 0) {
        // If text is selected, apply formatting to each line of the selection
        const lines = selectedText.split("\n");
        const formattedLines = lines.map((line) => before + line);
        const formattedText = formattedLines.join("\n");

        newValue =
          textarea.value.substring(0, start) +
          formattedText +
          textarea.value.substring(end);

        newCursorPos = start + formattedText.length;
      } else {
        // No text selected, just insert at current position
        const textBeforeCursor = textarea.value.substring(0, start);
        const textAfterCursor = textarea.value.substring(end);

        // Check if we're at the beginning of a line
        const isAtLineStart = start === 0 || textBeforeCursor.endsWith("\n");

        if (isAtLineStart) {
          // Already at line start, just insert the formatting
          newValue = textBeforeCursor + before + textAfterCursor;
          newCursorPos = start + before.length;
        } else {
          // In the middle of text, insert a newline first
          newValue = textBeforeCursor + "\n" + before + textAfterCursor;
          newCursorPos = start + 1 + before.length;
        }
      }
    } else {
      // For inline formatting (bold, italic)
      if (selectedText.length > 0) {
        // Wrap the selected text with formatting
        newValue =
          textarea.value.substring(0, start) +
          before +
          selectedText +
          after +
          textarea.value.substring(end);

        newCursorPos =
          start + before.length + selectedText.length + after.length;
      } else {
        // No selection, insert formatting and place cursor between tags
        newValue =
          textarea.value.substring(0, start) +
          before +
          after +
          textarea.value.substring(end);

        newCursorPos = start + before.length;
      }
    }

    onChange(newValue);

    // Set cursor position after the operation
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Format handlers - only the essential ones
  const formatBold = () => insertText("**", "**");
  const formatItalic = () => insertText("*", "*");

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit with Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (value.trim() && !isSubmitting) {
        onSubmit(e);
      }
      return;
    }

    // Format shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case "b":
          e.preventDefault();
          formatBold();
          break;
        case "i":
          e.preventDefault();
          formatItalic();
          break;
      }
    }
  };

  return (
    <div className="w-full rounded-lg border border-border/60 bg-background/80 shadow-sm transition-all duration-200 hover:shadow">
      {/* Simplified Toolbar - only essential formatting options */}
      <div className="flex items-center justify-between border-b border-border/40 bg-secondary/30 px-2 py-1 rounded-t-lg">
        <div className="flex flex-wrap items-center gap-0.5">
          <Tooltip content="Tučné (Ctrl+B)">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              onClick={formatBold}
            >
              <Bold className="h-4 w-4" />
            </Button>
          </Tooltip>
          <Tooltip content="Kurzíva (Ctrl+I)">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              onClick={formatItalic}
            >
              <Italic className="h-4 w-4" />
            </Button>
          </Tooltip>
        </div>
        <div className="flex items-center gap-0.5">
          {showPreview && (
            <Tooltip content={isPreviewMode ? "Upravit" : "Náhled"}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
              >
                {isPreviewMode ? "Upravit" : "Náhled"}
              </Button>
            </Tooltip>
          )}
          <Tooltip content="Nápověda">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => setShowMarkdownHelp(!showMarkdownHelp)}
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Simplified Markdown Help */}
      <AnimatePresence>
        {showMarkdownHelp && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-border/40 bg-secondary/10 px-3 py-2 text-xs text-muted-foreground"
          >
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="font-mono bg-secondary/30 px-1 rounded">
                  **tučné**
                </span>{" "}
                = <span className="font-bold">tučné</span>{" "}
                <span className="text-muted-foreground/60">(Ctrl+B)</span>
              </div>
              <div>
                <span className="font-mono bg-secondary/30 px-1 rounded">
                  *kurzíva*
                </span>{" "}
                = <span className="italic">kurzíva</span>{" "}
                <span className="text-muted-foreground/60">(Ctrl+I)</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor or Preview */}
      <div className="p-3">
        {isPreviewMode ? (
          <div className="min-h-[100px] prose prose-sm dark:prose-invert max-w-none">
            {value.trim() ? (
              <ReactMarkdown>{value}</ReactMarkdown>
            ) : (
              <p className="text-muted-foreground italic">
                Náhled prázdné poznámky...
              </p>
            )}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={rows}
            className="w-full resize-none bg-transparent outline-none placeholder:text-muted-foreground/60 min-h-[100px]"
          />
        )}
      </div>

      {/* Character count and buttons */}
      <div className="flex items-center justify-between border-t border-border/40 bg-secondary/10 px-3 py-2 rounded-b-lg">
        <div className="text-xs text-muted-foreground">
          {value.length > 0 ? (
            <span>{value.length} znaků</span>
          ) : (
            <span className="text-muted-foreground/60">
              Tip: Ctrl+Enter pro rychlé uložení
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 px-3 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5 mr-1.5" />
            Zrušit
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            disabled={!value.trim() || isSubmitting}
            onClick={(e) => onSubmit(e as unknown as React.FormEvent)}
            className="h-8 px-3 bg-primary text-primary-foreground"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin mr-1.5 h-3 w-3 border-t-2 border-b-2 border-current rounded-full"></div>
                <span>Ukládám...</span>
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5 mr-1.5" />
                <span>Uložit</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

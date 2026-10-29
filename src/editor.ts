import * as monaco from "monaco-editor/editor/editor.api.js";
import oneDarkTheme from "./themes/one-dark.json";
import oneLightTheme from "./themes/one-light.json";

export interface PyEditor {
  setValue: (text: string) => void;
  setTheme: (theme: "light" | "dark") => void;
  revealRange: (start: number, end: number) => void;
  clearSelection: () => void;
  /**
   * Paints a highlight over a character range without touching the cursor,
   * the selection, or focus. Safe to call from a Blockly click handler.
   */
  highlightComment: (start: number, end: number) => void;
  /** Removes the highlight painted by `highlightComment`. */
  clearCommentHighlight: () => void;
  /** Calls back with the cursor's character offset. Returns a detach function. */
  onCursorChange: (callback: (offset: number) => void) => () => void;
  /**
   * Snapshot of the cursor, selection, and scroll position. Returns null when
   * the editor has no model yet. Used by the tab strip to restore a file's
   * view when its tab is re-activated.
   */
  saveViewState: () => monaco.editor.ICodeEditorViewState | null;
  /** Re-applies a snapshot produced by `saveViewState`. */
  restoreViewState: (state: monaco.editor.ICodeEditorViewState) => void;
  dispose: () => void;
  layout: () => void;
}

// Token colours are vendored as project-owned JSON (Atom One Dark / Light)
// rather than pulled from a package, so the palette is reviewable in-repo and
// the build stays a single file with no extra runtime asset.
monaco.editor.defineTheme("one-dark", {
  base: "vs-dark",
  inherit: true,
  rules: oneDarkTheme.rules,
  colors: {
    "editor.background": "#282c34",
    "editorGutter.background": "#282c34",
    "editor.lineHighlightBackground": "#2c313c",
    "editor.foreground": "#abb2bf",
    "editor.selectionBackground": "#3e4451",
  },
});

// Background and foreground follow the same Atom One Light palette as the
// token rules, so the panel does not read as stock Monaco under Atom colours.
monaco.editor.defineTheme("one-light", {
  base: "vs",
  inherit: true,
  rules: oneLightTheme.rules,
  colors: {
    "editor.background": "#fafafa",
    "editorGutter.background": "#fafafa",
    "editor.lineHighlightBackground": "#f2f2f2",
    "editor.foreground": "#383a42",
    "editor.selectionBackground": "#e5e5e6",
  },
});

const pythonKeywords = [
  "and",
  "as",
  "assert",
  "async",
  "await",
  "break",
  "class",
  "continue",
  "def",
  "del",
  "elif",
  "else",
  "except",
  "False",
  "finally",
  "for",
  "from",
  "global",
  "if",
  "import",
  "in",
  "is",
  "lambda",
  "None",
  "nonlocal",
  "not",
  "or",
  "pass",
  "raise",
  "return",
  "True",
  "try",
  "while",
  "with",
  "yield",
];

monaco.languages.register({ id: "python" });
monaco.languages.setMonarchTokensProvider("python", {
  keywords: pythonKeywords,
  tokenizer: {
    root: [
      [/#.*$/, "comment"],
      [/[rRuUbBfF]*"""/, { token: "string", next: "@tripleDouble" }],
      [/[rRuUbBfF]*'''/, { token: "string", next: "@tripleSingle" }],
      [/[rRuUbBfF]*"(?:\\.|[^"\\])*"/, "string"],
      [/[rRuUbBfF]*'(?:\\.|[^'\\])*'/, "string"],
      [/\bdef\b/, { token: "keyword", next: "@functionName" }],
      [/\bclass\b/, { token: "keyword", next: "@className" }],
      [/\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/, "number"],
      [
        /[a-zA-Z_]\w*/,
        { cases: { "@keywords": "keyword", "@default": "identifier" } },
      ],
      [/[{}()[\]]/, "@brackets"],
      [/[=><!~?:&|+\-*\/%^]+/, "operator"],
    ],
    functionName: [
      [/\s+/, ""],
      [/[a-zA-Z_]\w*/, { token: "function", next: "@pop" }],
      [/./, { token: "", next: "@pop" }],
    ],
    className: [
      [/\s+/, ""],
      [/[a-zA-Z_]\w*/, { token: "type.identifier", next: "@pop" }],
      [/./, { token: "", next: "@pop" }],
    ],
    tripleDouble: [
      [/.*?"""/, "string", "@pop"],
      [/.*$/, "string"],
    ],
    tripleSingle: [
      [/.*?'''/, "string", "@pop"],
      [/.*$/, "string"],
    ],
  },
});

export function createEditor(container: HTMLElement): PyEditor {
  const editor = monaco.editor.create(container, {
    value: "",
    language: "python",
    theme: "vs",
    readOnly: true,
    domReadOnly: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: true,
    lineNumbers: "on",
    automaticLayout: false,
    renderLineHighlight: "none",
    // Match VS Code's editor weight and line height.
    fontFamily: "'FiraMono Nerd Font', Consolas, 'Courier New', monospace",
    fontSize: 15,
    lineHeight: 21,
    fontLigatures: false,
    letterSpacing: 0,
    fontWeight: "400",
    // Match VS Code's cursor behavior
    cursorBlinking: "phase",
    cursorSmoothCaretAnimation: "on",
  });

  // Epoch (ms) until which programmatic cursor moves are ignored. Bumped by
  // clearSelection and clearCommentHighlight so their own collapse does not
  // kick off reverse sync.
  let suppressCursorChangesUntil = 0;

  // True while highlightComment's selection is on screen. clearCommentHighlight
  // is a no-op otherwise, so a block-body click does not collapse the selection
  // that revealRange is about to set.
  let commentHighlightActive = false;

  // The comment range currently selected by highlightComment, or null. Reverse
  // sync ignores cursor events that land inside it: a comment icon click must
  // not glow a block, and for a docstring the comment range sits inside the
  // owning block's range, so reverse sync would light up the whole subtree.
  // Matching on the offset (rather than a one-shot flag) means a cursor move
  // anywhere else is never swallowed.
  let suppressedCommentRange: { start: number; end: number } | null = null;

  return {
    setValue: (text) => editor.setValue(text),
    setTheme: (theme) =>
      monaco.editor.setTheme(theme === "light" ? "one-light" : "one-dark"),
    revealRange: (start, end) => {
      const model = editor.getModel();
      if (!model) {
        return;
      }
      const startPos = model.getPositionAt(start);
      const endPos = model.getPositionAt(end);
      const range = new monaco.Range(
        startPos.lineNumber,
        startPos.column,
        endPos.lineNumber,
        endPos.column,
      );
      // Anchor at the end, caret at the start. The blue highlight still spans
      // the whole range, but the cursor sits on the first token so reverse
      // sync resolves the wrapper block (e.g. `await`) instead of whichever
      // innermost block happens to end at the same offset.
      editor.setSelection(
        new monaco.Selection(
          endPos.lineNumber,
          endPos.column,
          startPos.lineNumber,
          startPos.column,
        ),
      );
      editor.revealRangeInCenterIfOutsideViewport(range);
      // Do NOT call editor.focus() — it steals focus from Blockly.
    },
    clearSelection: () => {
      const position = editor.getPosition();
      if (!position) {
        return;
      }
      // Collapsing the selection is a programmatic cursor move, so it fires
      // onDidChangeCursorPosition. Without this guard, reverse sync would see
      // that offset, find the block still sitting there, and re-glow it right
      // after the caller cleared it.
      suppressCursorChangesUntil = Date.now() + 100;
      // Collapse to a zero-length range so no text stays highlighted.
      editor.setSelection(
        new monaco.Range(
          position.lineNumber,
          position.column,
          position.lineNumber,
          position.column,
        ),
      );
    },
    onCursorChange: (callback) => {
      const disposable = editor.onDidChangeCursorPosition((event) => {
        if (Date.now() < suppressCursorChangesUntil) {
          return;
        }
        const model = editor.getModel();
        if (!model) {
          return;
        }
        const offset = model.getOffsetAt(event.position);
        // A cursor move inside the comment highlight is the highlight itself,
        // not the user navigating. Ignore it so the icon click does not glow.
        if (
          suppressedCommentRange &&
          offset >= suppressedCommentRange.start &&
          offset <= suppressedCommentRange.end
        ) {
          return;
        }
        callback(offset);
      });
      return () => disposable.dispose();
    },
    highlightComment: (start, end) => {
      const model = editor.getModel();
      if (!model) {
        return;
      }
      const startPos = model.getPositionAt(start);
      const endPos = model.getPositionAt(end);
      // A real selection, anchored at the end with the caret at the start (the
      // same shape revealRange uses). setSelection() only reaches
      // viewModel.setSelections -> cursor.setStates, which emits cursor/view
      // events and never calls focus(). That is what keeps Blockly's comment
      // bubble open: revealRangeInCenterIfOutsideViewport() is the call that
      // focuses, not setSelection().
      //
      // The cursor event this emits is ignored by reverse sync (see
      // suppressedCommentRange): a comment icon click must not glow a block.
      suppressedCommentRange = { start, end };
      editor.setSelection(
        new monaco.Selection(
          endPos.lineNumber,
          endPos.column,
          startPos.lineNumber,
          startPos.column,
        ),
      );
      commentHighlightActive = true;

      // setSelection() does not scroll, so a comment below the fold would be
      // selected invisibly. setScrollTop() moves the viewport without touching
      // the cursor, the selection, or focus.
      const lineTop = editor.getTopForLineNumber(startPos.lineNumber);
      const lineBottom = editor.getTopForLineNumber(endPos.lineNumber + 1);
      const viewTop = editor.getScrollTop();
      const viewBottom = viewTop + editor.getLayoutInfo().height;
      if (lineTop < viewTop || lineBottom > viewBottom) {
        editor.setScrollTop(Math.max(0, lineTop - 40));
      }
    },
    clearCommentHighlight: () => {
      if (!commentHighlightActive) {
        return;
      }
      commentHighlightActive = false;
      suppressedCommentRange = null;
      // Deliberately does NOT touch the selection. Every caller follows this
      // with a selection change of its own: the block-body path calls
      // revealRange(), and the background path calls clearSelection(). Both
      // set the selection themselves, so collapsing here was redundant — and
      // worse, the collapse fired a cursor event that had to be suppressed,
      // and that suppression then swallowed the revealRange() cursor event,
      // so the block never glowed.
    },
    saveViewState: () => editor.saveViewState(),
    restoreViewState: (state) => editor.restoreViewState(state),
    dispose: () => editor.dispose(),
    layout: () => editor.layout(),
  };
}

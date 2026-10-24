import * as monaco from "monaco-editor/editor/editor.api.js";

export interface PyEditor {
  setValue: (text: string) => void;
  setTheme: (theme: "light" | "dark") => void;
  revealRange: (start: number, end: number) => void;
  clearSelection: () => void;
  /** Calls back with the cursor's character offset. Returns a detach function. */
  onCursorChange: (callback: (offset: number) => void) => () => void;
  dispose: () => void;
  layout: () => void;
}

monaco.editor.defineTheme("pybricks-dark", {
  base: "vs-dark",
  inherit: true,
  rules: [],
  colors: {
    "editor.background": "#2d2d2d",
    "editorGutter.background": "#2d2d2d",
    "editor.lineHighlightBackground": "#393939",
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
    scrollBeyondLastLine: false,
    lineNumbers: "on",
    automaticLayout: false,
    renderLineHighlight: "none",
  });

  // Epoch (ms) until which programmatic cursor moves are ignored. Bumped by
  // clearSelection so its own collapse does not kick off reverse sync.
  let suppressCursorChangesUntil = 0;

  return {
    setValue: (text) => editor.setValue(text),
    setTheme: (theme) =>
      monaco.editor.setTheme(theme === "light" ? "vs" : "pybricks-dark"),
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
        callback(model.getOffsetAt(event.position));
      });
      return () => disposable.dispose();
    },
    dispose: () => editor.dispose(),
    layout: () => editor.layout(),
  };
}

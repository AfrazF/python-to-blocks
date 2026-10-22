import * as monaco from "monaco-editor/editor/editor.api.js";

export interface PyEditor {
  setValue: (text: string) => void;
  setTheme: (theme: "light" | "dark") => void;
  revealRange: (start: number, end: number) => void;
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
      editor.setSelection(range);
      editor.revealRangeInCenterIfOutsideViewport(range);
      // Do NOT call editor.focus() — it steals focus from Blockly.
    },
    onCursorChange: (callback) => {
      const disposable = editor.onDidChangeCursorPosition((event) => {
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

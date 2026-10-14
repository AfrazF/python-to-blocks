import { parser } from "@lezer/python";
import { buildObjectTable, type ObjectTable } from "./objects";
import { buildSymbolTable, type SymbolTable } from "./symbols";

export type ResolvedEntry = {
  kind?: "function" | "async-function" | "variable";
  objectKind?:
    | "Motor"
    | "DriveBase"
    | "PrimeHub"
    | "number"
    | "string"
    | "list"
    | "unknown";
  origin: string;
};

export type ResolvedTable = Record<string, ResolvedEntry>;

type FileTables = {
  symbols: SymbolTable;
  objects: ObjectTable;
};

type ImportedName = {
  name: string;
  alias?: string;
};

function readImportedNames(
  source: string,
  statement: ReturnType<typeof parser.parse>["topNode"],
): {
  moduleName: string;
  names: ImportedName[];
} {
  const cursor = statement.cursor();
  let moduleStart = -1;
  let moduleName = "";
  let readingNames = false;
  let importedName: string | undefined;
  let alias: string | undefined;
  let expectingAlias = false;
  const names: ImportedName[] = [];

  const saveImportedName = () => {
    if (importedName !== undefined) {
      names.push({
        name: importedName,
        ...(alias === undefined ? {} : { alias }),
      });
    }
    importedName = undefined;
    alias = undefined;
    expectingAlias = false;
  };

  if (cursor.firstChild()) {
    do {
      if (cursor.name === "from") {
        moduleStart = cursor.node.to;
      } else if (cursor.name === "import" && !readingNames) {
        moduleName = source.slice(moduleStart, cursor.node.from).trim();
        readingNames = true;
      } else if (readingNames) {
        if (cursor.name === "VariableName") {
          const variableName = source.slice(cursor.node.from, cursor.node.to);
          if (expectingAlias) {
            alias = variableName;
            expectingAlias = false;
          } else if (importedName === undefined) {
            importedName = variableName;
          }
        } else if (cursor.name === "as" && importedName !== undefined) {
          expectingAlias = true;
        } else if (cursor.name === ",") {
          saveImportedName();
        }
      }
    } while (cursor.nextSibling());
  }
  saveImportedName();

  return { moduleName, names };
}

function findModuleFile(
  moduleName: string,
  currentFile: string,
  files: Record<string, string>,
): string | undefined {
  const modulePath = moduleName.replaceAll(".", "/");
  const candidates = [`${moduleName}.py`, `${modulePath}.py`];
  return candidates.find(
    (filename) => filename !== currentFile && Object.hasOwn(files, filename),
  );
}

export function resolveProject(
  files: Record<string, string>,
): Record<string, ResolvedTable> {
  const fileTables: Record<string, FileTables> = {};

  for (const [filename, source] of Object.entries(files)) {
    fileTables[filename] = {
      symbols: buildSymbolTable(source),
      objects: buildObjectTable(source),
    };
  }

  const resolvedProject: Record<string, ResolvedTable> = {};

  for (const [filename, source] of Object.entries(files)) {
    const resolved: ResolvedTable = {};
    const rootCursor = parser.parse(source).topNode.cursor();

    if (rootCursor.firstChild()) {
      do {
        if (rootCursor.name !== "ImportStatement") {
          continue;
        }

        const { moduleName, names } = readImportedNames(
          source,
          rootCursor.node,
        );
        const moduleFile = findModuleFile(moduleName, filename, files);

        for (const imported of names) {
          const localName = imported.alias ?? imported.name;
          const exported =
            moduleFile === undefined ? undefined : fileTables[moduleFile];
          const symbol = exported?.symbols[imported.name];
          const object = exported?.objects[imported.name];

          resolved[localName] = {
            ...(symbol === undefined ? {} : { kind: symbol.kind }),
            ...(object === undefined ? {} : { objectKind: object.objectKind }),
            origin: moduleFile ?? moduleName,
          };
        }
      } while (rootCursor.nextSibling());
    }

    const { symbols, objects } = fileTables[filename];
    const localNames = new Set([
      ...Object.keys(symbols),
      ...Object.keys(objects),
    ]);

    for (const name of localNames) {
      const symbol = symbols[name];
      const object = objects[name];
      resolved[name] = {
        ...(symbol === undefined ? {} : { kind: symbol.kind }),
        ...(object === undefined ? {} : { objectKind: object.objectKind }),
        origin: "local",
      };
    }

    resolvedProject[filename] = resolved;
  }

  return resolvedProject;
}

export function createSidebar(
  container: HTMLElement,
  initialFiles: string[],
  options: {
    onSelect: (name: string) => void;
    onUpload: (files: Record<string, string>) => void;
  },
): { setActive: (name: string) => void; setFiles: (names: string[]) => void } {
  const toolbar = document.createElement("div");
  toolbar.id = "sidebar-toolbar";

  const uploadBtn = document.createElement("button");
  uploadBtn.id = "upload-btn";
  uploadBtn.type = "button";
  uploadBtn.textContent = "Upload";
  toolbar.append(uploadBtn);

  const toggleEditorBtn = document.createElement("button");
  toggleEditorBtn.id = "toggle-editor-btn";
  toggleEditorBtn.type = "button";
  toggleEditorBtn.textContent = "Show code";
  toggleEditorBtn.setAttribute("aria-pressed", "false");
  toolbar.append(toggleEditorBtn);

  const fileInput = document.createElement("input");
  fileInput.id = "file-input";
  fileInput.type = "file";
  fileInput.accept = ".py";
  fileInput.multiple = true;
  fileInput.hidden = true;
  toolbar.append(fileInput);

  const fileList = document.createElement("div");
  fileList.className = "sidebar-files";

  const errorBanner = document.createElement("div");
  errorBanner.id = "sidebar-error";
  errorBanner.hidden = true;

  const handle = document.createElement("div");
  handle.id = "sidebar-handle";
  handle.setAttribute("aria-hidden", "true");

  container.replaceChildren(toolbar, errorBanner, fileList, handle);

  const buttons = new Map<string, HTMLButtonElement>();

  const renderFileButtons = (names: string[]) => {
    const existing = new Set(buttons.keys());
    for (const name of names) {
      if (!existing.has(name)) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "sidebar-item";
        button.textContent = name;
        button.setAttribute("aria-pressed", "false");
        button.addEventListener("click", () => options.onSelect(name));
        buttons.set(name, button);
        fileList.append(button);
      }
    }
    for (const [name] of buttons) {
      if (!names.includes(name)) {
        buttons.get(name)?.remove();
        buttons.delete(name);
      }
    }
  };

  renderFileButtons(initialFiles);

  const setActive = (name: string) => {
    for (const [fileName, button] of buttons) {
      const active = fileName === name;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    }
  };

  const setFiles = (names: string[]) => {
    renderFileButtons(names);
    const activeEl = document.querySelector(
      ".sidebar-item.active",
    ) as HTMLButtonElement | null;
    const currentActive = activeEl?.textContent;
    if (currentActive && !names.includes(currentActive)) {
      setActive(names[0] ?? "");
    }
  };

  uploadBtn.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    handleFiles(Array.from(fileInput.files ?? []));
    fileInput.value = "";
  });

  const handleFiles = async (fileListItems: FileList | File[]) => {
    const pyFiles: Record<string, string> = {};
    for (const file of fileListItems) {
      if (file.name.endsWith(".py")) {
        pyFiles[file.name] = await file.text();
      }
    }
    if (Object.keys(pyFiles).length > 0) {
      options.onUpload(pyFiles);
    }
  };

  let dragCounter = 0;

  container.addEventListener("dragenter", (event: DragEvent) => {
    event.preventDefault();
    dragCounter++;
    container.classList.add("dragover");
  });

  container.addEventListener("dragleave", (event: DragEvent) => {
    event.preventDefault();
    dragCounter--;
    if (dragCounter <= 0) {
      dragCounter = 0;
      container.classList.remove("dragover");
    }
  });

  container.addEventListener("dragover", (event: DragEvent) => {
    event.preventDefault();
  });

  container.addEventListener("drop", (event: DragEvent) => {
    event.preventDefault();
    dragCounter = 0;
    container.classList.remove("dragover");
    handleFiles(Array.from(event.dataTransfer?.files ?? []));
  });

  const onMouseMove = (event: MouseEvent) => {
    container.style.width = `${Math.max(120, Math.min(400, event.clientX))}px`;
  };

  const onMouseUp = () => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
    document.body.classList.remove("resizing");
  };

  handle.addEventListener("mousedown", (event: MouseEvent) => {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    document.body.classList.add("resizing");
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  });

  return { setActive, setFiles };
}

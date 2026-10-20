export function createSidebar(
  container: HTMLElement,
  files: string[],
  onSelect: (name: string) => void,
): { setActive: (name: string) => void } {
  const fileList = document.createElement("div");
  fileList.className = "sidebar-list";
  const buttons = new Map<string, HTMLButtonElement>();

  for (const name of files) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "sidebar-item";
    button.textContent = name;
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => onSelect(name));
    buttons.set(name, button);
    fileList.append(button);
  }

  const handle = document.createElement("div");
  handle.id = "sidebar-handle";
  handle.setAttribute("aria-hidden", "true");
  container.replaceChildren(fileList, handle);

  const setActive = (name: string) => {
    for (const [fileName, button] of buttons) {
      const active = fileName === name;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    }
  };

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

  return { setActive };
}

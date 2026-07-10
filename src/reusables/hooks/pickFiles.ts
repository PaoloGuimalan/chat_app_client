/**
 * pickFiles
 *
 * Click-to-upload counterpart to useDragAndDrop - opens the native file
 * picker and resolves the selection as a plain File[], so every upload
 * surface can feed both the click path and the drag-drop path into the same
 * File[]-based state. Replaces importData/importNonImageData's base64
 * dual-callback shape.
 */

interface PickFilesOptions {
  /** Same semantics as <input accept>, e.g. "image/*" or "image/*,video/*" */
  accept?: string;
  multiple?: boolean;
}

export function pickFiles({ accept, multiple = true }: PickFilesOptions = {}): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = multiple;
    if (accept) input.accept = accept;

    input.onchange = () => {
      resolve(Array.from(input.files ?? []));
    };

    // Best-effort: not all browsers fire "cancel" on <input type="file">,
    // but where supported this avoids leaving the caller's promise pending.
    input.oncancel = () => resolve([]);

    input.click();
  });
}

// poor man's dnd library

import { useCallback, useMemo, useRef, useState } from "react";

const nativeTypes = [
  "text/plain",
  "text/html",
];

export function useDrag(source, deps?: unknown[]) {
  deps = deps ?? [];
  const data = useMemo(source, deps);

  const handleDragStart = (e: DragEvent) => {
    e.dataTransfer.setData(data.type, JSON.stringify(data.item));
    e.dataTransfer.effectAllowed = "move";
  };

  // TODO: finish handleDragEnd
  const handleDragEnd = (e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.dropEffect == "none") { // canceled
      return;
    } else { // something happend
      data.end(e);
    }
  };

  const clearDrag = (elem: HTMLElement) => {
    elem.removeEventListener("dragstart", handleDragStart);
    elem.removeEventListener("dragend", handleDragEnd);
  };

  const ref = useRef<HTMLElement | null>(null);

  const setDrag = useCallback((elem: HTMLElement) => {
    if (elem == null && ref.current != null) {
      clearDrag(ref.current);
      return;
    }
    ref.current = elem;

    elem.draggable = true;
    elem.addEventListener("dragstart", handleDragStart);
    elem.addEventListener("dragend", handleDragEnd);
  }, deps);

  return [null, setDrag];
}

export function useDrop(source, deps?) {
  deps = deps ?? [];
  const data = useMemo(source, deps);
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: DragEvent) => {
    if (e.dataTransfer.types.some((t) => data.accept.includes(t))) {
      setIsOver(true);
    }
    e.preventDefault();
  };

  const handleDragEnter = (e: DragEvent) => {
    if (e.dataTransfer.types.some((t) => data.accept.includes(t))) {
      setIsOver(true);
    }
    e.preventDefault();
  };

  const handleDragLeave = (e: DragEvent) => {
    setIsOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    for (const type of data.accept) {
      const item = e.dataTransfer.getData(type);
      if (item != "") {
        if (nativeTypes.includes(type)) {
          data.drop(type, item);
        } else {
          data.drop(type, JSON.parse(item));
        }

        break; // use first matched item
      }
    }

    setIsOver(false);
    e.preventDefault();
  };

  const clearDrop = (elem: HTMLElement) => {
    elem.removeEventListener("dragover", handleDragOver);
    elem.removeEventListener("dragenter", handleDragEnter);
    elem.removeEventListener("dragleave", handleDragLeave);
    elem.removeEventListener("drop", handleDrop);
  };

  const ref = useRef<HTMLElement | null>(null);

  const setDrop = useCallback((elem: HTMLElement) => {
    if (elem == null && ref.current != null) {
      clearDrop(ref.current);
      return;
    }
    ref.current = elem;

    elem.addEventListener("dragover", handleDragOver);
    elem.addEventListener("dragenter", handleDragEnter);
    elem.addEventListener("dragleave", handleDragLeave);
    elem.addEventListener("drop", handleDrop);
  }, deps);

  return [{ isOver }, setDrop];
}

"use client";

import { useState } from "react";
import { useActionState } from "react";

export interface NavConfigEditorState {
  error?: string;
  success?: string;
}

export function NavConfigEditor({
  action,
  registry,
  initialConfig,
  lockedKeys,
  btnClass,
}: {
  action: (
    prevState: NavConfigEditorState,
    formData: FormData
  ) => Promise<NavConfigEditorState>;
  registry: { key: string; label: string }[];
  initialConfig: { key: string; visible: boolean }[];
  lockedKeys: string[];
  btnClass: string;
}) {
  const labelByKey = new Map(registry.map((r) => [r.key, r.label]));
  const [items, setItems] = useState(
    initialConfig.map((c) => ({ key: c.key, visible: c.visible }))
  );
  const [state, formAction, pending] = useActionState(action, {} as NavConfigEditorState);

  function move(index: number, dir: -1 | 1) {
    setItems((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function toggleVisible(key: string) {
    setItems((prev) =>
      prev.map((it) => (it.key === key ? { ...it, visible: !it.visible } : it))
    );
  }

  return (
    <form action={formAction} className="space-y-2">
      {items.map((it, index) => (
        <div
          key={it.key}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)] text-[13px]"
        >
          <input type="hidden" name="order" value={it.key} />
          <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
            <input
              type="checkbox"
              name={`visible:${it.key}`}
              checked={it.visible}
              disabled={lockedKeys.includes(it.key)}
              onChange={() => toggleVisible(it.key)}
            />
            <span className="truncate">{labelByKey.get(it.key) ?? it.key}</span>
          </label>
          <button
            type="button"
            onClick={() => move(index, -1)}
            disabled={index === 0}
            aria-label="上へ"
            className="w-7 h-7 rounded-md border border-[var(--border)] flex items-center justify-center text-[var(--muted)] disabled:opacity-30"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => move(index, 1)}
            disabled={index === items.length - 1}
            aria-label="下へ"
            className="w-7 h-7 rounded-md border border-[var(--border)] flex items-center justify-center text-[var(--muted)] disabled:opacity-30"
          >
            ↓
          </button>
        </div>
      ))}
      <div className="flex items-center gap-3 pt-1">
        <button
          disabled={pending}
          className={`h-9 px-4 rounded-md text-[12.5px] font-semibold disabled:opacity-60 ${btnClass}`}
        >
          保存
        </button>
        {state.success && <span className="text-[12px] text-[var(--muted)]">{state.success}</span>}
        {state.error && <span className="text-[12px] text-[var(--danger-text)]">{state.error}</span>}
      </div>
    </form>
  );
}

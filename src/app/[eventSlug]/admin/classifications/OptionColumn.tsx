"use client";

import { useActionState } from "react";
import { createOptionAction, renameOptionAction, deleteOptionAction, type OptionFormState } from "./actions";
import type { ClassificationCategory } from "@/lib/database.types";
import type { ClassificationOption } from "@/lib/data/classificationOptions";

const initialState: OptionFormState = {};

export function OptionColumn({
  eventSlug,
  category,
  title,
  options,
}: {
  eventSlug: string;
  category: ClassificationCategory;
  title: string;
  options: ClassificationOption[];
}) {
  const boundCreate = createOptionAction.bind(null, eventSlug);
  const [state, formAction, pending] = useActionState(boundCreate, initialState);

  return (
    <div className="card p-5 space-y-3">
      <h2 className="text-sm font-bold">{title}</h2>
      <div className="space-y-2">
        {options.length === 0 && (
          <p className="text-[12.5px] text-[var(--muted-2)]">まだ選択肢がありません。</p>
        )}
        {options.map((o) => (
          <OptionRow key={o.id} eventSlug={eventSlug} option={o} />
        ))}
      </div>
      <form
        action={formAction}
        key={state.success}
        className="flex items-center gap-1.5 pt-2 border-t border-[var(--border)]"
      >
        <input type="hidden" name="category" value={category} />
        <input
          name="value"
          required
          placeholder="新しい選択肢を追加"
          className="h-9 flex-1 border border-[var(--border-strong)] rounded-md px-2.5 text-[12.5px]"
        />
        <button
          disabled={pending}
          className="h-9 px-3 rounded-md text-[12.5px] font-semibold btn-admin disabled:opacity-60"
        >
          追加
        </button>
      </form>
      {state.error && <p className="text-[12.5px] text-[var(--danger-text)]">{state.error}</p>}
    </div>
  );
}

function OptionRow({
  eventSlug,
  option,
}: {
  eventSlug: string;
  option: ClassificationOption;
}) {
  const boundRename = renameOptionAction.bind(null, eventSlug, option.id);
  const boundDelete = deleteOptionAction.bind(null, eventSlug, option.id);

  return (
    <div className="flex items-center gap-1.5">
      <form action={boundRename} className="flex-1 flex items-center gap-1.5">
        <input
          name="value"
          defaultValue={option.value}
          aria-label="選択肢の名前"
          className="h-9 flex-1 border border-[var(--border)] rounded-md px-2.5 text-[12.5px]"
        />
        <button className="text-[11.5px] text-[var(--accent-admin-text)] font-semibold flex-none">
          保存
        </button>
      </form>
      <form
        action={boundDelete}
        onSubmit={(e) => {
          if (!confirm(`「${option.value}」を削除しますか？`)) e.preventDefault();
        }}
      >
        <button className="text-[11px] text-[var(--danger-text)] font-semibold flex-none">
          削除
        </button>
      </form>
    </div>
  );
}

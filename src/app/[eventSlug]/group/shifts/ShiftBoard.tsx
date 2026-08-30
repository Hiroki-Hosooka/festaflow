"use client";

import { useActionState, useMemo, useState } from "react";
import {
  saveShiftConfigAction,
  addShiftMemberAction,
  deleteShiftMemberAction,
  submitPreferencesAction,
  autoAssignAction,
  addAssignmentAction,
  removeAssignmentAction,
  type ConfigFormState,
  type PreferenceFormState,
  type AutoAssignState,
} from "./actions";
import type { Database } from "@/lib/database.types";

type ShiftConfigRow = Database["public"]["Tables"]["shift_configs"]["Row"];
type ShiftMemberRow = Database["public"]["Tables"]["shift_members"]["Row"];
type ShiftPreferenceRow = Database["public"]["Tables"]["shift_preferences"]["Row"];
type ShiftAssignmentRow = Database["public"]["Tables"]["shift_assignments"]["Row"];

const configInitialState: ConfigFormState = {};
const prefInitialState: PreferenceFormState = {};
const autoAssignInitialState: AutoAssignState = {};

export function ShiftBoard({
  eventSlug,
  config,
  members,
  preferences,
  assignments,
  slots,
  canEdit,
}: {
  eventSlug: string;
  config: ShiftConfigRow | null;
  members: ShiftMemberRow[];
  preferences: ShiftPreferenceRow[];
  assignments: ShiftAssignmentRow[];
  slots: string[];
  canEdit: boolean;
}) {
  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  return (
    <div className="space-y-5">
      {canEdit && (
        <>
          <ConfigForm eventSlug={eventSlug} config={config} />
          <MemberRoster eventSlug={eventSlug} members={members} />
        </>
      )}

      <PreferenceForm
        eventSlug={eventSlug}
        members={members}
        preferences={preferences}
        slots={slots}
      />

      {slots.length > 0 && (
        <AssignmentGrid
          eventSlug={eventSlug}
          slots={slots}
          members={members}
          memberById={memberById}
          preferences={preferences}
          assignments={assignments}
          canEdit={canEdit}
        />
      )}
    </div>
  );
}

function ConfigForm({
  eventSlug,
  config,
}: {
  eventSlug: string;
  config: ShiftConfigRow | null;
}) {
  const bound = saveShiftConfigAction.bind(null, eventSlug);
  const [state, formAction, pending] = useActionState(bound, configInitialState);

  return (
    <div className="card p-5 space-y-3 print:hidden">
      <h2 className="text-sm font-bold">シフト設定</h2>
      <form action={formAction} className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 items-end">
        <div>
          <label className="block text-[11px] font-semibold mb-1">開始時刻</label>
          <input
            type="time"
            name="start_time"
            defaultValue={config?.start_time ?? "09:00"}
            required
            className="h-9 w-full border border-[var(--border-strong)] rounded-md px-2 text-[12.5px]"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold mb-1">終了時刻</label>
          <input
            type="time"
            name="end_time"
            defaultValue={config?.end_time ?? "16:00"}
            required
            className="h-9 w-full border border-[var(--border-strong)] rounded-md px-2 text-[12.5px]"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold mb-1">1シフトの時間</label>
          <select
            name="slot_minutes"
            defaultValue={config?.slot_minutes ?? 60}
            className="h-9 w-full border border-[var(--border-strong)] rounded-md px-2 text-[12.5px] bg-white"
          >
            <option value={30}>30分</option>
            <option value={60}>60分</option>
            <option value={90}>90分</option>
            <option value={120}>120分</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold mb-1">1コマの人数</label>
          <input
            type="number"
            name="people_per_slot"
            min={1}
            defaultValue={config?.people_per_slot ?? 2}
            className="h-9 w-full border border-[var(--border-strong)] rounded-md px-2 text-[12.5px]"
          />
        </div>
        <button
          disabled={pending}
          className="col-span-2 sm:col-span-4 h-9 rounded-md text-[12.5px] font-semibold btn-group disabled:opacity-60"
        >
          {pending ? "保存中..." : "設定を保存してスロットを生成"}
        </button>
      </form>
      {state.error && <p className="text-[12.5px] text-[var(--danger-text)]">{state.error}</p>}
      {state.success && (
        <p className="text-[12.5px] text-[var(--status-approved-text)]">{state.success}</p>
      )}
    </div>
  );
}

function MemberRoster({
  eventSlug,
  members,
}: {
  eventSlug: string;
  members: ShiftMemberRow[];
}) {
  const boundAdd = addShiftMemberAction.bind(null, eventSlug);

  return (
    <div className="card p-5 space-y-3 print:hidden">
      <h2 className="text-sm font-bold">名簿</h2>
      <div className="flex flex-wrap gap-2">
        {members.length === 0 && (
          <p className="text-[12.5px] text-[var(--muted-2)]">まだ名簿がありません。</p>
        )}
        {members.map((m) => {
          const boundDelete = deleteShiftMemberAction.bind(null, eventSlug, m.id);
          return (
            <span
              key={m.id}
              className="inline-flex items-center gap-1.5 border border-[var(--border)] rounded-full pl-3 pr-1.5 py-1 text-[12.5px]"
            >
              {m.name}
              <form action={boundDelete}>
                <button
                  className="w-5 h-5 rounded-full text-[var(--muted-2)] hover:bg-[var(--background)]"
                  aria-label={`${m.name}を削除`}
                >
                  ×
                </button>
              </form>
            </span>
          );
        })}
      </div>
      <form action={boundAdd} className="flex items-center gap-1.5">
        <input
          name="name"
          required
          placeholder="名前を追加"
          className="h-9 border border-[var(--border-strong)] rounded-md px-2.5 text-[12.5px]"
        />
        <button className="h-9 px-3 rounded-md text-[12.5px] font-semibold btn-group">
          追加
        </button>
      </form>
    </div>
  );
}

function PreferenceForm({
  eventSlug,
  members,
  preferences,
  slots,
}: {
  eventSlug: string;
  members: ShiftMemberRow[];
  preferences: ShiftPreferenceRow[];
  slots: string[];
}) {
  const bound = submitPreferencesAction.bind(null, eventSlug);
  const [state, formAction, pending] = useActionState(bound, prefInitialState);
  const [selectedMember, setSelectedMember] = useState("");

  const existing = useMemo(
    () => preferences.filter((p) => p.member_id === selectedMember),
    [preferences, selectedMember]
  );
  const isNg = (slot: string) => existing.some((p) => p.slot_label === slot && p.kind === "ng");
  const isWant = (slot: string) =>
    existing.some((p) => p.slot_label === slot && p.kind === "want");

  if (slots.length === 0) {
    return null;
  }

  return (
    <div className="card p-5 space-y-3 print:hidden">
      <h2 className="text-sm font-bold">シフト希望の提出</h2>
      <p className="text-[11.5px] text-[var(--muted)]">
        自分の名前を選び、都合の悪いコマ（NG）・特に活動したいコマ（希望）にチェックして送信してください。
      </p>
      <form action={formAction} className="space-y-3">
        <select
          name="member_id"
          value={selectedMember}
          onChange={(e) => setSelectedMember(e.target.value)}
          required
          className="h-9 border border-[var(--border-strong)] rounded-md px-2.5 text-[12.5px] bg-white"
        >
          <option value="">名前を選択...</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        <div className="overflow-x-auto">
          <table className="text-[12px] border-collapse">
            <thead>
              <tr>
                <th className="text-left px-2 py-1">コマ</th>
                <th className="px-2 py-1">NG</th>
                <th className="px-2 py-1">希望</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((slot) => (
                <tr key={slot} className="border-t border-[var(--border)]">
                  <td className="px-2 py-1.5 whitespace-nowrap">{slot}</td>
                  <td className="px-2 py-1.5 text-center">
                    <input
                      type="checkbox"
                      name={`ng:${slot}`}
                      defaultChecked={isNg(slot)}
                      key={`ng-${selectedMember}-${slot}`}
                    />
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <input
                      type="checkbox"
                      name={`want:${slot}`}
                      defaultChecked={isWant(slot)}
                      key={`want-${selectedMember}-${slot}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          disabled={pending || !selectedMember}
          className="h-9 px-4 rounded-md text-[12.5px] font-semibold btn-group disabled:opacity-60"
        >
          {pending ? "送信中..." : "希望を送信"}
        </button>
        {state.error && <p className="text-[12.5px] text-[var(--danger-text)]">{state.error}</p>}
        {state.success && (
          <p className="text-[12.5px] text-[var(--status-approved-text)]">{state.success}</p>
        )}
      </form>
    </div>
  );
}

function AssignmentGrid({
  eventSlug,
  slots,
  members,
  memberById,
  preferences,
  assignments,
  canEdit,
}: {
  eventSlug: string;
  slots: string[];
  members: ShiftMemberRow[];
  memberById: Map<string, ShiftMemberRow>;
  preferences: ShiftPreferenceRow[];
  assignments: ShiftAssignmentRow[];
  canEdit: boolean;
}) {
  const boundAutoAssign = autoAssignAction.bind(null, eventSlug);
  const [state, formAction, pending] = useActionState(boundAutoAssign, autoAssignInitialState);

  const ngLookup = useMemo(
    () =>
      new Set(
        preferences.filter((p) => p.kind === "ng").map((p) => `${p.member_id}:${p.slot_label}`)
      ),
    [preferences]
  );

  const assignmentsBySlot = useMemo(() => {
    const map = new Map<string, ShiftAssignmentRow[]>();
    for (const a of assignments) {
      const arr = map.get(a.slot_label);
      if (arr) arr.push(a);
      else map.set(a.slot_label, [a]);
    }
    return map;
  }, [assignments]);

  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2 print:hidden">
        <h2 className="text-sm font-bold">当番表</h2>
        {canEdit && (
          <form action={formAction}>
            <button
              disabled={pending}
              className="h-9 px-4 rounded-md text-[12.5px] font-semibold btn-approve disabled:opacity-60"
            >
              {pending ? "配置中..." : "自動配置"}
            </button>
          </form>
        )}
      </div>
      {state.error && (
        <p className="text-[12.5px] text-[var(--danger-text)] print:hidden">{state.error}</p>
      )}
      {state.success && (
        <p className="text-[12.5px] text-[var(--status-approved-text)] print:hidden">
          {state.success}
        </p>
      )}
      {state.unfilledSlots && state.unfilledSlots.length > 0 && (
        <p className="text-[12.5px] text-[var(--warn-text)] print:hidden">
          人数が足りないコマ: {state.unfilledSlots.join("、")}
        </p>
      )}

      <div className="space-y-2">
        {slots.map((slot) => {
          const assigned = assignmentsBySlot.get(slot) ?? [];
          return (
            <div
              key={slot}
              className="flex items-start justify-between gap-2 border border-[var(--border)] rounded-lg px-3 py-2 text-[12.5px]"
            >
              <span className="font-semibold whitespace-nowrap pt-1">{slot}</span>
              <div className="flex-1 flex flex-wrap items-center gap-1.5 justify-end">
                {assigned.length === 0 && (
                  <span className="text-[var(--muted-2)]">未割当</span>
                )}
                {assigned.map((a) => {
                  const member = memberById.get(a.member_id);
                  const isNgViolation = ngLookup.has(`${a.member_id}:${slot}`);
                  return (
                    <span
                      key={a.id}
                      className={`inline-flex items-center gap-1 rounded-full pl-2.5 pr-1 py-1 border ${
                        isNgViolation
                          ? "border-[var(--danger-border)] bg-[var(--status-rejected-bg)] text-[var(--danger-text)]"
                          : "border-[var(--border)]"
                      }`}
                      title={isNgViolation ? "この人はこのコマにNGを出しています" : undefined}
                    >
                      {member?.name ?? "不明"}
                      {isNgViolation && "・NG"}
                      {canEdit && (
                        <RemoveAssignmentButton
                          eventSlug={eventSlug}
                          slotLabel={slot}
                          memberId={a.member_id}
                        />
                      )}
                    </span>
                  );
                })}
                {canEdit && (
                  <AddAssignmentForm eventSlug={eventSlug} slotLabel={slot} members={members} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {canEdit && (
        <button
          type="button"
          onClick={() => window.print()}
          className="h-9 px-4 rounded-md text-[12.5px] font-semibold border border-[var(--border-strong)] print:hidden"
        >
          印刷する（PDF保存も可能です）
        </button>
      )}
    </div>
  );
}

function AddAssignmentForm({
  eventSlug,
  slotLabel,
  members,
}: {
  eventSlug: string;
  slotLabel: string;
  members: ShiftMemberRow[];
}) {
  const bound = addAssignmentAction.bind(null, eventSlug);
  return (
    <form action={bound} className="print:hidden">
      <input type="hidden" name="slot_label" value={slotLabel} />
      <select
        name="member_id"
        defaultValue=""
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="h-7 border border-[var(--border)] rounded-md text-[11.5px] bg-white"
      >
        <option value="" disabled>
          追加...
        </option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
    </form>
  );
}

function RemoveAssignmentButton({
  eventSlug,
  slotLabel,
  memberId,
}: {
  eventSlug: string;
  slotLabel: string;
  memberId: string;
}) {
  const bound = removeAssignmentAction.bind(null, eventSlug, slotLabel, memberId);
  return (
    <form action={bound} className="print:hidden">
      <button className="w-4 h-4 leading-none">×</button>
    </form>
  );
}

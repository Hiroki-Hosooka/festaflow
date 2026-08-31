"use client";

import { useActionState, useMemo, useState } from "react";
import {
  saveShiftConfigAction,
  addShiftMemberAction,
  deleteShiftMemberAction,
  submitPreferencesAction,
  bindShiftMemberAction,
  unbindShiftMemberAction,
  autoAssignAction,
  addAssignmentAction,
  removeAssignmentAction,
  type ConfigFormState,
  type PreferenceFormState,
  type BindMemberFormState,
  type AutoAssignState,
} from "./actions";
import type { Database } from "@/lib/database.types";
import { EmptyState } from "@/components/EmptyState";

type ShiftConfigRow = Database["public"]["Tables"]["shift_configs"]["Row"];
type ShiftMemberRow = Database["public"]["Tables"]["shift_members"]["Row"];
type ShiftPreferenceRow = Database["public"]["Tables"]["shift_preferences"]["Row"];
type ShiftAssignmentRow = Database["public"]["Tables"]["shift_assignments"]["Row"];

const configInitialState: ConfigFormState = {};
const prefInitialState: PreferenceFormState = {};
const bindInitialState: BindMemberFormState = {};
const autoAssignInitialState: AutoAssignState = {};

export function ShiftBoard({
  eventSlug,
  config,
  members,
  preferences,
  assignments,
  slots,
  canEdit,
  boundMemberId,
}: {
  eventSlug: string;
  config: ShiftConfigRow | null;
  members: ShiftMemberRow[];
  preferences: ShiftPreferenceRow[];
  assignments: ShiftAssignmentRow[];
  slots: string[];
  canEdit: boolean;
  boundMemberId: string | null;
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
        boundMemberId={boundMemberId}
      />

      {slots.length > 0 ? (
        <AssignmentGrid
          eventSlug={eventSlug}
          slots={slots}
          members={members}
          memberById={memberById}
          preferences={preferences}
          assignments={assignments}
          canEdit={canEdit}
        />
      ) : (
        <div className="card">
          <EmptyState
            icon="calendar"
            title="まだシフトが設定されていません"
            description={
              canEdit
                ? "上の「シフト設定」で活動時間・コマ時間を入力して保存すると、コマ割りと当番表がここに生成されます。"
                : "クラスリーダーがシフト設定を保存すると、当番表がここに表示されます。"
            }
          />
        </div>
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
            type="text"
            inputMode="numeric"
            name="start_time"
            defaultValue={config?.start_time ?? "09:00"}
            placeholder="09:00"
            pattern="^([01]\d|2[0-3]):[0-5]\d$"
            title="24時間表記で「時:分」の形式で入力してください（例: 09:00）"
            required
            className="h-9 w-full border border-[var(--border-strong)] rounded-md px-2 text-[12.5px]"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold mb-1">終了時刻</label>
          <input
            type="text"
            inputMode="numeric"
            name="end_time"
            defaultValue={config?.end_time ?? "16:00"}
            placeholder="16:00"
            pattern="^([01]\d|2[0-3]):[0-5]\d$"
            title="24時間表記で「時:分」の形式で入力してください（例: 16:00）"
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
      <h2 className="card-heading">名簿</h2>
      <div className="flex flex-wrap gap-2">
        {members.length === 0 && (
          <p className="text-[12.5px] text-[var(--muted-2)]">
            まだ名簿がありません
          </p>
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
  boundMemberId,
}: {
  eventSlug: string;
  members: ShiftMemberRow[];
  preferences: ShiftPreferenceRow[];
  slots: string[];
  boundMemberId: string | null;
}) {
  const boundMember =
    boundMemberId != null ? members.find((m) => m.id === boundMemberId) ?? null : null;

  if (slots.length === 0) {
    return null;
  }

  if (!boundMember) {
    return <BindMemberForm eventSlug={eventSlug} members={members} />;
  }

  return (
    <PreferenceChecklist
      eventSlug={eventSlug}
      member={boundMember}
      preferences={preferences}
      slots={slots}
    />
  );
}

function BindMemberForm({
  eventSlug,
  members,
}: {
  eventSlug: string;
  members: ShiftMemberRow[];
}) {
  const bound = bindShiftMemberAction.bind(null, eventSlug);
  const [state, formAction, pending] = useActionState(bound, bindInitialState);
  const [selectedMember, setSelectedMember] = useState("");

  return (
    <div className="card p-5 space-y-3 print:hidden">
      <h2 className="text-sm font-bold">シフト希望の提出</h2>
      <p className="text-[11.5px] text-[var(--muted)]">
        まず名簿から自分の名前を選んでください。一度選ぶと、次回からこの端末では自動で「あなた」として希望を送信できます。
      </p>
      <form action={formAction} className="flex items-center gap-1.5">
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
        <button
          disabled={pending || !selectedMember}
          className="h-9 px-4 rounded-md text-[12.5px] font-semibold btn-group disabled:opacity-60"
        >
          {pending ? "設定中..." : "この名前で始める"}
        </button>
      </form>
      {state.error && <p className="text-[12.5px] text-[var(--danger-text)]">{state.error}</p>}
    </div>
  );
}

function PreferenceChecklist({
  eventSlug,
  member,
  preferences,
  slots,
}: {
  eventSlug: string;
  member: ShiftMemberRow;
  preferences: ShiftPreferenceRow[];
  slots: string[];
}) {
  const bound = submitPreferencesAction.bind(null, eventSlug);
  const [state, formAction, pending] = useActionState(bound, prefInitialState);
  const boundUnbind = unbindShiftMemberAction.bind(null, eventSlug);

  const existing = useMemo(
    () => preferences.filter((p) => p.member_id === member.id),
    [preferences, member.id]
  );
  const isNg = (slot: string) => existing.some((p) => p.slot_label === slot && p.kind === "ng");
  const isWant = (slot: string) =>
    existing.some((p) => p.slot_label === slot && p.kind === "want");

  return (
    <div className="card p-5 space-y-3 print:hidden">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-sm font-bold">シフト希望の提出</h2>
        <form action={boundUnbind}>
          <button className="text-[11.5px] text-[var(--muted)] underline">
            あなた: {member.name}（本人でない場合はこちら）
          </button>
        </form>
      </div>
      <p className="text-[11.5px] text-[var(--muted)]">
        都合の悪いコマ（NG）・特に活動したいコマ（希望）にチェックして送信してください。
      </p>
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="member_id" value={member.id} />
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
                    <input type="checkbox" name={`ng:${slot}`} defaultChecked={isNg(slot)} />
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <input type="checkbox" name={`want:${slot}`} defaultChecked={isWant(slot)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          disabled={pending}
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

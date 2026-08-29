"use client";

import { useActionState, useState } from "react";
import { groupLoginAction, adminLoginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm({
  eventSlug,
  eventName,
  groups,
}: {
  eventSlug: string;
  eventName: string;
  groups: { id: string; name: string }[];
}) {
  const [tab, setTab] = useState<"group" | "admin">("group");

  const boundGroupAction = groupLoginAction.bind(null, eventSlug);
  const boundAdminAction = adminLoginAction.bind(null, eventSlug);
  const [groupState, groupFormAction, groupPending] = useActionState(
    boundGroupAction,
    initialState
  );
  const [adminState, adminFormAction, adminPending] = useActionState(
    boundAdminAction,
    initialState
  );

  return (
    <div className="card w-full max-w-sm p-9 sm:p-10">
      <div className="flex items-center gap-2 mb-8 justify-center">
        <span
          className="w-5 h-5 rounded-md"
          style={{
            background:
              "linear-gradient(135deg, var(--accent-group-from), var(--accent-group-to))",
          }}
        />
        <span className="text-sm font-bold">{eventName}</span>
      </div>

      <div className="flex rounded-lg bg-[oklch(94%_0.01_80)] p-1 mb-6">
        <button
          type="button"
          onClick={() => setTab("group")}
          className={`flex-1 text-center py-2 rounded-md text-[13px] transition ${
            tab === "group"
              ? "bg-white font-bold shadow-sm"
              : "text-[var(--muted)]"
          }`}
        >
          団体としてログイン
        </button>
        <button
          type="button"
          onClick={() => setTab("admin")}
          className={`flex-1 text-center py-2 rounded-md text-[13px] transition ${
            tab === "admin"
              ? "bg-white font-bold shadow-sm"
              : "text-[var(--muted)]"
          }`}
        >
          管理者としてログイン
        </button>
      </div>

      {tab === "group" ? (
        <form action={groupFormAction} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5">
              団体を選択
            </label>
            <select
              name="groupId"
              required
              defaultValue=""
              className="w-full h-10 border border-[var(--border-strong)] rounded-lg px-3 text-sm bg-white"
            >
              <option value="" disabled>
                選択してください
              </option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">合言葉</label>
            <input
              type="password"
              name="passphrase"
              required
              className="w-full h-10 border border-[var(--border-strong)] rounded-lg px-3 text-sm"
            />
          </div>
          {groupState.error && (
            <p className="text-xs text-[var(--danger-text)]">{groupState.error}</p>
          )}
          <button
            type="submit"
            disabled={groupPending}
            className="btn-group w-full h-11 rounded-lg text-sm font-bold disabled:opacity-60"
          >
            {groupPending ? "ログイン中..." : "ログイン"}
          </button>
          <p className="text-center text-[11px] text-[var(--muted-2)] pt-2">
            合言葉は実行委員会から配布されます
          </p>
        </form>
      ) : (
        <form action={adminFormAction} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5">管理者ID</label>
            <input
              name="loginId"
              required
              autoComplete="username"
              className="w-full h-10 border border-[var(--border-strong)] rounded-lg px-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">パスワード</label>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              className="w-full h-10 border border-[var(--border-strong)] rounded-lg px-3 text-sm"
            />
          </div>
          {adminState.error && (
            <p className="text-xs text-[var(--danger-text)]">{adminState.error}</p>
          )}
          <button
            type="submit"
            disabled={adminPending}
            className="btn-admin w-full h-11 rounded-lg text-sm font-bold disabled:opacity-60"
          >
            {adminPending ? "ログイン中..." : "ログイン"}
          </button>
        </form>
      )}
    </div>
  );
}

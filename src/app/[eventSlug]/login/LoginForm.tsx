"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { groupLoginAction, adminLoginAction, type LoginState } from "./actions";
import { BrandMark } from "@/components/BrandMark";

const initialState: LoginState = {};

export function LoginForm({
  eventSlug,
  eventName,
  adminLabel,
  groups,
}: {
  eventSlug: string;
  eventName: string;
  adminLabel: string;
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

  // 失敗時も団体選択・管理者IDは保持し、合言葉・パスワードだけ再入力させる
  // （毎回すべて入力し直させるのはミスの再発を招きやすいため）。
  // React 19のフォームActionは、成否にかかわらず送信のたびにネイティブの
  // form.reset()相当の処理でフォーム部品を初期値に戻してしまう（制御コンポーネントでも
  // DOM側は直接書き換わる）。そのためstateの値を保持するだけでは不十分で、
  // コミット後（useEffect内）にrefで明示的にDOMへ値を書き戻す。
  const [groupId, setGroupId] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const groupIdRef = useRef<HTMLSelectElement>(null);
  const [prevGroupState, setPrevGroupState] = useState(groupState);
  if (groupState !== prevGroupState) {
    setPrevGroupState(groupState);
    if (groupState.error) setPassphrase("");
  }
  useEffect(() => {
    if (groupIdRef.current) groupIdRef.current.value = groupId;
  }, [groupId, groupState]);

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const loginIdRef = useRef<HTMLInputElement>(null);
  const [prevAdminState, setPrevAdminState] = useState(adminState);
  if (adminState !== prevAdminState) {
    setPrevAdminState(adminState);
    if (adminState.error) setPassword("");
  }
  useEffect(() => {
    if (loginIdRef.current) loginIdRef.current.value = loginId;
  }, [loginId, adminState]);

  return (
    <div className="card w-full max-w-sm p-9 sm:p-10">
      <div className="flex items-center gap-2 mb-8 justify-center">
        <BrandMark />
        <span className="text-sm font-bold">{eventName}</span>
      </div>

      <div className="flex rounded-lg bg-[oklch(94%_0.012_155)] p-1 mb-6">
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
        <form action={groupFormAction} noValidate className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5">
              団体を選択
            </label>
            <select
              ref={groupIdRef}
              name="groupId"
              required
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
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
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
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
            合言葉は{adminLabel}から配布されます
          </p>
        </form>
      ) : (
        <form action={adminFormAction} noValidate className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5">管理者ID</label>
            <input
              ref={loginIdRef}
              name="loginId"
              required
              autoComplete="username"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

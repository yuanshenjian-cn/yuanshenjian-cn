"use client";

import { useCallback, useMemo } from "react";

type AdvisorSessionRole = "user" | "assistant";

export interface AdvisorSessionMessage {
  content: string;
  error?: string;
  id: string;
  role: AdvisorSessionRole;
}

interface AdvisorSessionState {
  history: string[];
  messages: AdvisorSessionMessage[];
}

const DEFAULT_HISTORY_ROUNDS = 10;

function maxMessagesForRounds(historyRounds: number) {
  return Math.max(1, historyRounds) * 2;
}

export function formatAdvisorConversationHistory(messages: AdvisorSessionMessage[], historyRounds = DEFAULT_HISTORY_ROUNDS): string[] {
  return messages
    .filter((message) => message.content.trim() && !message.error)
    .slice(-maxMessagesForRounds(historyRounds))
    .map((message) => `${message.role === "user" ? "用户" : "袁慎建"}：${message.content.trim()}`);
}

function isSessionMessage(value: unknown): value is AdvisorSessionMessage {
  if (!value || typeof value !== "object") {
    return false;
  }
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.content === "string" &&
    (item.role === "user" || item.role === "assistant") &&
    (typeof item.error === "undefined" || typeof item.error === "string")
  );
}

export function useAdvisorSession(scene: string, pageSlug?: string, historyRounds = DEFAULT_HISTORY_ROUNDS) {
  const storageKey = useMemo(() => `advisor-session:${scene}:${pageSlug ?? "root"}`, [pageSlug, scene]);
  const maxConversationMessages = maxMessagesForRounds(historyRounds);

  const loadSession = useCallback((): AdvisorSessionState => {
    if (typeof window === "undefined") {
      return { history: [], messages: [] };
    }
    const raw = window.sessionStorage.getItem(storageKey);
    if (!raw) {
      return { history: [], messages: [] };
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return { history: parsed.filter((item): item is string => typeof item === "string"), messages: [] };
      }
      if (!parsed || typeof parsed !== "object") {
        return { history: [], messages: [] };
      }
      const state = parsed as Record<string, unknown>;
      const history = Array.isArray(state.history) ? state.history.filter((item): item is string => typeof item === "string") : [];
      const messages = Array.isArray(state.messages) ? state.messages.filter(isSessionMessage) : [];
      return { history, messages };
    } catch {
      return { history: [], messages: [] };
    }
  }, [storageKey]);

  const saveSession = useCallback(
    (state: AdvisorSessionState) => {
      if (typeof window === "undefined") {
        return;
      }
      window.sessionStorage.setItem(
        storageKey,
        JSON.stringify({
          history: state.history.slice(-maxConversationMessages),
          messages: state.messages.slice(-maxConversationMessages),
        }),
      );
    },
    [maxConversationMessages, storageKey],
  );

  const loadHistory = useCallback((): string[] => {
    const session = loadSession();
    if (session.messages.length > 0) {
      return formatAdvisorConversationHistory(session.messages, historyRounds);
    }
    return session.history.slice(-maxConversationMessages).map((message) => `用户：${message.trim()}`).filter((message) => message !== "用户：");
  }, [historyRounds, loadSession, maxConversationMessages]);

  const loadMessages = useCallback((): AdvisorSessionMessage[] => loadSession().messages, [loadSession]);

  const appendHistory = useCallback(
    (message: string) => {
      if (typeof window === "undefined") {
        return;
      }
      const current = loadSession();
      saveSession({ ...current, history: [...current.history, message] });
    },
    [loadSession, saveSession],
  );

  const saveMessages = useCallback(
    (messages: AdvisorSessionMessage[]) => {
      const current = loadSession();
      saveSession({ ...current, messages });
    },
    [loadSession, saveSession],
  );

  return { appendHistory, loadHistory, loadMessages, saveMessages };
}

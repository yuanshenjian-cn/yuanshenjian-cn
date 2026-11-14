import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { THEME_STORAGE_KEY } from "@/lib/theme";

class MemoryStorage {
  private store = new Map<string, string>();

  get length() {
    return this.store.size;
  }

  clear() {
    this.store.clear();
  }

  getItem(key: string) {
    return this.store.get(key) ?? null;
  }

  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.store.delete(key);
  }

  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
}

// Node 26 的实验性 localStorage 会覆盖 jsdom 的实现，这里显式注入内存版本
Object.defineProperty(window, "localStorage", {
  configurable: true,
  value: new MemoryStorage(),
});

class MockMediaQueryList {
  matches: boolean;
  readonly media = "(prefers-color-scheme: dark)";
  private listeners = new Set<() => void>();

  constructor(matches: boolean) {
    this.matches = matches;
  }

  addEventListener(type: string, listener: () => void) {
    if (type === "change") this.listeners.add(listener);
  }

  removeEventListener(type: string, listener: () => void) {
    if (type === "change") this.listeners.delete(listener);
  }

  setMatches(matches: boolean) {
    this.matches = matches;
    this.listeners.forEach((listener) => listener());
  }
}

let media: MockMediaQueryList;

function setupSystemTheme(initialDark: boolean) {
  media = new MockMediaQueryList(initialDark);
  vi.stubGlobal("matchMedia", (query: string) => {
    expect(query).toBe("(prefers-color-scheme: dark)");
    return media;
  });
}

function renderThemeToggle() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>
  );
}

afterEach(() => {
  window.localStorage.clear();
  document.documentElement.classList.remove("dark");
  vi.unstubAllGlobals();
});

describe("ThemeProvider", () => {
  it("没有用户配置时跟随系统深色设置", () => {
    setupSystemTheme(true);
    renderThemeToggle();

    expect(document.documentElement).toHaveClass("dark");
    expect(screen.getByRole("button")).toHaveAccessibleName("切换到浅色模式");
  });

  it("没有用户配置时响应系统主题的实时变化", () => {
    setupSystemTheme(true);
    renderThemeToggle();

    act(() => media.setMatches(false));

    expect(document.documentElement).not.toHaveClass("dark");
    expect(screen.getByRole("button")).toHaveAccessibleName("切换到深色模式");
  });

  it("已有用户配置时优先于系统设置", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "light");
    setupSystemTheme(true);
    renderThemeToggle();

    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("手动切换后写入配置，并停止跟随系统", () => {
    setupSystemTheme(true);
    renderThemeToggle();

    fireEvent.click(screen.getByRole("button"));

    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(document.documentElement).not.toHaveClass("dark");

    act(() => media.setMatches(false));
    act(() => media.setMatches(true));

    expect(document.documentElement).not.toHaveClass("dark");
    expect(screen.getByRole("button")).toHaveAccessibleName("切换到深色模式");
  });

  it("不会读取旧版本自动写入的 theme 配置", () => {
    window.localStorage.setItem("theme", "dark");
    setupSystemTheme(false);
    renderThemeToggle();

    expect(document.documentElement).not.toHaveClass("dark");
  });
});

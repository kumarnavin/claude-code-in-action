import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationBadge, deriveToolLabel } from "../ToolInvocationBadge";

afterEach(() => cleanup());

// --- A: deriveToolLabel unit tests ---

test("deriveToolLabel: str_replace_editor create", () => {
  expect(deriveToolLabel("str_replace_editor", { command: "create", path: "/src/App.tsx" })).toBe(
    "Creating /src/App.tsx"
  );
});

test("deriveToolLabel: str_replace_editor str_replace", () => {
  expect(
    deriveToolLabel("str_replace_editor", { command: "str_replace", path: "/src/App.tsx" })
  ).toBe("Editing /src/App.tsx");
});

test("deriveToolLabel: str_replace_editor insert", () => {
  expect(
    deriveToolLabel("str_replace_editor", { command: "insert", path: "/src/index.ts" })
  ).toBe("Editing /src/index.ts");
});

test("deriveToolLabel: str_replace_editor view", () => {
  expect(deriveToolLabel("str_replace_editor", { command: "view", path: "/readme.md" })).toBe(
    "Reading /readme.md"
  );
});

test("deriveToolLabel: str_replace_editor undo_edit", () => {
  expect(
    deriveToolLabel("str_replace_editor", { command: "undo_edit", path: "/src/App.tsx" })
  ).toBe("Undoing edit on /src/App.tsx");
});

test("deriveToolLabel: file_manager rename", () => {
  expect(
    deriveToolLabel("file_manager", { command: "rename", path: "/old.ts", new_path: "/new.ts" })
  ).toBe("Renaming /old.ts");
});

test("deriveToolLabel: file_manager delete", () => {
  expect(
    deriveToolLabel("file_manager", { command: "delete", path: "/src/unused.ts" })
  ).toBe("Deleting /src/unused.ts");
});

test("deriveToolLabel: unknown tool returns tool name", () => {
  expect(deriveToolLabel("mystery_tool", { command: "anything" })).toBe("mystery_tool");
});

test("deriveToolLabel: str_replace_editor unknown command returns tool name", () => {
  expect(deriveToolLabel("str_replace_editor", { command: "unknown_cmd", path: "/x.ts" })).toBe(
    "str_replace_editor"
  );
});

test("deriveToolLabel: empty args returns tool name", () => {
  expect(deriveToolLabel("str_replace_editor", {})).toBe("str_replace_editor");
});

// --- B: in-progress states show spinner, no green dot ---

test("ToolInvocationBadge shows spinner when state is partial-call", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolInvocation={{
        toolCallId: "abc",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/src/App.tsx" },
        state: "partial-call",
      }}
    />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("ToolInvocationBadge shows spinner when state is call", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolInvocation={{
        toolCallId: "abc",
        toolName: "str_replace_editor",
        args: { command: "view", path: "/src/App.tsx" },
        state: "call",
      }}
    />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

// --- C: completed state ---

test("ToolInvocationBadge shows green dot when state is result with truthy result", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolInvocation={{
        toolCallId: "abc",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/src/App.tsx" },
        state: "result",
        result: "file created",
      }}
    />
  );
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("ToolInvocationBadge shows spinner when state is result but result is falsy", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolInvocation={{
        toolCallId: "abc",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/src/App.tsx" },
        state: "result",
        result: null,
      }}
    />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

// --- D: label text ---

test("ToolInvocationBadge renders correct label for str_replace_editor create", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={{
        toolCallId: "abc",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/src/Button.tsx" },
        state: "result",
        result: "ok",
      }}
    />
  );
  expect(screen.getByText("Creating /src/Button.tsx")).toBeDefined();
});

test("ToolInvocationBadge renders correct label for file_manager delete in-progress", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={{
        toolCallId: "xyz",
        toolName: "file_manager",
        args: { command: "delete", path: "/src/old.ts" },
        state: "call",
      }}
    />
  );
  expect(screen.getByText("Deleting /src/old.ts")).toBeDefined();
});

test("ToolInvocationBadge renders tool name for unknown tool", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={{
        toolCallId: "xyz",
        toolName: "mystery_tool",
        args: {},
        state: "call",
      }}
    />
  );
  expect(screen.getByText("mystery_tool")).toBeDefined();
});

// --- E: outer container styling ---

test("ToolInvocationBadge outer div has correct styling classes", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolInvocation={{
        toolCallId: "abc",
        toolName: "str_replace_editor",
        args: { command: "view", path: "/x.ts" },
        state: "call",
      }}
    />
  );
  const outer = container.firstChild as HTMLElement;
  expect(outer.className).toContain("inline-flex");
  expect(outer.className).toContain("items-center");
  expect(outer.className).toContain("bg-neutral-50");
  expect(outer.className).toContain("rounded-lg");
  expect(outer.className).toContain("font-mono");
  expect(outer.className).toContain("border-neutral-200");
});

"use client";

import type { ToolInvocation } from "ai";
import { Loader2 } from "lucide-react";

export function deriveToolLabel(
  toolName: string,
  args: Record<string, unknown>
): string {
  if (toolName === "str_replace_editor") {
    switch (args.command) {
      case "create":
        return `Creating ${args.path}`;
      case "str_replace":
      case "insert":
        return `Editing ${args.path}`;
      case "view":
        return `Reading ${args.path}`;
      case "undo_edit":
        return `Undoing edit on ${args.path}`;
      default:
        return toolName;
    }
  }

  if (toolName === "file_manager") {
    switch (args.command) {
      case "rename":
        return `Renaming ${args.path}`;
      case "delete":
        return `Deleting ${args.path}`;
      default:
        return toolName;
    }
  }

  return toolName;
}

interface ToolInvocationBadgeProps {
  toolInvocation: ToolInvocation;
}

export function ToolInvocationBadge({ toolInvocation }: ToolInvocationBadgeProps) {
  const label = deriveToolLabel(
    toolInvocation.toolName,
    (toolInvocation.args as Record<string, unknown>) ?? {}
  );
  const isComplete =
    toolInvocation.state === "result" &&
    "result" in toolInvocation &&
    toolInvocation.result;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isComplete ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}

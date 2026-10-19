"use client";

import { useEffect, useState } from "react";

/** Copies `text`; the status region stays mounted so screen readers announce "Copied". */
export function CopyButton({
  text,
  labels,
}: {
  text: string;
  labels: { copy: string; copied: string };
}) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(timer);
  }, [copied]);
  return (
    <>
      <button
        type="button"
        className="ghost-button"
        onClick={() => navigator.clipboard.writeText(text).then(() => setCopied(true))}
      >
        {copied ? labels.copied : labels.copy}
      </button>
      <span role="status" className="visually-hidden">
        {copied ? labels.copied : ""}
      </span>
    </>
  );
}

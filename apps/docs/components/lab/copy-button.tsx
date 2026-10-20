"use client";

import { Button } from "owsem-ui/base";
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
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigator.clipboard.writeText(text).then(() => setCopied(true))}
      >
        {/* Both words hold the width, so the button never resizes; the hidden one is not read. */}
        <span className="copy-label">
          <span style={{ visibility: copied ? "hidden" : undefined }}>{labels.copy}</span>
          <span style={{ visibility: copied ? undefined : "hidden" }}>{labels.copied}</span>
        </span>
      </Button>
      <span role="status" className="visually-hidden">
        {copied ? labels.copied : ""}
      </span>
    </>
  );
}

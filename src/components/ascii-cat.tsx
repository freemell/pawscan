"use client";

import { useMemo, useState } from "react";

const CAT_FRAMES = [
  `∧,,,∧
( ̳• · • ̳)
/    づ♡  scanning...
pussys and boots
CLAWED`,
  `∧,,,∧
( ̳• · • ̳)
/    づ♡  syncing...
I'm pawsome and pawxy
use your pc please :)`,
];

export function AsciiCat() {
  const [frame, setFrame] = useState(0);
  useMemo(() => {
    const id = setInterval(
      () => setFrame((prev) => (prev + 1) % CAT_FRAMES.length),
      1200,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <pre className="mb-4 whitespace-pre-wrap text-lg text-[var(--terminal-accent)]">
      {CAT_FRAMES[frame]}
    </pre>
  );
}


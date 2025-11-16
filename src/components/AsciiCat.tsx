import React, { useEffect, useMemo, useRef, useState } from 'react';
import Typed from 'typed.js';

const CAT = `
∧,,,∧
( ̳• · • ̳)
/    づ♡ connected by
pussys and Love
CLAWED
`;

export default function AsciiCat() {
  const elRef = useRef<HTMLSpanElement | null>(null);
  const [blink, setBlink] = useState<boolean>(true);

  useEffect(() => {
    const typed = new Typed(elRef.current!, {
      strings: [CAT],
      typeSpeed: 8,
      showCursor: true,
      cursorChar: '_',
    });
    const blinkInt = setInterval(() => setBlink((b) => !b), 1000);
    return () => {
      typed.destroy();
      clearInterval(blinkInt);
    };
  }, []);

  // Optional purr audio (very subtle)
  const audio = useMemo(() => {
    const a = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABYAZGF0YQAAAAA=');
    a.volume = 0.1;
    return a;
  }, []);

  return (
    <div className="ascii-box purr" onMouseEnter={() => audio.play()}>
      <span ref={elRef} />
      <div className="cursor-blink">{blink ? '▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒' : '                  '}</div>
    </div>
  );
}



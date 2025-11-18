export function TerminalTitle() {
  return (
    <div className="text-center text-xl text-[var(--terminal-accent)] md:text-2xl">
      PawScan ▒ Solana Intelligence Terminal <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect width="100%" height="100%" fill="transparent"/>
      <g fontFamily="monospace" fontSize="12" fill="#00FF00">
    <text x="6" y="18"> /\_/\ </text>
    <text x="6" y="34">( o.o )</text>
    <text x="6" y="50"> &gt; ^ &lt; </text>
  </g>
</svg>
 ▒{" "}
      <span className="blink">█</span>
    </div>
  );
}


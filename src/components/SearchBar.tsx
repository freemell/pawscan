import React from 'react';

type Props = {
  value: string;
  onChange: (v: string) => void;
};

export default function SearchBar({ value, onChange }: Props) {
  return (
    <div className="prompt">
      <span>&gt;</span>
      <input
        aria-label="Search tokens"
        placeholder="Paw Through Tokens (type name or symbol)..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <span className="cursor-blink">▋</span>
    </div>
  );
}



const palettes = [
  ["#14b8a6", "#f43f5e", "#fde047", "#0f172a"],
  ["#22c55e", "#38bdf8", "#f97316", "#18181b"],
  ["#facc15", "#06b6d4", "#e11d48", "#111827"],
  ["#2dd4bf", "#fb7185", "#a3e635", "#020617"],
  ["#4ade80", "#f472b6", "#fbbf24", "#0a0a0a"]
];

function hash(value: string) {
  return value.split("").reduce((acc, char) => {
    return (acc << 5) - acc + char.charCodeAt(0);
  }, 0);
}

export function albumArtGradient(id: string) {
  const seed = Math.abs(hash(id));
  const colors = palettes[seed % palettes.length];
  const angle = 120 + (seed % 140);
  const x = 20 + (seed % 58);
  const y = 18 + ((seed >> 3) % 60);

  return {
    backgroundImage: `
      radial-gradient(circle at ${x}% ${y}%, ${colors[0]} 0, transparent 36%),
      radial-gradient(circle at ${100 - x}% ${100 - y}%, ${colors[1]} 0, transparent 34%),
      radial-gradient(circle at 50% 62%, ${colors[2]} 0, transparent 42%),
      linear-gradient(${angle}deg, ${colors[3]}, #020617)
    `
  };
}

export const avatarPresets = [
  {
    id: "captain",
    name: "Captain",
    code: "C",
    role: "Armband",
    icon: "Crown",
    gradient: "from-sky-500 via-blue-500 to-indigo-600",
    glow: "shadow-[0_0_24px_rgba(59,130,246,0.28)]",
  },
  {
    id: "striker",
    name: "Striker",
    code: "9",
    role: "Finisher",
    icon: "Target",
    gradient: "from-amber-400 via-orange-500 to-red-500",
    glow: "shadow-[0_0_24px_rgba(249,115,22,0.28)]",
  },
  {
    id: "playmaker",
    name: "Playmaker",
    code: "10",
    role: "Creator",
    icon: "Sparkles",
    gradient: "from-fuchsia-500 via-violet-500 to-indigo-600",
    glow: "shadow-[0_0_24px_rgba(168,85,247,0.28)]",
  },
  {
    id: "keeper",
    name: "Gloves",
    code: "GK",
    role: "Goalkeeper",
    icon: "Hand",
    gradient: "from-emerald-400 via-teal-500 to-cyan-600",
    glow: "shadow-[0_0_24px_rgba(20,184,166,0.28)]",
  },
  {
    id: "winger",
    name: "Winger",
    code: "11",
    role: "Pace",
    icon: "Wind",
    gradient: "from-pink-500 via-rose-500 to-orange-500",
    glow: "shadow-[0_0_24px_rgba(244,63,94,0.28)]",
  },
  {
    id: "maestro",
    name: "Maestro",
    code: "8",
    role: "Tempo",
    icon: "Waves",
    gradient: "from-cyan-400 via-sky-500 to-blue-700",
    glow: "shadow-[0_0_24px_rgba(14,165,233,0.28)]",
  },
  {
    id: "anchor",
    name: "Anchor",
    code: "6",
    role: "Control",
    icon: "Orbit",
    gradient: "from-slate-400 via-slate-600 to-slate-800",
    glow: "shadow-[0_0_24px_rgba(71,85,105,0.3)]",
  },
  {
    id: "wall",
    name: "Wall",
    code: "CB",
    role: "Defence",
    icon: "Shield",
    gradient: "from-zinc-400 via-neutral-600 to-stone-800",
    glow: "shadow-[0_0_24px_rgba(115,115,115,0.28)]",
  },
  {
    id: "talisman",
    name: "Talisman",
    code: "7",
    role: "Clutch",
    icon: "Star",
    gradient: "from-yellow-300 via-amber-500 to-orange-600",
    glow: "shadow-[0_0_24px_rgba(245,158,11,0.3)]",
  },
  {
    id: "engine",
    name: "Engine",
    code: "B2B",
    role: "Midfield",
    icon: "Zap",
    gradient: "from-lime-400 via-emerald-500 to-green-700",
    glow: "shadow-[0_0_24px_rgba(34,197,94,0.28)]",
  },
  {
    id: "derby",
    name: "Derby",
    code: "UL",
    role: "Spirit",
    icon: "Flame",
    gradient: "from-red-500 via-rose-600 to-pink-700",
    glow: "shadow-[0_0_24px_rgba(225,29,72,0.28)]",
  },
  {
    id: "champion",
    name: "Champion",
    code: "XI",
    role: "Legacy",
    icon: "Trophy",
    gradient: "from-violet-400 via-purple-600 to-indigo-700",
    glow: "shadow-[0_0_24px_rgba(124,58,237,0.28)]",
  },
];

export const defaultAvatarId = "captain";

export function getAvatarPreset(avatarId) {
  return (
    avatarPresets.find((preset) => preset.id === avatarId) ||
    avatarPresets.find((preset) => preset.id === defaultAvatarId) ||
    avatarPresets[0]
  );
}

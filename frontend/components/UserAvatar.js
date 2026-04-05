"use client";

import {
  Crown,
  Flame,
  Hand,
  Orbit,
  Shield,
  Sparkles,
  Star,
  Target,
  Trophy,
  Waves,
  Wind,
  Zap,
} from "lucide-react";
import { defaultAvatarId, getAvatarPreset } from "@/lib/avatarPresets";

const iconMap = {
  Crown,
  Flame,
  Hand,
  Orbit,
  Shield,
  Sparkles,
  Star,
  Target,
  Trophy,
  Waves,
  Wind,
  Zap,
};

export default function UserAvatar({
  avatarId = defaultAvatarId,
  size = "md",
  className = "",
  showLabel = false,
}) {
  const preset = getAvatarPreset(avatarId);

  const sizeMap = {
    sm: {
      outer: "h-12 w-12",
      icon: "h-5 w-5",
      ring: "p-[1.5px]",
      sub: "text-[10px]",
    },
    md: {
      outer: "h-16 w-16",
      icon: "h-7 w-7",
      ring: "p-[2px]",
      sub: "text-[11px]",
    },
    lg: {
      outer: "h-20 w-20",
      icon: "h-9 w-9",
      ring: "p-[2px]",
      sub: "text-xs",
    },
  };

  const currentSize = sizeMap[size] || sizeMap.md;
  const wrapperClass = showLabel ? "flex w-full items-center gap-3.5" : "flex items-center gap-3";
  const Icon = iconMap[preset.icon] || Shield;

  return (
    <div className={`${wrapperClass} ${className}`}>
      <div
        className={`${currentSize.outer} ${currentSize.ring} rounded-2xl bg-gradient-to-br ${preset.gradient} ${preset.glow}`}
      >
        <div className="relative flex h-full w-full items-center justify-center rounded-[15px] border border-white/10 bg-[#0f172a]/88 text-white">
          <div className="absolute inset-0 rounded-[15px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_52%)]" />
          <Icon className={`${currentSize.icon} relative z-[1] text-white`} strokeWidth={2.4} />
        </div>
      </div>

      {showLabel ? (
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-black leading-tight text-white sm:text-[15px]">
            {preset.name}
          </p>
          <p className="mt-1 text-[10px] font-black uppercase leading-tight tracking-[0.18em] text-slate-500 sm:text-[11px]">
            {preset.role}
          </p>
        </div>
      ) : null}
    </div>
  );
}

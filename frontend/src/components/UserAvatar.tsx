"use client";

/**
 * UserAvatar — deterministic gradient letter-avatar.
 * No external image fetching. Works for any name.
 *
 * The colour pair is chosen by hashing the first character of the name,
 * so the same user always gets the same colour — it feels "personal"
 * without needing a real photo.
 */

const GRADIENTS: [string, string][] = [
  ["#6366F1", "#8B5CF6"], // indigo → violet
  ["#3B82F6", "#06B6D4"], // blue → cyan
  ["#10B981", "#3B82F6"], // emerald → blue
  ["#F59E0B", "#EF4444"], // amber → red
  ["#EC4899", "#8B5CF6"], // pink → violet
  ["#14B8A6", "#6366F1"], // teal → indigo
  ["#F97316", "#EC4899"], // orange → pink
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map(w => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getGradient(name: string): [string, string] {
  const code = (name.charCodeAt(0) || 0) + (name.charCodeAt(1) || 0);
  return GRADIENTS[code % GRADIENTS.length];
}

interface UserAvatarProps {
  name: string;
  size?: number;      // pixel size, default 36
  className?: string; // extra Tailwind classes for the wrapper
}

export default function UserAvatar({ name, size = 36, className = "" }: UserAvatarProps) {
  const initials  = getInitials(name || "?");
  const [from, to] = getGradient(name || "?");
  const fontSize  = Math.max(Math.round(size * 0.38), 10);

  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold text-white select-none shrink-0 ${className}`}
      style={{
        width:      size,
        height:     size,
        fontSize,
        background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
        letterSpacing: "0.04em",
      }}
      aria-label={name}
    >
      {initials}
    </div>
  );
}

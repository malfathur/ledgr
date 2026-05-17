"use client";

import { useRef, useState } from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
};

export default function TiltCard({
  children,
  className = "",
  glowColor = "rgba(255,255,255,0.06)",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState({});

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left  - rect.width  / 2;
    const y = e.clientY - rect.top   - rect.height / 2;

    const rotateX = -(y / (rect.height / 2)) * 4;
    const rotateY =  (x / (rect.width  / 2)) * 4;

    setStyle({
      transform: `perspective(900px) translateZ(24px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`,
      transition: "transform 0.08s ease-out",
      boxShadow: `0 24px 48px rgba(0,0,0,0.55), 0 0 28px ${glowColor}`,
      zIndex: 10,
    });
  }

  function handleMouseLeave() {
    setStyle({
      transform: "perspective(900px) translateZ(0px) rotateX(0deg) rotateY(0deg) scale(1)",
      transition: "transform 0.45s ease-out, box-shadow 0.45s ease-out",
      boxShadow: "none",
      zIndex: 0,
    });
  }

  return (
    <div
      ref={ref}
      style={style}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
    >
      {children}
    </div>
  );
}

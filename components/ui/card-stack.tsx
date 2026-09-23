"use client";

import * as React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

export type CardStackItem = { id: string | number; title: string; description?: string };

export type CardStackProps<T extends CardStackItem> = {
  items: T[];
  initialIndex?: number;
  maxVisible?: number;
  cardWidth?: number;
  cardHeight?: number;
  overlap?: number;
  spreadDeg?: number;
  perspectivePx?: number;
  depthPx?: number;
  tiltXDeg?: number;
  activeLiftPx?: number;
  activeScale?: number;
  inactiveScale?: number;
  loop?: boolean;
  showDots?: boolean;
  className?: string;
  onChangeIndex?: (index: number, item: T) => void;
  renderCard: (item: T, state: { active: boolean }) => React.ReactNode;
};

export function wrapIndex(n: number, len: number) {
  if (len <= 0) return 0;
  return ((n % len) + len) % len;
}

export function signedOffset(i: number, active: number, len: number, loop: boolean) {
  const raw = i - active;
  if (!loop || len <= 1) return raw;
  const alternate = raw > 0 ? raw - len : raw + len;
  return Math.abs(alternate) < Math.abs(raw) ? alternate : raw;
}

export function CardStack<T extends CardStackItem>({
  items, initialIndex = 0, maxVisible = 7, cardWidth = 228, cardHeight = 302,
  overlap = 0.48, spreadDeg = 48, perspectivePx = 1100, depthPx = 140, tiltXDeg = 12,
  activeLiftPx = 22, activeScale = 1.03, inactiveScale = 0.94, loop = true,
  showDots = true, className, onChangeIndex, renderCard,
}: CardStackProps<T>) {
  const reduceMotion = useReducedMotion();
  const len = items.length;
  const [active, setActive] = React.useState(() => wrapIndex(initialIndex, len));
  const [hovering, setHovering] = React.useState(false);
  React.useEffect(() => setActive(index => wrapIndex(index, len)), [len]);
  React.useEffect(() => { if (len) onChangeIndex?.(active, items[active]!); }, [active, items, len, onChangeIndex]);
  const maxOffset = Math.max(0, Math.floor(maxVisible / 2));
  const cardSpacing = Math.max(10, Math.round(cardWidth * (1 - overlap)));
  const stepDeg = maxOffset ? spreadDeg / maxOffset : 0;
  const go = (direction: -1 | 1) => setActive(index => {
    if (!loop && ((direction < 0 && index === 0) || (direction > 0 && index === len - 1))) return index;
    return wrapIndex(index + direction, len);
  });
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowLeft') go(-1);
    if (event.key === 'ArrowRight') go(1);
  };

  if (!len) return <div className={className} aria-label="No saved books" />;
  return <div className={`card-stack ${className ?? ''}`} onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}>
    <div className="card-stack-stage" style={{ height: Math.max(380, cardHeight + 78), perspective: perspectivePx }} tabIndex={0} onKeyDown={onKeyDown}>
      <div className="card-stack-glow" aria-hidden="true" />
      <div className="card-stack-shelf" aria-hidden="true" />
      <div className="card-stack-layer">
        <AnimatePresence initial={false}>
          {items.map((item, index) => {
            const offset = signedOffset(index, active, len, loop);
            const absolute = Math.abs(offset);
            if (absolute > maxOffset) return null;
            const activeCard = offset === 0;
            const x = offset * cardSpacing;
            const y = absolute * 10;
            const z = -absolute * depthPx;
            return <motion.div key={item.id} className={`card-stack-card ${activeCard ? 'active' : ''}`} style={{ width: cardWidth, height: cardHeight, zIndex: 100 - absolute, transformStyle: 'preserve-3d' }}
              initial={reduceMotion ? false : { opacity: 0, y: y + 40, x, rotateZ: offset * stepDeg, rotateX: activeCard ? 0 : tiltXDeg, scale: activeCard ? activeScale : inactiveScale }}
              animate={{ opacity: 1, x, y: y + (activeCard ? -activeLiftPx : 0), rotateZ: offset * stepDeg, rotateX: activeCard ? 0 : tiltXDeg, scale: activeCard ? activeScale : inactiveScale }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              onClick={() => setActive(index)}
              drag={activeCard ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.18}
              onDragEnd={(_event, info) => { if (reduceMotion) return; if (info.offset.x > Math.min(100, cardWidth * .22) || info.velocity.x > 650) go(-1); else if (info.offset.x < -Math.min(100, cardWidth * .22) || info.velocity.x < -650) go(1); }}>
              <div className="card-stack-card-depth" style={{ transform: `translateZ(${z}px)`, transformStyle: 'preserve-3d' }}>{renderCard(item, { active: activeCard })}</div>
            </motion.div>;
          })}
        </AnimatePresence>
      </div>
    </div>
    {showDots && <div className="card-stack-dots" onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}>{items.map((item, index) => <button key={item.id} className={index === active ? 'active' : ''} aria-label={`Go to ${item.title}`} onClick={() => setActive(index)} />)}</div>}
    <span className="sr-only" aria-live="polite">{hovering ? 'Book stack focused.' : ''}</span>
  </div>;
}


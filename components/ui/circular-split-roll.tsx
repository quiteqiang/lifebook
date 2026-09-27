import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  gsap.registerPlugin(ScrollTrigger);
}

export type CircularSplitRollItem = {
  id: string;
  title: string;
  image: string;
  alt: string;
};

type CircularPosition = {
  x: number;
  y: number;
  scale: number;
  opacity: number;
};

/** Pure geometry kept separate so the circular layout can be checked without a browser. */
export function getCircularPosition(progress: number, index: number, count: number, radius: number, phase = 0): CircularPosition {
  const safeCount = Math.max(1, count);
  const angle = phase + progress * Math.PI * 2 + (index / safeCount) * Math.PI * 2;
  const depth = (Math.sin(angle) + 1) / 2;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius * 0.6,
    scale: 0.72 + depth * 0.28,
    opacity: 0.24 + depth * 0.76,
  };
}

type CircularSplitRollProps = {
  items: CircularSplitRollItem[];
  onCardClick?: (item: CircularSplitRollItem) => void;
  sectionHeight?: number;
  className?: string;
};

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener?.('change', update);
    return () => query.removeEventListener?.('change', update);
  }, [setReduced]);
  return reduced;
}

export function CircularSplitRoll({ items, onCardClick, sectionHeight = 100, className = '' }: CircularSplitRollProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion || typeof window === 'undefined' || typeof window.matchMedia !== 'function' || !rootRef.current || !stickyRef.current || items.length < 2) return;
    const root = rootRef.current;
    const sticky = stickyRef.current;
    const scroller = root.parentElement;
    const titleNodes = Array.from(root.querySelectorAll<HTMLElement>('[data-roll-title]'));
    const imageNodes = Array.from(root.querySelectorAll<HTMLElement>('[data-roll-image]'));
    const context = gsap.context(() => {
      const render = (progress: number) => {
        const width = root.clientWidth;
        const half = Math.max(130, width / 2);
        const titleRadius = Math.min(half * 0.58, 170);
        const imageRadius = Math.min(half * 0.58, 180);
        titleNodes.forEach((node, index) => {
          const position = getCircularPosition(progress, index, items.length, titleRadius, Math.PI / 2);
          gsap.set(node, { x: position.x, y: position.y, scale: position.scale, autoAlpha: position.opacity, zIndex: Math.round(position.opacity * 10) });
        });
        imageNodes.forEach((node, index) => {
          const position = getCircularPosition(progress, index, items.length, imageRadius, 0);
          gsap.set(node, { x: position.x, y: position.y, scale: position.scale, autoAlpha: position.opacity, zIndex: Math.round(position.opacity * 10) });
        });
      };
      render(0);
      const trigger = ScrollTrigger.create({
        trigger: root,
        scroller: scroller ?? undefined,
        start: 'top top',
        end: () => `+=${Math.max(1, root.scrollHeight - (scroller?.clientHeight ?? window.innerHeight))}`,
        pin: sticky,
        scrub: 1.1,
        onUpdate: self => render(self.progress),
      });
      return () => trigger.kill();
    }, root);
    return () => context.revert();
  }, [items.length, reducedMotion, sectionHeight]);

  const scrollExtra = Math.max(640, Math.round(items.length * Math.max(48, sectionHeight * 0.6)));
  return <section ref={rootRef} className={`circular-roll ${className}`} style={{ minHeight: `calc(100% + ${scrollExtra}px)` }} aria-label="MyBook circular memory roll">
    <div ref={stickyRef} className="circular-roll-sticky">
      <div className="circular-roll-columns">
        <div className="circular-roll-column circular-roll-titles" aria-label="Memory titles">
          {items.map(item => <span key={`title-${item.id}`} data-roll-title className="circular-roll-title">{item.title}</span>)}
        </div>
        <div className="circular-roll-column circular-roll-images" aria-label="Memory covers">
          {items.map(item => <button key={`image-${item.id}`} data-roll-image className="circular-roll-image" type="button" onClick={() => onCardClick?.(item)} aria-label={`Open ${item.title}`}>
            <img src={item.image} alt={item.alt} draggable={false} />
          </button>)}
        </div>
      </div>
    </div>
    <div className="circular-roll-mobile" aria-label="Memory covers">
      {items.map(item => <button key={`mobile-${item.id}`} className="circular-roll-mobile-card" type="button" onClick={() => onCardClick?.(item)} aria-label={`Open ${item.title}`}>
        <img src={item.image} alt={item.alt} draggable={false} />
        <span>{item.title}</span>
      </button>)}
    </div>
  </section>;
}

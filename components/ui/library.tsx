import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { BookOpen, Play, RotateCcw, X } from 'lucide-react';

type Volume = {
  id: number;
  month: string;
  subtitle: string;
  roman: string;
  count: string;
  tone: 'slate' | 'crimson' | 'gold' | 'moss' | 'indigo' | 'rose' | 'teal' | 'copper' | 'violet' | 'navy' | 'wine' | 'sand';
};

const volumes: Volume[] = [
  { id: 1, month: 'January 2026', subtitle: 'FROST & FIRST LIGHT', roman: 'I', count: '12 REC', tone: 'slate' },
  { id: 2, month: 'February 2026', subtitle: 'CRIMSON HORIZON', roman: 'II', count: '18 REC', tone: 'crimson' },
  { id: 3, month: 'March 2026', subtitle: 'GOLDEN EQUINOX', roman: 'III', count: '21 REC', tone: 'gold' },
  { id: 4, month: 'April 2026', subtitle: 'RAIN ON GLASS', roman: 'IV', count: '16 REC', tone: 'moss' },
  { id: 5, month: 'May 2026', subtitle: 'SOFT GREEN DAYS', roman: 'V', count: '24 REC', tone: 'indigo' },
  { id: 6, month: 'June 2026', subtitle: 'WINTER TIDE', roman: 'VI', count: '27 REC', tone: 'rose' },
  { id: 7, month: 'July 2026', subtitle: 'SOLITUDE & RAIN', roman: 'VII', count: '29 REC', tone: 'teal' },
  { id: 8, month: 'August 2026', subtitle: 'EMBER HORIZON', roman: 'VIII', count: '31 REC', tone: 'copper' },
  { id: 9, month: 'September 2026', subtitle: 'GOLDEN EQUINOX', roman: 'IX', count: 'IN PROGRESS', tone: 'violet' },
  { id: 10, month: 'October 2026', subtitle: 'EMBER LETTERS', roman: 'X', count: '— REC', tone: 'navy' },
  { id: 11, month: 'November 2026', subtitle: 'QUIET HARVEST', roman: 'XI', count: '— REC', tone: 'wine' },
  { id: 12, month: 'December 2026', subtitle: 'THE LONG NIGHT', roman: 'XII', count: '— REC', tone: 'sand' },
];

type LibraryProps = { onReplay?: () => void };

export function Library({ onReplay }: LibraryProps) {
  const [openVolume, setOpenVolume] = useState<Volume | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(1);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const turnActionRef = useRef<HTMLButtonElement | null>(null);
  const bookRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const posRef = useRef(1);
  const pitchRef = useRef(108);
  const rafRef = useRef<number | null>(null);
  const dragRef = useRef<{ pointerId: number; startX: number; startPos: number; velocity: number; time: number } | null>(null);

  const openBook = (volume: Volume) => {
    setOpenVolume(volume);
    setFlipped(false);
    setIsOpening(!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  };
  const closeBook = () => { setOpenVolume(null); setFlipped(false); setIsOpening(false); };
  const turnPage = () => {
    if (!flipped) turnActionRef.current?.focus();
    setFlipped(value => !value);
  };
  const indexAt = useCallback((position: number) => Math.round(position), []);
  const clamp = useCallback((position: number) => Math.max(0, Math.min(volumes.length - 1, position)), []);

  const paint = useCallback(() => {
    const pitch = pitchRef.current;
    const position = posRef.current;
    bookRefs.current.forEach((book, index) => {
      if (!book) return;
      const offset = index - position;
      const smoothOffset = offset / Math.sqrt(1 + 0.025 * offset * offset);
      const distance = Math.abs(smoothOffset);
      const tilt = Math.max(-78, Math.min(54 * smoothOffset, 78));
      const edge = Math.min(1, Math.max(0, volumes.length / 2 - distance));
      book.style.transform = `translateX(calc(-50% + ${smoothOffset * pitch}px)) translateZ(${-0.42 * pitch * distance}px) rotateY(${-tilt}deg)`;
      book.style.opacity = String(Math.max(0, 1 - 0.12 * distance) * edge);
      book.style.zIndex = String(100 - Math.round(distance));
      book.classList.toggle('is-active', index === indexAt(position));
    });
  }, [indexAt]);

  const settle = useCallback((target: number) => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const nextTarget = clamp(target);
    setSelectedIndex(indexAt(nextTarget));
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      posRef.current = nextTarget;
      paint();
      return;
    }
    const step = () => {
      const remaining = nextTarget - posRef.current;
      if (Math.abs(remaining) < 0.0004) {
        posRef.current = nextTarget;
        paint();
        rafRef.current = null;
        return;
      }
      posRef.current += remaining * 0.16;
      paint();
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  }, [clamp, indexAt, paint]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startPos: posRef.current, velocity: 0, time: performance.now() };
    event.currentTarget.classList.add('is-dragging');
  };
  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    const now = performance.now();
    const previous = posRef.current;
    posRef.current = clamp(drag.startPos - (event.clientX - drag.startX) / pitchRef.current);
    drag.velocity = ((posRef.current - previous) / Math.max(now - drag.time, 1)) * 1000;
    drag.time = now;
    const nextIndex = indexAt(posRef.current);
    if (nextIndex !== selectedIndex) setSelectedIndex(nextIndex);
    paint();
  };
  const handlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    const carried = Math.max(-2, Math.min(2, drag.velocity * 0.18));
    settle(Math.round(posRef.current + carried));
    event.currentTarget.classList.remove('is-dragging');
  };

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const measure = () => {
      pitchRef.current = Math.max(92, Math.min(116, frame.clientWidth / 4));
      paint();
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [paint]);

  useEffect(() => () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
  }, []);

  return <div className="library-page" aria-label="Library">
    <header className="library-header">
      <BookOpen size={23} strokeWidth={1.2} aria-hidden="true" />
    </header>
    <section className="library-bookshelf" aria-label="Memory volumes">
      <div className="library-shelf-plank" aria-hidden="true" />
      <div ref={frameRef} className="library-books library-books-carousel" draggable={false} onDragStart={(event) => event.preventDefault()} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerEnd} onPointerCancel={handlePointerEnd}>
        {volumes.map((volume, index) => <button key={volume.id} ref={(node) => { bookRefs.current[index] = node; }} type="button" className={`library-book library-book-${volume.tone} library-book-position-${(index % 3) + 1}`} aria-label={`${volume.month} ${volume.subtitle}`} onClick={() => openBook(volume)}>
          {volume.id === 9 && <span className="library-book-ping" aria-hidden="true" />}
          <span className="library-book-top">{volume.roman}</span>
          <span className="library-book-title">{volume.month.replace(' 2026', '')}</span>
          <span className="library-book-count">{volume.count}</span>
          <span className="library-book-pages" aria-hidden="true" />
        </button>)}
      </div>
    </section>
    <div className="library-volume-caption" data-testid="library-active-volume" aria-live="polite">
      <span className="library-volume-kicker">CURRENT VOLUME · {volumes[selectedIndex].roman}</span>
      <h2>{volumes[selectedIndex].month}</h2>
      <p>{volumes[selectedIndex].subtitle}</p>
      <div className="library-volume-meta"><span>{volumes[selectedIndex].count}</span><span>VOICE ARCHIVE</span></div>
    </div>

    {openVolume && <div className={`library-portal ${isOpening ? 'is-opening' : ''}`} role="dialog" aria-modal="true" aria-label={`${openVolume.month} book`} onAnimationEnd={(event) => { if (event.target === event.currentTarget) setIsOpening(false); }}>
      <div className="library-portal-header"><div><span>VOL. {openVolume.roman} · MEMOIR</span><h2>{openVolume.month}</h2></div><button type="button" aria-label="Close book" onClick={closeBook}><X size={17} /></button></div>
      <div className="library-book-scene">
        <div className="library-real-book">
          <span className="library-cover-depth" aria-hidden="true" />
          <span className="library-page-edges" aria-hidden="true" />
          <div className="library-page-left"><div><span>ENTRY 09.22</span><h3>The Autumn Equinox</h3><hr /><p>“We sat as shadows stretched over the pavement. The voice note didn't capture just words—it sealed the exact courage of that breath.”</p></div><div className="library-page-meta"><span><BookOpen size={12} /> 48s Audio Captured</span><small>P. 142 · @Sarah</small></div></div>
          <div className="library-page-right"><div><span>AUTO-SCRIBED</span><p>“Life isn't measured by milestones typed out after they are forgotten, but by moments spoken while they are still warm.”</p></div><small>LIFEBOOK PRESS · P. 143</small></div>
          <button type="button" className={`library-flip-leaf ${flipped ? 'is-flipped' : ''}`} aria-label="Flip page" aria-pressed={flipped} aria-hidden={flipped} tabIndex={flipped ? -1 : 0} onClick={turnPage}><span>PREVIEW FLIP</span><p>Tap this page to turn in 3D…</p><small>Flip Page →</small></button>
          <span className="library-book-spine" aria-hidden="true" />
        </div>
      </div>
      <div className="library-portal-actions"><button ref={turnActionRef} type="button" onClick={turnPage}><RotateCcw size={14} />Turn 3D Page</button><button type="button" onClick={onReplay}><Play size={14} fill="currentColor" />Replay Voice</button></div>
    </div>}
  </div>;
}

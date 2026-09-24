import { useState } from 'react';
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

  const openBook = (volume: Volume) => { setOpenVolume(volume); setFlipped(false); };
  const closeBook = () => { setOpenVolume(null); setFlipped(false); };

  return <div className="library-page" aria-label="Library">
    <header className="library-header">
      <BookOpen size={23} strokeWidth={1.2} aria-hidden="true" />
    </header>
    <section className="library-bookshelf" aria-label="Memory volumes">
      <div className="library-shelf-plank" aria-hidden="true" />
      <div className="library-books library-books-carousel">
        {Array.from({ length: Math.ceil(volumes.length / 3) }, (_, pageIndex) => <div className="library-book-page" key={pageIndex}>
          {volumes.slice(pageIndex * 3, pageIndex * 3 + 3).map((volume, bookIndex) => <button key={volume.id} type="button" className={`library-book library-book-${volume.tone} library-book-position-${bookIndex + 1}`} aria-label={`${volume.month} ${volume.subtitle}`} onClick={() => openBook(volume)}>
            {volume.id === 9 && <span className="library-book-ping" aria-hidden="true" />}
            <span className="library-book-top">{volume.roman}</span>
            <span className="library-book-title">{volume.month.replace(' 2026', '')}</span>
            <span className="library-book-count">{volume.count}</span>
            <span className="library-book-pages" aria-hidden="true" />
          </button>)}
        </div>)}
      </div>
    </section>
    <p className="library-hint">TAP ANY VOLUME TO STEP INSIDE</p>

    {openVolume && <div className="library-portal" role="dialog" aria-modal="true" aria-label={`${openVolume.month} book`}>
      <div className="library-portal-header"><div><span>VOL. {openVolume.roman} · MEMOIR</span><h2>{openVolume.month}</h2></div><button type="button" aria-label="Close book" onClick={closeBook}><X size={17} /></button></div>
      <div className="library-book-scene">
        <div className="library-real-book">
          <div className="library-page-left"><div><span>ENTRY 09.22</span><h3>The Autumn Equinox</h3><hr /><p>“We sat as shadows stretched over the pavement. The voice note didn't capture just words—it sealed the exact courage of that breath.”</p></div><div className="library-page-meta"><span><BookOpen size={12} /> 48s Audio Captured</span><small>P. 142 · @Sarah</small></div></div>
          <div className="library-page-right"><div><span>AUTO-SCRIBED</span><p>“Life isn't measured by milestones typed out after they are forgotten, but by moments spoken while they are still warm.”</p></div><small>LIFEBOOK PRESS · P. 143</small></div>
          <button type="button" className={`library-flip-leaf ${flipped ? 'is-flipped' : ''}`} aria-label="Flip page" onClick={() => setFlipped(value => !value)}><span>PREVIEW FLIP</span><p>Tap this page to turn in 3D…</p><small>Flip Page →</small></button>
        </div>
      </div>
      <div className="library-portal-actions"><button type="button" onClick={() => setFlipped(value => !value)}><RotateCcw size={14} />Turn 3D Page</button><button type="button" onClick={onReplay}><Play size={14} fill="currentColor" />Replay Voice</button></div>
    </div>}
  </div>;
}

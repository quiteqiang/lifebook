import { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Check, Play, Sparkles, Square, X } from 'lucide-react';
import type { MemoryEntry } from '@/lib/memories';

type BookBuilderProps = {
  memories: MemoryEntry[];
  playingId: string | null;
  onPlay: (id: string) => void;
};

const coverTints = ['book-builder-cover-umber', 'book-builder-cover-teal', 'book-builder-cover-plum', 'book-builder-cover-ochre'];

function memoryTitle(memory: MemoryEntry, index: number) {
  return memory.title || `Voice ${String(index + 1).padStart(2, '0')}`;
}

function durationLabel(durationMs: number) {
  const seconds = Math.max(0, Math.round(durationMs / 1000));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

export function BookBuilder({ memories, playingId, onPlay }: BookBuilderProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(() => memories.slice(0, 3).map(memory => memory.id));
  const [orderOpen, setOrderOpen] = useState(false);

  const selectedMemories = useMemo(() => selectedIds
    .map(id => memories.find(memory => memory.id === id))
    .filter((memory): memory is MemoryEntry => Boolean(memory)), [memories, selectedIds]);
  const pageCount = Math.max(8, Math.ceil(selectedMemories.length * 3.5));
  const coverTitle = selectedMemories[0] ? memoryTitle(selectedMemories[0], memories.indexOf(selectedMemories[0])) : 'Your Voice';

  const toggleSelection = (id: string) => {
    setSelectedIds(current => current.includes(id)
      ? current.filter(selectedId => selectedId !== id)
      : [...current, id]);
  };

  return <div className="book-builder-page" aria-label="Make your book">
    <header className="book-builder-header">
      <div>
        <span className="book-builder-eyebrow">BOOK</span>
        <h1>Your voice, in print.</h1>
      </div>
      <span className="book-builder-voice-count">{memories.length} VOICES</span>
    </header>

    <div className="book-builder-steps" aria-label="Book order steps">
      <span className="is-current"><b>01</b> SELECT</span>
      <i aria-hidden="true" />
      <span><b>02</b> PREVIEW</span>
      <i aria-hidden="true" />
      <span><b>03</b> ORDER</span>
    </div>

    <section className="book-builder-preview" aria-label="Book preview">
      <div className="book-builder-preview-haze" aria-hidden="true" />
      <div className="book-builder-book" aria-hidden="true">
        <div className={`book-builder-cover ${coverTints[selectedMemories.length % coverTints.length]}`}>
          <span>VOICE BOOK</span>
          <strong>{coverTitle}</strong>
          <small>{selectedMemories.length ? `${selectedMemories.length} MOMENTS` : 'A LIFE IN SOUND'}</small>
          <em><BookOpen size={19} strokeWidth={1.2} /></em>
        </div>
        <div className="book-builder-pages" />
      </div>
      <div className="book-builder-preview-note">
        <div><strong>{selectedMemories.length ? `Volume ${String(selectedMemories.length).padStart(2, '0')}` : 'Start with a moment'}</strong></div>
        <small>{pageCount} pages · linen cover</small>
      </div>
    </section>

    <section className="book-builder-selection" aria-label="Choose voice memories">
      <div className="book-builder-section-heading">
        <div><h2>Select moments</h2></div>
        <strong>{selectedMemories.length}/{memories.length}</strong>
      </div>
      {memories.length ? <div className="book-builder-memory-list">{memories.map((memory, index) => {
        const selected = selectedIds.includes(memory.id);
        const playing = playingId === memory.id;
        return <div className={`book-builder-memory ${selected ? 'is-selected' : ''}`} key={memory.id}>
          <button type="button" className="book-builder-memory-select" aria-pressed={selected} onClick={() => toggleSelection(memory.id)}>
            <span className="book-builder-check" aria-hidden="true">{selected && <Check size={11} strokeWidth={2.5} />}</span>
            <span className="book-builder-memory-copy"><b>{memoryTitle(memory, index)}</b><small>{memory.mixKind ? 'Composed voice' : 'Daily voice'} · {durationLabel(memory.durationMs)}</small></span>
          </button>
          <button type="button" className={`book-builder-memory-play ${playing ? 'is-playing' : ''}`} aria-label={`${playing ? 'Pause' : 'Play'} ${memoryTitle(memory, index)}`} onClick={() => onPlay(memory.id)}>
            {playing ? <Square size={11} fill="currentColor" /> : <Play size={11} fill="currentColor" />}
          </button>
        </div>;
      })}</div> : <div className="book-builder-empty"><Sparkles size={18} /><span>Record a voice on Today to begin your book.</span></div>}
    </section>

    <div className="book-builder-footer">
      <div><strong>{selectedMemories.length ? `${selectedMemories.length} memories selected` : 'Select a moment to begin.'}</strong></div>
      <button type="button" disabled={!selectedMemories.length} onClick={() => setOrderOpen(true)}>Make this book <ArrowRight size={15} /></button>
    </div>

    {orderOpen && <div className="book-order-overlay" role="dialog" aria-modal="true" aria-label="Confirm book order">
      <div className="book-order-sheet">
        <button type="button" className="book-order-close" aria-label="Close order summary" onClick={() => setOrderOpen(false)}><X size={17} /></button>
        <h2>Your Voice Book</h2>
        <div className="book-order-summary"><span><b>{selectedMemories.length}</b> memories</span><span><b>{pageCount}</b> pages</span><span><b>Linen</b> cover</span></div>
        <div className="book-order-actions"><button type="button" onClick={() => setOrderOpen(false)}>Back to edit</button><button type="button" onClick={() => setOrderOpen(false)}>Request this book <ArrowRight size={14} /></button></div>
      </div>
    </div>}
  </div>;
}

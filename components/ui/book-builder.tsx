import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, Play, Sparkles, Square, UserRound, X } from 'lucide-react';
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

function BookCheckout({ coverTitle, selectedCount, pageCount, onBack }: { coverTitle: string; selectedCount: number; pageCount: number; onBack: () => void }) {
  const [notice, setNotice] = useState('');
  useEffect(() => {
    document.querySelector<HTMLElement>('.book-scene')?.scrollTo({ top: 0, behavior: 'auto' });
  }, []);
  return <div className="book-checkout-page" aria-label="Checkout">
    <header className="book-checkout-header">
      <button type="button" aria-label="Back to Book" onClick={onBack}><ArrowLeft size={15} /><span>Book</span></button>
      <span>CHECKOUT</span>
    </header>
    <div className="book-checkout-progress" aria-label="Checkout progress"><span className="is-done">01</span><i /><span className="is-done">02</span><i /><span className="is-current">03</span></div>
    <div className="book-checkout-intro"><span>YOUR BOOK IS READY</span><h1>Make it yours.</h1><p>Review the details before sending it to print.</p></div>
    <section className="book-checkout-summary" aria-label="Book summary">
      <div className="book-checkout-mini-book" aria-hidden="true"><div><span>VOICE BOOK</span><strong>{coverTitle}</strong><small>{selectedCount} MOMENTS</small></div><i /></div>
      <div className="book-checkout-summary-copy"><span>VOICE BOOK · LINEN</span><h2>{coverTitle}</h2><p>A quiet volume made from your selected voice memories.</p><div><b>{selectedCount}</b><small> memories</small><b>{pageCount}</b><small> pages</small></div></div>
    </section>
    <section className="book-checkout-details" aria-label="Order details">
      <div><span>EDITION</span><strong>Linen-bound keepsake</strong></div>
      <div><span>QUANTITY</span><strong>1 copy</strong></div>
      <div><span>DELIVERY</span><strong>Set at payment</strong></div>
    </section>
    <div className="book-checkout-total"><span>Estimated total</span><strong>A$48</strong></div>
    <button type="button" className="book-checkout-pay" onClick={() => setNotice('Checkout is ready for payment integration.')}>Continue to payment <ArrowRight size={15} /></button>
    {notice && <p className="book-checkout-notice" role="status">{notice}</p>}
  </div>;
}

function BookOrders({ coverTitle, selectedCount, pageCount, onBack }: { coverTitle: string; selectedCount: number; pageCount: number; onBack: () => void }) {
  return <div className="book-orders-page" aria-label="Your orders">
    <header className="book-orders-header">
      <button type="button" aria-label="Back to Book" onClick={onBack}><ArrowLeft size={15} /><span>Book</span></button>
      <span>YOUR ORDERS</span>
    </header>
    <div className="book-orders-intro"><span>VOICE BOOKS</span><h1>Your orders.</h1><p>Keep track of the books you are making.</p></div>
    <section className="book-orders-card" aria-label="Current book order">
      <div className="book-orders-card-top"><span>BOOK DRAFT</span><b>IN PROGRESS</b></div>
      <div className="book-orders-card-main"><div className="book-orders-mini-cover" aria-hidden="true"><span>VOICE<br />BOOK</span><strong>{coverTitle}</strong></div><div><h2>{coverTitle}</h2><p>{selectedCount} memories · {pageCount} pages</p><small>Linen-bound keepsake</small></div></div>
      <div className="book-orders-card-bottom"><span>Not submitted yet</span><button type="button" onClick={onBack}>Continue editing <ArrowRight size={13} /></button></div>
    </section>
    <div className="book-orders-empty-note"><UserRound size={17} /><span>Your completed orders will appear here.</span></div>
  </div>;
}

export function BookBuilder({ memories, playingId, onPlay }: BookBuilderProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(() => memories.slice(0, 3).map(memory => memory.id));
  const [orderOpen, setOrderOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);

  const selectedMemories = useMemo(() => selectedIds
    .map(id => memories.find(memory => memory.id === id))
    .filter((memory): memory is MemoryEntry => Boolean(memory)), [memories, selectedIds]);
  const pageCount = Math.max(8, Math.ceil(selectedMemories.length * 3.5));
  const coverTitle = selectedMemories[0] ? memoryTitle(selectedMemories[0], memories.indexOf(selectedMemories[0])) : 'Your Voice';

  if (checkoutOpen) return <BookCheckout coverTitle={coverTitle} selectedCount={selectedMemories.length} pageCount={pageCount} onBack={() => setCheckoutOpen(false)} />;
  if (ordersOpen) return <BookOrders coverTitle={coverTitle} selectedCount={selectedMemories.length} pageCount={pageCount} onBack={() => setOrdersOpen(false)} />;

  const toggleSelection = (id: string) => {
    setSelectedIds(current => current.includes(id)
      ? current.filter(selectedId => selectedId !== id)
      : [...current, id]);
  };

  return <div className="book-builder-page" aria-label="Make your book">
    <header className="book-builder-header">
      <div className="book-builder-title-group">
        <button type="button" className="book-profile-button" aria-label="Open your orders" onClick={() => setOrdersOpen(true)}><UserRound size={17} strokeWidth={1.4} /></button>
        <div>
        <span className="book-builder-eyebrow">BOOK</span>
        <h1>Your voice, in print.</h1>
        </div>
      </div>
      <span className="book-builder-voice-count">{memories.length} VOICES</span>
    </header>

    <div className="book-builder-steps" aria-label="Book order steps">
      <span className="is-current"><b>01</b><em>SELECT</em></span>
      <i aria-hidden="true" />
      <span><b>02</b><em>PREVIEW</em></span>
      <i aria-hidden="true" />
      <span><b>03</b><em>ORDER</em></span>
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
        <div className="book-order-actions"><button type="button" onClick={() => setOrderOpen(false)}>Back to edit</button><button type="button" onClick={() => { setOrderOpen(false); setCheckoutOpen(true); }}>Request this book <ArrowRight size={14} /></button></div>
      </div>
    </div>}
  </div>;
}

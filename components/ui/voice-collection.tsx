import { CassetteTape, Play, Sparkles, Square } from 'lucide-react';
import type { MemoryEntry } from '@/lib/memories';
import { getMixRecipe } from '@/lib/mix-recipes';

type VoiceCollectionProps = {
  memories: MemoryEntry[];
  playingId: string | null;
  onPlay: (id: string) => void;
  onOpenMixer: () => void;
};

const collectionTints = ['ochre', 'sage', 'rose', 'sky', 'sand'];

function collectionTitle(memory: MemoryEntry, index: number) {
  if (memory.title) return memory.title;
  if (memory.mixKind) return getMixRecipe(memory.mixKind).label;
  return `Voice ${String(index + 1).padStart(2, '0')}`;
}

function CollectionTape({ memory, index, playing, onPlay }: { memory: MemoryEntry; index: number; playing: boolean; onPlay: () => void }) {
  const title = collectionTitle(memory, index);
  return <button type="button" className={`collection-tape tint-${collectionTints[index % collectionTints.length]} ${playing ? 'is-playing' : ''}`} onClick={onPlay} aria-label={`${title} ${playing ? 'pause' : 'play'}`}>
    <span className="collection-tape-top"><b>{memory.mixKind ? getMixRecipe(memory.mixKind).id.toUpperCase() : 'VOICE'}</b><small>{memory.sourceIds?.length ? 'A + B' : 'SIDE A'}</small></span>
    <span className="collection-reels" aria-hidden="true"><i /><i /></span>
    <span className="collection-wave" aria-hidden="true">{memory.waveform.slice(0, 20).map((height, barIndex) => <i key={barIndex} style={{ height: `${Math.round(22 + height * 48)}%` }} />)}</span>
    <span className="collection-tape-bottom"><strong>{title}</strong><small>{memory.mixKind ? getMixRecipe(memory.mixKind).detail : 'daily voice'}</small></span>
    <span className="collection-play" aria-hidden="true">{playing ? <Square size={11} fill="currentColor" /> : <Play size={11} fill="currentColor" />}</span>
  </button>;
}

export function VoiceCollection({ memories, playingId, onPlay, onOpenMixer }: VoiceCollectionProps) {
  return <div className="voice-collection-page" aria-label="Voice collection">
    <header className="collection-header">
      <div><span className="collection-eyebrow">MY BOOK / VOICE</span><h1>声音收藏</h1><p>把每天的声音收进一盘盘磁带。</p></div>
      <button type="button" className="collection-mix-entry" aria-label="Open mixer" onClick={onOpenMixer}><Sparkles size={16} /><span>合成</span></button>
    </header>
    <div className="collection-count"><CassetteTape size={17} strokeWidth={1.3} /><strong>{memories.length}</strong><span>盘声音磁带</span></div>
    {memories.length ? <section className="collection-tape-grid" aria-label="Collected sound tapes">{memories.map((memory, index) => <CollectionTape key={memory.id} memory={memory} index={index} playing={playingId === memory.id} onPlay={() => onPlay(memory.id)} />)}</section> : <div className="collection-empty"><CassetteTape size={30} /><strong>还没有声音磁带</strong><span>去 Today 录下第一段声音</span></div>}
  </div>;
}


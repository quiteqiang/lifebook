import { useMemo, useState } from 'react';
import { ArrowRight, CassetteTape, Check, Disc3, Play, Plus, Sparkles, Square, Waves } from 'lucide-react';
import type { MemoryEntry } from '@/lib/memories';
import { getMixRecipe, mixRecipes, type MixRecipeId } from '@/lib/mix-recipes';

type VoiceMixStudioProps = {
  memories: MemoryEntry[];
  playingId: string | null;
  mixing: boolean;
  onPlay: (id: string) => void;
  onMix: (sourceIds: string[], recipe: MixRecipeId) => Promise<boolean>;
};

const coverTints = ['ochre', 'sage', 'rose', 'sky', 'sand'];

function tapeTitle(memory: MemoryEntry, index: number) {
  if (memory.title) return memory.title;
  if (memory.mixKind) return getMixRecipe(memory.mixKind).label;
  return `Voice ${String(index + 1).padStart(2, '0')}`;
}

function TapeArtwork({ memory, index }: { memory: MemoryEntry; index: number }) {
  const bars = memory.waveform.slice(0, 18);
  return <div className={`studio-tape-art tint-${coverTints[index % coverTints.length]}`}>
    <div className="studio-tape-label">
      <span>{memory.mixKind ? getMixRecipe(memory.mixKind).symbol : 'VOICE'}</span>
      <b>{memory.mixKind ? getMixRecipe(memory.mixKind).id.toUpperCase() : 'SIDE A'}</b>
    </div>
    <div className="studio-tape-reels" aria-hidden="true"><i /><i /></div>
    <div className="studio-tape-wave" aria-hidden="true">{bars.map((height, barIndex) => <i key={barIndex} style={{ height: `${Math.round(20 + height * 55)}%` }} />)}</div>
  </div>;
}

export function VoiceMixStudio({ memories, playingId, mixing, onPlay, onMix }: VoiceMixStudioProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [recipe, setRecipe] = useState<MixRecipeId>('nature');
  const [notice, setNotice] = useState('选择两盘磁带，放入留声机');
  const selected = selectedIds.map(id => memories.find(memory => memory.id === id)).filter((memory): memory is MemoryEntry => Boolean(memory));
  const hasPair = selectedIds.length === 2;
  const activeRecipe = getMixRecipe(recipe);

  const tapeItems = useMemo(() => memories.slice(0, 12), [memories]);
  const toggleTape = (id: string) => {
    setNotice('选择两盘磁带，放入留声机');
    setSelectedIds(current => current.includes(id)
      ? current.filter(selectedId => selectedId !== id)
      : current.length < 2 ? [...current, id] : [current[1], id]);
  };

  const mixSelected = async () => {
    if (!hasPair || mixing) return;
    setNotice('正在把两段声音接在一起…');
    const ok = await onMix(selectedIds, recipe);
    if (ok) {
      setSelectedIds([]);
      setNotice(`${activeRecipe.label} 已加入声音收藏`);
    } else {
      setNotice('这两盘磁带暂时无法合成');
    }
  };

  const renderSlot = (slot: number) => {
    const memory = selected[slot];
    return <div key={slot} className={`studio-slot ${memory ? 'has-tape' : ''}`}>
      <span className="studio-slot-letter">{slot === 0 ? 'A' : 'B'}</span>
      {memory ? <><TapeArtwork memory={memory} index={slot} /><span className="studio-slot-name">{tapeTitle(memory, memories.indexOf(memory))}</span></> : <><Plus size={16} /><span>放入磁带</span></>}
    </div>;
  };

  return <div className="voice-mix-studio" aria-label="Voice collection mixer">
    <div className="studio-light studio-light-one" aria-hidden="true" />
    <div className="studio-light studio-light-two" aria-hidden="true" />
    <header className="studio-header">
      <div><span className="studio-eyebrow">VOICE COLLECTION</span><h1>声音收藏</h1></div>
      <div className="studio-count"><CassetteTape size={18} strokeWidth={1.3} /><span>{memories.length}</span></div>
    </header>

    <section className={`studio-turntable ${playingId ? 'is-playing' : ''}`} aria-label="Voice mixing turntable">
      <div className="studio-record-shadow" aria-hidden="true" />
      <div className="studio-record">
        <div className="studio-record-grooves" />
        <div className="studio-record-center"><Disc3 size={29} strokeWidth={1.2} /><span>VOICE<br />BOOK</span></div>
      </div>
      <div className="studio-tonearm" aria-hidden="true"><span className="tonearm-head" /></div>
      <div className="studio-turntable-caption"><Waves size={13} /><span>{playingId ? 'PLAYING MEMORY' : 'READY TO MIX'}</span></div>
    </section>

    <section className="studio-slots" aria-label="Tape mixing slots">
      {renderSlot(0)}
      <ArrowRight className="studio-slot-arrow" size={18} strokeWidth={1.3} aria-hidden="true" />
      {renderSlot(1)}
    </section>

    <section className="studio-recipes" aria-label="Tape output recipes">
      <div className="studio-section-title"><span>MAKE A NEW SOUND</span><small>选择合成方向</small></div>
      <div className="studio-recipe-list">
        {mixRecipes.map(item => <button key={item.id} type="button" className={`studio-recipe ${recipe === item.id ? 'is-active' : ''}`} onClick={() => setRecipe(item.id)}>
          <span className="studio-recipe-symbol">{item.symbol}</span><span><b>{item.label}</b><small>{item.detail}</small></span>{recipe === item.id && <Check size={14} />}
        </button>)}
      </div>
      <button type="button" className={`studio-mix-button ${hasPair ? 'is-ready' : ''}`} disabled={!hasPair || mixing} onClick={() => void mixSelected()}>
        <Sparkles size={16} />{mixing ? 'SPLICING…' : `合成 ${activeRecipe.label}`}<ArrowRight size={15} />
      </button>
      <p className="studio-notice" role="status">{notice}</p>
    </section>

    <section className="studio-shelf" aria-label="Collected sound tapes">
      <div className="studio-section-title"><span>YOUR SOUND TAPES</span><small>点击选择 · 再次点击播放</small></div>
      {tapeItems.length ? <div className="studio-tape-scroll">{tapeItems.map((memory, index) => {
        const selectedIndex = selectedIds.indexOf(memory.id);
        const isPlaying = playingId === memory.id;
        return <button key={memory.id} type="button" className={`studio-tape-card ${selectedIndex >= 0 ? 'is-selected' : ''} ${isPlaying ? 'is-playing' : ''}`} onClick={() => selectedIndex >= 0 ? onPlay(memory.id) : toggleTape(memory.id)} onDoubleClick={() => onPlay(memory.id)} aria-label={`${tapeTitle(memory, index)} ${selectedIndex >= 0 ? 'selected' : 'select tape'}`}>
          <TapeArtwork memory={memory} index={index} />
          <span className="studio-tape-card-title">{tapeTitle(memory, index)}</span>
          <small>{memory.mixKind ? `${memory.sourceIds?.length ? 'A + B · ' : ''}${getMixRecipe(memory.mixKind).detail}` : 'daily voice'}</small>
          {selectedIndex >= 0 && <em>{selectedIndex === 0 ? 'A' : 'B'}</em>}
          {isPlaying && <span className="studio-playing"><Square size={10} fill="currentColor" /></span>}
          {!isPlaying && <span className="studio-tape-play"><Play size={11} fill="currentColor" /></span>}
        </button>;
      })}</div> : <div className="studio-empty"><CassetteTape size={22} /><span>录下第一段声音，开始收集</span></div>}
    </section>
  </div>;
}

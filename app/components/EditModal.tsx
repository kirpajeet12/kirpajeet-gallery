'use client';

import { useRef, useState } from 'react';
import { client } from '@/lib/client';
import type { TileData } from '@/app/page';

type DeezerTrack = {
  id: number;
  title: string;
  preview: string;
  artist: { name: string };
  album: { cover_small: string };
};

export default function EditModal({
  tile,
  onClose,
  onSaved,
}: {
  tile: TileData;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [caption, setCaption] = useState(tile.caption ?? '');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DeezerTrack[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<DeezerTrack | null>(null);
  const [keepMusic, setKeepMusic] = useState(true);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const previewAudio = useRef<HTMLAudioElement | null>(null);

  async function searchMusic() {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/music-search?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      setResults(json.data ?? []);
    } catch { setResults([]); }
    setSearching(false);
  }

  function playPreview(track: DeezerTrack) {
    if (!previewAudio.current) previewAudio.current = new Audio();
    if (playingId === track.id) {
      previewAudio.current.pause();
      setPlayingId(null);
    } else {
      previewAudio.current.src = track.preview;
      previewAudio.current.play();
      setPlayingId(track.id);
      previewAudio.current.onended = () => setPlayingId(null);
    }
  }

  function selectTrack(track: DeezerTrack) {
    setSelectedTrack(track);
    setKeepMusic(false);
    previewAudio.current?.pause();
    setPlayingId(null);
    setResults([]);
    setQuery('');
  }

  async function handleSave() {
    if (!tile.dbId) {
      setStatus('No database record — upload again to enable editing.');
      return;
    }
    setBusy(true);
    try {
      const musicUpdate = selectedTrack
        ? { musicKey: selectedTrack.preview, musicTitle: `${selectedTrack.title} — ${selectedTrack.artist.name}` }
        : keepMusic
        ? {}
        : { musicKey: null, musicTitle: null };

      await client.models.Memory.update(
        { id: tile.dbId, caption: caption || null, ...musicUpdate },
        { authMode: 'userPool' }
      );

      setStatus('Saved ✓');
      onSaved();
      onClose();
    } catch (e: any) {
      setStatus('Error: ' + (e?.message ?? 'save failed'));
    } finally {
      setBusy(false);
    }
  }

  const hasMusic = tile.musicTitle && keepMusic && !selectedTrack;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Edit moment</h2>

        <div className="edit-preview">
          <img src={tile.url} alt="" />
        </div>

        <div className="field">
          <label>Caption</label>
          <input
            type="text"
            value={caption}
            placeholder="A line about this moment…"
            onChange={(e) => setCaption(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Music</label>

          {hasMusic && (
            <div className="music-selected" style={{ marginBottom: 8 }}>
              <span className="music-title">♪ {tile.musicTitle}</span>
              <button className="music-remove" onClick={() => setKeepMusic(false)}>✕</button>
            </div>
          )}

          {selectedTrack ? (
            <div className="music-selected">
              <img src={selectedTrack.album.cover_small} alt="" width={36} height={36} style={{ borderRadius: 4 }} />
              <div className="music-selected-info">
                <span className="music-title">{selectedTrack.title}</span>
                <span className="music-artist">{selectedTrack.artist.name}</span>
              </div>
              <button className="music-remove" onClick={() => { setSelectedTrack(null); setKeepMusic(!!tile.musicTitle); }}>✕</button>
            </div>
          ) : (
            <>
              <div className="music-search-row">
                <input
                  type="text"
                  placeholder={hasMusic ? 'Replace song…' : 'Search a song…'}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchMusic()}
                  className="music-search-input"
                />
                <button className="btn music-search-btn" onClick={searchMusic} disabled={searching || !query.trim()}>
                  {searching ? '…' : 'Search'}
                </button>
              </div>

              {results.length > 0 && (
                <div className="music-results">
                  {results.map((track) => (
                    <div key={track.id} className="music-result">
                      <img src={track.album.cover_small} alt="" width={40} height={40} style={{ borderRadius: 4, flexShrink: 0 }} />
                      <div className="music-result-info">
                        <span className="music-title">{track.title}</span>
                        <span className="music-artist">{track.artist.name}</span>
                      </div>
                      <button className="music-play-btn" onClick={() => playPreview(track)}>
                        {playingId === track.id ? '⏸' : '▶'}
                      </button>
                      <button className="btn music-use-btn" onClick={() => selectTrack(track)}>Use</button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="status">{status}</div>

        <div className="row">
          <button className="btn" onClick={handleSave} disabled={busy}>
            {busy ? 'Saving…' : 'Save changes'}
          </button>
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

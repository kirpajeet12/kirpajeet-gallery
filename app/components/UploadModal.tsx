'use client';

import { useRef, useState } from 'react';
import { uploadData } from 'aws-amplify/storage';
import { client } from '@/lib/client';

type DeezerTrack = {
  id: number;
  title: string;
  preview: string;
  artist: { name: string };
  album: { cover_small: string };
};

export default function UploadModal({
  onClose,
  onUploaded,
}: {
  onClose: () => void;
  onUploaded: () => void;
}) {
  const [photo, setPhoto] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DeezerTrack[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<DeezerTrack | null>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);

  const previewAudio = useRef<HTMLAudioElement | null>(null);

  async function searchMusic() {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/music-search?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      setResults(json.data ?? []);
    } catch {
      setResults([]);
    }
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
    previewAudio.current?.pause();
    setPlayingId(null);
    setResults([]);
    setQuery('');
  }

  function clearTrack() {
    setSelectedTrack(null);
    previewAudio.current?.pause();
    setPlayingId(null);
  }

  async function handleSave() {
    if (!photo) { setStatus('Pick a photo first.'); return; }
    setBusy(true);
    try {
      const stamp = Date.now();
      const photoKey = `photos/${stamp}-${photo.name}`;
      setStatus('Uploading photo…');
      await uploadData({ path: photoKey, data: photo }).result;

      setStatus('Saving…');
      await client.models.Memory.create(
        {
          imageKey: photoKey,
          musicKey: selectedTrack?.preview ?? undefined,
          musicTitle: selectedTrack
            ? `${selectedTrack.title} — ${selectedTrack.artist.name}`
            : undefined,
          caption: caption || undefined,
          order: stamp,
        },
        { authMode: 'userPool' }
      );

      setStatus('Done ✓');
      onUploaded();
      onClose();
    } catch (e: any) {
      setStatus('Error: ' + (e?.message ?? 'upload failed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Add a moment</h2>

        {/* Photo picker */}
        <div className="field">
          <label>Photo</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
          />
        </div>

        {/* Music search */}
        <div className="field">
          <label>Music (optional)</label>

          {selectedTrack ? (
            <div className="music-selected">
              <img src={selectedTrack.album.cover_small} alt="" width={36} height={36} style={{ borderRadius: 4 }} />
              <div className="music-selected-info">
                <span className="music-title">{selectedTrack.title}</span>
                <span className="music-artist">{selectedTrack.artist.name}</span>
              </div>
              <button className="music-remove" onClick={clearTrack}>✕</button>
            </div>
          ) : (
            <>
              <div className="music-search-row">
                <input
                  type="text"
                  placeholder="Search a song…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchMusic()}
                  className="music-search-input"
                />
                <button
                  className="btn music-search-btn"
                  onClick={searchMusic}
                  disabled={searching || !query.trim()}
                >
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
                      <button
                        className="music-play-btn"
                        onClick={() => playPreview(track)}
                        title={playingId === track.id ? 'Pause' : 'Preview'}
                      >
                        {playingId === track.id ? '⏸' : '▶'}
                      </button>
                      <button className="btn music-use-btn" onClick={() => selectTrack(track)}>
                        Use
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Caption */}
        <div className="field">
          <label>Caption (optional)</label>
          <input
            type="text"
            value={caption}
            placeholder="A line about this moment…"
            onChange={(e) => setCaption(e.target.value)}
          />
        </div>

        <div className="status">{status}</div>

        <div className="row">
          <button className="btn" onClick={handleSave} disabled={busy}>
            {busy ? 'Working…' : 'Save'}
          </button>
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

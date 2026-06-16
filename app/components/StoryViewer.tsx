'use client';

import { useEffect, useRef, useState } from 'react';
import { getUrl } from 'aws-amplify/storage';
import type { TileData } from '@/app/page';

const SLIDE_MS = 6000;

export default function StoryViewer({
  memories,
  startIndex,
  onClose,
}: {
  memories: TileData[];
  startIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const [musicState, setMusicState] = useState<'none' | 'loading' | 'playing' | 'error'>('none');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const current = memories[index];

  useEffect(() => {
    let cancelled = false;

    async function loadMusic() {
      if (!audioRef.current) return;

      if (!current.musicKey) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
        setMusicState('none');
        return;
      }

      setMusicState('loading');

      try {
        const src = current.musicKey.startsWith('https://')
          ? `/api/music-proxy?url=${encodeURIComponent(current.musicKey)}`
          : (await getUrl({ path: current.musicKey })).url.toString();

        if (cancelled) return;

        audioRef.current.src = src;
        await audioRef.current.play();
        if (!cancelled) setMusicState('playing');
      } catch (e) {
        if (!cancelled) {
          console.error('Music playback failed:', e);
          setMusicState('error');
        }
      }
    }

    loadMusic();
    return () => { cancelled = true; };
  }, [index, current.musicKey]);

  useEffect(() => {
    setMusicState(current.musicKey ? 'loading' : 'none');
  }, [index]);

  useEffect(() => {
    const t = setTimeout(next, SLIDE_MS);
    return () => clearTimeout(t);
  }, [index]);

  function next() {
    if (index < memories.length - 1) setIndex(i => i + 1);
    else onClose();
  }
  function prev() {
    if (index > 0) setIndex(i => i - 1);
  }

  const musicLabel =
    musicState === 'loading' ? '♪ loading…' :
    musicState === 'playing' ? `♪ ${current.musicTitle ?? 'playing'}` :
    musicState === 'error'   ? '♪ could not play' :
    null;

  return (
    <div className="story-overlay" onClick={onClose}>
      <div className="story-card" onClick={(e) => e.stopPropagation()}>

        <div className="story-bars">
          {memories.map((_, i) => (
            <div className="story-bar" key={i}>
              <span
                className={`story-fill ${i < index ? 'done' : ''} ${i === index ? 'active' : ''}`}
                style={{ ['--dur' as any]: `${SLIDE_MS}ms` }}
              />
            </div>
          ))}
        </div>

        <div className="story-toprow">
          {musicLabel && (
            <span className={`story-music ${musicState === 'error' ? 'story-music-error' : ''}`}>
              {musicLabel}
            </span>
          )}
          <button className="story-close" onClick={onClose}>✕</button>
        </div>

        <img className="story-img" src={current.url} alt={current.caption ?? ''} />

        {current.caption && (
          <div className="story-caption">{current.caption}</div>
        )}

        <button className="story-nav story-nav-left" onClick={prev} aria-label="previous" />
        <button className="story-nav story-nav-right" onClick={next} aria-label="next" />
      </div>

      <audio ref={audioRef} loop />
    </div>
  );
}

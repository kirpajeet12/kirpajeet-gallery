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
  const [musicState, setMusicState] = useState<'none' | 'loading' | 'playing' | 'paused' | 'error'>('none');
  const [paused, setPaused] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const current = memories[index];

  // Load + play music when slide changes
  useEffect(() => {
    let cancelled = false;
    setPaused(false);

    async function loadMusic() {
      if (!audioRef.current) return;

      if (!current.musicKey) {
        console.log('No musicKey for this slide');
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
        setMusicState('none');
        return;
      }

      console.log('Loading music from:', current.musicKey);
      setMusicState('loading');

      try {
        const src = current.musicKey.startsWith('https://')
          ? current.musicKey  // direct Deezer URL — no proxy
          : (await getUrl({ path: current.musicKey })).url.toString();

        if (cancelled) return;

        await new Promise<void>((resolve, reject) => {
          const audio = audioRef.current!;
          audio.onerror = () => {
            const err = audio.error;
            console.error('Audio element error:', err?.code, err?.message);
            reject(new Error(`Audio error ${err?.code}: ${err?.message}`));
          };
          audio.src = src;
          audio.play().then(resolve).catch(reject);
        });

        if (!cancelled) setMusicState('playing');
      } catch (e) {
        if (!cancelled) {
          console.error('Music playback failed:', e);
          setMusicState('error');
        }
      }
    }

    loadMusic();
    return () => {
      cancelled = true;
      audioRef.current?.pause();
    };
  }, [index, current.musicKey]);

  // Auto-advance (pause when music paused)
  useEffect(() => {
    if (paused) return;
    const t = setTimeout(next, SLIDE_MS);
    return () => clearTimeout(t);
  }, [index, paused]);

  function toggleMusic() {
    if (!audioRef.current) return;
    if (paused) {
      audioRef.current.play().catch(() => {});
      setPaused(false);
      setMusicState('playing');
    } else {
      audioRef.current.pause();
      setPaused(true);
      setMusicState('paused');
    }
  }

  function next() {
    if (index < memories.length - 1) setIndex(i => i + 1);
    else onClose();
  }
  function prev() {
    if (index > 0) setIndex(i => i - 1);
  }

  const musicLabel =
    musicState === 'loading' ? '♪ loading…' :
    musicState === 'playing' ? '♪ playing' :
    musicState === 'paused'  ? '⏸ paused' :
    musicState === 'error'   ? '♪ could not load' :
    null;

  return (
    <div className="story-overlay" onClick={onClose}>
      <div className="story-card" onClick={(e) => e.stopPropagation()}>

        {/* Progress bars */}
        <div className="story-bars">
          {memories.map((_, i) => (
            <div className="story-bar" key={i}>
              <span
                className={`story-fill ${i < index ? 'done' : ''} ${i === index && !paused ? 'active' : ''}`}
                style={{ ['--dur' as any]: `${SLIDE_MS}ms` }}
              />
            </div>
          ))}
        </div>

        {/* Top row */}
        <div className="story-toprow">
          {current.musicKey && (
            <button
              className={`story-music ${musicState === 'error' ? 'story-music-error' : ''}`}
              onClick={toggleMusic}
              title={paused ? 'Resume music' : 'Pause music'}
            >
              {musicLabel}
            </button>
          )}
          <button className="story-close" onClick={onClose}>✕</button>
        </div>

        {/* Photo */}
        <img className="story-img" src={current.url} alt={current.caption ?? ''} />

        {/* Caption */}
        {current.caption && (
          <div className="story-caption">{current.caption}</div>
        )}

        {/* Tap zones */}
        <button className="story-nav story-nav-left" onClick={prev} aria-label="previous" />
        <button className="story-nav story-nav-right" onClick={next} aria-label="next" />
      </div>

      <audio ref={audioRef} loop />
    </div>
  );
}

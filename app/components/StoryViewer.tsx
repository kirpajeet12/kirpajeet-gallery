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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const current = memories[index];

  // Load music for current slide
  useEffect(() => {
    let cancelled = false;
    if (current.musicKey) {
      getUrl({ path: current.musicKey }).then(({ url }) => {
        if (cancelled || !audioRef.current) return;
        audioRef.current.src = url.toString();
        audioRef.current.play().catch(() => {});
      });
    } else if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
    }
    return () => { cancelled = true; };
  }, [index, current.musicKey]);

  // Auto-advance
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

  return (
    <div className="story-overlay" onClick={onClose}>
      <div className="story-card" onClick={(e) => e.stopPropagation()}>

        {/* Progress bars */}
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

        {/* Top row: music indicator + close */}
        <div className="story-toprow">
          {current.musicKey && <span className="story-music">♪ playing</span>}
          <button className="story-close" onClick={onClose}>✕</button>
        </div>

        {/* Photo */}
        <img className="story-img" src={current.url} alt={current.caption ?? ''} />

        {/* Caption */}
        {current.caption && (
          <div className="story-caption">{current.caption}</div>
        )}

        {/* Tap zones: left = prev, right = next */}
        <button className="story-nav story-nav-left" onClick={prev} aria-label="previous" />
        <button className="story-nav story-nav-right" onClick={next} aria-label="next" />
      </div>

      <audio ref={audioRef} loop />
    </div>
  );
}

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
  const [musicUrl, setMusicUrl] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const current = memories[index];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (current.musicKey) {
        const music = await getUrl({ path: current.musicKey });
        if (!cancelled && audioRef.current) {
          audioRef.current.src = music.url.toString();
          audioRef.current.play().catch(() => {});
        }
      } else if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
      }
    })();
    return () => { cancelled = true; };
  }, [index, current]);

  useEffect(() => {
    const t = setTimeout(() => next(), SLIDE_MS);
    return () => clearTimeout(t);
  }, [index]);

  function next() {
    if (index < memories.length - 1) setIndex(index + 1);
    else onClose();
  }
  function prev() {
    if (index > 0) setIndex(index - 1);
  }

  return (
    <div className="story">
      <div className="bars">
        {memories.map((_, i) => (
          <div className="bar" key={i}>
            <span
              className={`fill ${i < index ? 'done' : ''} ${i === index ? 'active' : ''}`}
              style={{ ['--dur' as any]: `${SLIDE_MS}ms` }}
            />
          </div>
        ))}
      </div>

      <div className="tag">
        {current.musicKey ? <span>♪ playing</span> : null}
      </div>

      <button className="close" onClick={onClose} aria-label="close">×</button>

      {current.url && <img src={current.url} alt={current.caption ?? ''} />}

      {current.caption && <div className="caption">{current.caption}</div>}

      <button className="nav left" onClick={prev} aria-label="previous" />
      <button className="nav right" onClick={next} aria-label="next" />

      <audio ref={audioRef} loop />
    </div>
  );
}

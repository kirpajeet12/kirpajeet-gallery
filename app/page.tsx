'use client';

import { useEffect, useState, useCallback } from 'react';
import { list, getUrl } from 'aws-amplify/storage';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { client } from '@/lib/client';
import UploadModal from './components/UploadModal';
import StoryViewer from './components/StoryViewer';

export type TileData = {
  key: string;
  url: string;
  caption?: string;
  musicKey?: string;
};

function GalleryApp() {
  const { authStatus, signOut } = useAuthenticator((c) => [c.authStatus]);
  const isOwner = authStatus === 'authenticated';

  const [tiles, setTiles] = useState<TileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [storyAt, setStoryAt] = useState<number | null>(null);

  useEffect(() => {
    if (isOwner) setShowLogin(false);
  }, [isOwner]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ items }, { data: dbRecords }] = await Promise.all([
        list({ path: 'photos/' }),
        client.models.Memory.list(),
      ]);

      const metaMap = new Map(dbRecords.map((r) => [r.imageKey, r]));
      const photos = items.filter((item) => item.path !== 'photos/' && (item.size ?? 0) > 0);

      const withUrls = await Promise.all(
        photos.map(async (item) => {
          const { url } = await getUrl({ path: item.path, options: { expiresIn: 3600 } });
          const meta = metaMap.get(item.path);
          return {
            key: item.path,
            url: url.toString(),
            caption: meta?.caption ?? undefined,
            musicKey: meta?.musicKey ?? undefined,
          } as TileData;
        })
      );
      setTiles(withUrls.reverse());
    } catch (e) {
      console.error('Failed to load photos:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <div className="topbar">
        {isOwner ? (
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn" onClick={() => setShowUpload(true)}>
              + Add moment
            </button>
            <button className="btn btn-ghost" onClick={signOut}>
              Sign out
            </button>
          </div>
        ) : (
          <button className="btn btn-ghost" onClick={() => setShowLogin(true)}>
            Login
          </button>
        )}
      </div>

      <header className="header">
        <h1>
          Kirpajeet <span className="accent">Singh Gill</span>
        </h1>
        <p>A gallery of moments — tap any photo to play the story.</p>
      </header>

      <main className="gallery">
        {loading && <div className="empty">Loading…</div>}
        {!loading && tiles.length === 0 && (
          <div className="empty">
            No moments yet. {isOwner ? 'Add your first one.' : ''}
          </div>
        )}
        {tiles.map((t, i) => (
          <div className="tile" key={t.key} onClick={() => setStoryAt(i)}>
            <img src={t.url} alt={t.caption ?? ''} loading="lazy" />
            {(t.caption || t.musicKey) && (
              <div className="meta">
                {t.musicKey && <span className="note">♪</span>}
                {t.caption && <span>{t.caption}</span>}
              </div>
            )}
          </div>
        ))}
      </main>

      {showUpload && (
        <UploadModal onClose={() => setShowUpload(false)} onUploaded={load} />
      )}

      {showLogin && !isOwner && (
        <div className="overlay" onClick={() => setShowLogin(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <Authenticator />
          </div>
        </div>
      )}

      {storyAt !== null && tiles.length > 0 && (
        <StoryViewer
          memories={tiles}
          startIndex={storyAt}
          onClose={() => setStoryAt(null)}
        />
      )}
    </>
  );
}

export default function Page() {
  return (
    <Authenticator.Provider>
      <GalleryApp />
    </Authenticator.Provider>
  );
}

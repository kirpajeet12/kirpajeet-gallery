'use client';

import { useEffect, useState, useCallback } from 'react';
import { list, getUrl, remove } from 'aws-amplify/storage';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { client } from '@/lib/client';
import UploadModal from './components/UploadModal';
import EditModal from './components/EditModal';
import StoryViewer from './components/StoryViewer';

export type TileData = {
  key: string;
  url: string;
  caption?: string;
  musicKey?: string;
  dbId?: string;
};

function GalleryApp() {
  const { authStatus, signOut } = useAuthenticator((c) => [c.authStatus]);
  const isOwner = authStatus === 'authenticated';

  const [tiles, setTiles] = useState<TileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [storyAt, setStoryAt] = useState<number | null>(null);
  const [editing, setEditing] = useState<TileData | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<TileData | null>(null);
  const [deleting, setDeleting] = useState(false);

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
            dbId: meta?.id ?? undefined,
          } as TileData;
        })
      );
      const result = withUrls.reverse();
      console.log('DB records found:', dbRecords.length);
      console.log('Tiles with musicKey:', result.filter(t => t.musicKey).length, '/', result.length);
      result.forEach(t => console.log(' -', t.key, '| musicKey:', t.musicKey ?? 'NONE'));
      setTiles(result);
    } catch (e) {
      console.error('Failed to load photos:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(tile: TileData) {
    setDeleting(true);
    try {
      await remove({ path: tile.key });
      if (tile.musicKey && !tile.musicKey.startsWith('https://')) {
        await remove({ path: tile.musicKey }).catch(() => {});
      }
      if (tile.dbId) {
        await client.models.Memory.delete({ id: tile.dbId }, { authMode: 'userPool' });
      }
      setTiles((prev) => prev.filter((t) => t.key !== tile.key));
    } catch (e) {
      console.error('Delete failed', e);
    }
    setDeleting(false);
    setConfirmDelete(null);
  }

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
            {t.musicKey && <div className="music-badge">♪</div>}
            {(t.caption || t.musicKey) && (
              <div className="meta">
                {t.musicKey && <span className="note">♪</span>}
                {t.caption && <span>{t.caption}</span>}
              </div>
            )}
            {isOwner && (
              <div className="tile-actions" onClick={(e) => e.stopPropagation()}>
                <button className="tile-btn" onClick={() => setEditing(t)}>Edit</button>
                <button className="tile-btn tile-btn-delete" onClick={() => setConfirmDelete(t)}>Delete</button>
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

      {editing && (
        <EditModal
          tile={editing}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}

      {confirmDelete && (
        <div className="overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Delete this photo?</h2>
            <p className="confirm-text">This removes the photo and its music permanently from S3. Cannot be undone.</p>
            <div className="row" style={{ marginTop: 20 }}>
              <button
                className="btn btn-danger"
                onClick={() => handleDelete(confirmDelete)}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Yes, delete'}
              </button>
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)} disabled={deleting}>
                Cancel
              </button>
            </div>
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

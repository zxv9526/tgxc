import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { BlogPost, TelegramPhoto } from './types';
import { groupPhotosToBlogPosts } from './utils/telegram';
import { getDefaultPhotos } from './data/default_photos';
import { Header } from './components/Header';
import { TagFilter } from './components/TagFilter';
import { BlogCard } from './components/BlogCard';
import { PhotoCard } from './components/PhotoCard';
import { ArticleModal } from './components/ArticleModal';
import { LightboxModal, LightboxImageItem } from './components/LightboxModal';
import { RefreshCw, ChevronDown, Layers, SearchX, LayoutGrid, List } from 'lucide-react';

export function App() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [rawPhotos, setRawPhotos] = useState<TelegramPhoto[]>([]);
  const [channelName, setChannelName] = useState('Telegram 频道博客');
  const [channelHandle, setChannelHandle] = useState('amlhmfzl');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState(false);
  const isSyncingRef = useRef(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const [selectedArticle, setSelectedArticle] = useState<BlogPost | null>(null);
  const [lightboxState, setLightboxState] = useState<{
    images: LightboxImageItem[];
    currentIndex: number;
  } | null>(null);

  const [visibleCount, setVisibleCount] = useState(24);
  const [viewMode, setViewMode] = useState<'blog' | 'gallery'>('blog');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/photos');
      if (res.ok) {
        const data = await res.json();
        if (data.handle) setChannelHandle(data.handle);
        if (data.channelName) setChannelName(data.channelName);
        if (data.avatarUrl) setAvatarUrl(data.avatarUrl);

        if (data.photos && data.photos.length > 0) {
          setRawPhotos(data.photos);
          if (data.posts && data.posts.length > 0) {
            setPosts(data.posts);
          } else {
            setPosts(groupPhotosToBlogPosts(data.photos));
          }
        } else {
          const defaults = getDefaultPhotos();
          setRawPhotos(defaults);
          setPosts(groupPhotosToBlogPosts(defaults));
        }
      } else {
        const defaults = getDefaultPhotos();
        setRawPhotos(defaults);
        setPosts(groupPhotosToBlogPosts(defaults));
      }
    } catch (err) {
      console.error('Failed to fetch channel data:', err);
      const defaults = getDefaultPhotos();
      setRawPhotos(defaults);
      setPosts(groupPhotosToBlogPosts(defaults));
    }
  }, []);

  const autoSync = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    setIsSyncing(true);
    try {
      await fetch('/api/sync', { method: 'POST' });
      await fetchData();
    } catch (err) {
      console.error('Failed to auto sync:', err);
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, [fetchData]);

  useEffect(() => {
    fetchData();
    autoSync();

    // Set up automatic interval refresh every 30 seconds
    const interval = setInterval(() => {
      autoSync();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchData, autoSync]);

  // Compute all available tags and their frequency count
  const popularTags = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    posts.forEach(p => {
      p.tags?.forEach(t => {
        if (!t || t === 'Telegram' || t === '频道' || t === 'Channel') return;
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      });
    });

    return Object.entries(tagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }, [posts]);

  // Filter posts based on search query and selected hashtag
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      // 1. Tag filter
      if (selectedTag) {
        const hasTag = post.tags?.some(t => t.toLowerCase() === selectedTag.toLowerCase());
        if (!hasTag) return false;
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = post.title?.toLowerCase().includes(q);
        const inContent = post.content?.toLowerCase().includes(q);
        const inMsgId = post.messageId?.includes(q);
        const inTags = post.tags?.some(t => t.toLowerCase().includes(q));

        if (!inTitle && !inContent && !inMsgId && !inTags) {
          return false;
        }
      }

      return true;
    });
  }, [posts, selectedTag, searchQuery]);

  const displayedPosts = useMemo(() => {
    return filteredPosts.slice(0, visibleCount);
  }, [filteredPosts, visibleCount]);

  // Filter individual photos based on search query and selected hashtag
  const filteredPhotos = useMemo(() => {
    return rawPhotos.filter(photo => {
      // 1. Tag filter
      if (selectedTag) {
        const hasTag = photo.tags?.some(t => t.toLowerCase() === selectedTag.toLowerCase());
        if (!hasTag) return false;
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = photo.title?.toLowerCase().includes(q);
        const inContent = photo.description?.toLowerCase().includes(q);
        const inMsgId = photo.messageId?.includes(q);
        const inTags = photo.tags?.some(t => t.toLowerCase().includes(q));

        if (!inTitle && !inContent && !inMsgId && !inTags) {
          return false;
        }
      }

      return true;
    });
  }, [rawPhotos, selectedTag, searchQuery]);

  const displayedPhotos = useMemo(() => {
    return filteredPhotos.slice(0, visibleCount);
  }, [filteredPhotos, visibleCount]);

  const handleOpenImage = useCallback((url: string, title?: string, postPhotos?: string[], currentIdx: number = 0) => {
    if (postPhotos && postPhotos.length > 1) {
      const images: LightboxImageItem[] = postPhotos.map((pUrl, i) => ({
        url: pUrl,
        title: `${title || '图片'} (${i + 1}/${postPhotos.length})`,
      }));
      setLightboxState({ images, currentIndex: currentIdx });
    } else {
      const allImages: LightboxImageItem[] = [];
      let foundIdx = -1;

      filteredPosts.forEach(p => {
        p.photos.forEach((pUrl, i) => {
          const itemTitle = p.photos.length > 1 ? `${p.title} (${i + 1}/${p.photos.length})` : p.title;
          allImages.push({
            url: pUrl,
            title: itemTitle,
            date: p.date
          });
          if (pUrl === url && foundIdx === -1) {
            foundIdx = allImages.length - 1;
          }
        });
      });

      if (allImages.length === 0 && url) {
        allImages.push({ url, title });
        foundIdx = 0;
      }

      setLightboxState({
        images: allImages,
        currentIndex: foundIdx >= 0 ? foundIdx : 0
      });
    }
  }, [filteredPosts]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-sky-500 selection:text-white flex flex-col antialiased">
      {/* Header Bar */}
      <Header
        channelName={channelName}
        channelHandle={channelHandle}
        avatarUrl={avatarUrl}
        totalPosts={posts.length}
        totalPhotos={rawPhotos.length}
        isSyncing={isSyncing}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setVisibleCount(24);
        }}
        onManualSync={autoSync}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Popular Tags Filter Bar */}
        {popularTags.length > 0 && (
          <TagFilter
            tags={popularTags}
            selectedTag={selectedTag}
            onSelectTag={(tag) => {
              setSelectedTag(tag);
              setVisibleCount(24);
            }}
          />
        )}

        {/* View Mode & Filter Status Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/40 p-3.5 rounded-2xl border border-slate-800/60 shadow-inner">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-200">
              {viewMode === 'blog' ? '📰 博文视图' : '🖼️ 图库视图'}
            </span>
            <span className="text-xs text-slate-400 border-l border-slate-850 pl-3">
              共加载了 {viewMode === 'blog' ? filteredPosts.length : filteredPhotos.length} 个项目
            </span>
          </div>
          
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800/80 w-fit self-end sm:self-auto">
            <button
              onClick={() => setViewMode('blog')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'blog'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>博文模式</span>
            </button>
            <button
              onClick={() => setViewMode('gallery')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'gallery'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>图库模式</span>
            </button>
          </div>
        </div>

        {/* Filter / Search Status */}
        {(selectedTag || searchQuery) && (
          <div className="flex items-center justify-between bg-slate-900/20 px-4 py-2 rounded-xl border border-slate-800/50 text-xs text-slate-400">
            <span>
              已筛选 {viewMode === 'blog' ? filteredPosts.length : filteredPhotos.length} {viewMode === 'blog' ? '篇博文' : '张图片'}
              {selectedTag && <span className="text-sky-400 ml-1 font-semibold">#{selectedTag}</span>}
              {searchQuery && <span className="text-sky-400 ml-1 font-semibold">"{searchQuery}"</span>}
            </span>
            <button
              onClick={() => {
                setSelectedTag(null);
                setSearchQuery('');
              }}
              className="text-sky-400 hover:underline cursor-pointer font-medium"
            >
              清除筛选
            </button>
          </div>
        )}

        {/* Empty State */}
        {(viewMode === 'blog' ? filteredPosts.length : filteredPhotos.length) === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center gap-3 bg-slate-900/40 border border-slate-900 rounded-3xl p-8">
            <SearchX className="w-10 h-10 text-slate-600 mb-1" />
            <p className="text-sm font-bold text-slate-300">没有找到相关项目</p>
            <p className="text-xs text-slate-500">尝试更换搜索关键词或取消标签筛选</p>
            <button
              onClick={() => {
                setSelectedTag(null);
                setSearchQuery('');
              }}
              className="mt-2 px-4 py-2 bg-sky-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>查看全部内容</span>
            </button>
          </div>
        ) : viewMode === 'blog' ? (
          /* Post Feed Container */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {displayedPosts.map((post) => (
              <BlogCard
                key={post.id}
                post={post}
                onOpenArticle={(p) => setSelectedArticle(p)}
                onOpenImage={handleOpenImage}
                onSelectTag={(tag) => {
                  setSelectedTag(tag);
                  setVisibleCount(24);
                }}
              />
            ))}
          </div>
        ) : (
          /* Photo Wall Grid Container */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {displayedPhotos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                onOpenLightbox={(ph) => {
                  const idx = filteredPhotos.findIndex(p => p.id === ph.id);
                  const images = filteredPhotos.map(p => ({
                    url: p.url,
                    title: p.title,
                    date: p.date
                  }));
                  setLightboxState({
                    images,
                    currentIndex: idx >= 0 ? idx : 0
                  });
                }}
              />
            ))}
          </div>
        )}

        {/* Load More Button */}
        {visibleCount < (viewMode === 'blog' ? filteredPosts.length : filteredPhotos.length) && (
          <div className="py-8 flex justify-center">
            <button
              onClick={() => setVisibleCount(prev => prev + 24)}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <span>加载更多 ({ (viewMode === 'blog' ? filteredPosts.length : filteredPhotos.length) - visibleCount } 个剩余)</span>
              <ChevronDown className="w-4 h-4 text-sky-400" />
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="flex items-center justify-center gap-1.5 font-medium text-slate-400">
            <Layers className="w-4 h-4 text-sky-400" />
            <span>BroadcastChannel • Telegram 频道博客</span>
          </p>
          <p>
            源自 Telegram 频道{' '}
            <a
              href={`https://t.me/${channelHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:underline font-semibold"
            >
              @{channelHandle}
            </a>{' '}
            • 实时同步 & 网页阅读
          </p>
        </div>
      </footer>

      {/* Lightbox Image Preview Modal */}
      <LightboxModal
        images={lightboxState?.images || []}
        currentIndex={lightboxState?.currentIndex ?? 0}
        onClose={() => setLightboxState(null)}
        onNavigate={(idx) => {
          if (lightboxState) {
            setLightboxState({ ...lightboxState, currentIndex: idx });
          }
        }}
      />

      {/* Article Reader Modal */}
      <ArticleModal
        post={selectedArticle}
        allPosts={filteredPosts}
        onClose={() => setSelectedArticle(null)}
        onNavigate={(p) => setSelectedArticle(p)}
        onOpenImage={handleOpenImage}
      />
    </div>
  );
}

export default App;

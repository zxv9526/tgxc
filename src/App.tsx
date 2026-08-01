import { useState, useEffect, useMemo, useCallback } from 'react';
import { BlogPost, TelegramPhoto } from './types';
import { groupPhotosToBlogPosts } from './utils/telegram';
import { getDefaultPhotos } from './data/default_photos';
import { Header } from './components/Header';
import { TagFilter } from './components/TagFilter';
import { BlogCard } from './components/BlogCard';
import { ArticleModal } from './components/ArticleModal';
import { LightboxModal } from './components/LightboxModal';
import { Radio, RefreshCw, FileText, ChevronDown, Layers, SearchX } from 'lucide-react';

export function App() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [rawPhotos, setRawPhotos] = useState<TelegramPhoto[]>([]);
  const [channelName, setChannelName] = useState('Telegram 频道博客');
  const [channelHandle, setChannelHandle] = useState('amlhmfzl');
  const [isSyncing, setIsSyncing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const [selectedArticle, setSelectedArticle] = useState<BlogPost | null>(null);
  const [lightboxInfo, setLightboxInfo] = useState<{ url: string; title: string } | null>(null);

  const [visibleCount, setVisibleCount] = useState(24);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/photos');
      if (res.ok) {
        const data = await res.json();
        if (data.handle) setChannelHandle(data.handle);
        if (data.channelName) setChannelName(data.channelName);

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
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await fetch('/api/sync', { method: 'POST' });
      await fetchData();
    } catch (err) {
      console.error('Failed to auto sync:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [fetchData, isSyncing]);

  useEffect(() => {
    fetchData();
    
    // Set up automatic interval refresh every 60 seconds
    const interval = setInterval(() => {
      autoSync();
    }, 60000);

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

  // Transform current lightbox photo for LightboxModal compatibility
  const activeLightboxPhoto = useMemo(() => {
    if (!lightboxInfo) return null;
    return {
      id: 'lightbox',
      title: lightboxInfo.title,
      description: '',
      url: lightboxInfo.url,
      date: new Date().toISOString().split('T')[0]
    } as TelegramPhoto;
  }, [lightboxInfo]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-sky-500 selection:text-white flex flex-col antialiased">
      {/* Header Bar */}
      <Header
        channelName={channelName}
        channelHandle={channelHandle}
        totalPosts={posts.length}
        totalPhotos={rawPhotos.length}
        isSyncing={isSyncing}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setVisibleCount(24);
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner Announcement */}
        <div className="bg-gradient-to-r from-sky-950/60 via-slate-900 to-indigo-950/60 border border-sky-500/20 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
                <Radio className="w-4 h-4 animate-pulse" />
              </span>
              <h2 className="text-sm font-bold text-slate-100">
                BroadcastChannel 频道博客模式
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              已将 Telegram <span className="text-sky-400 font-medium">@{channelHandle}</span> 频道完美转为轻量级响应式博客。同步收录 {posts.length} 篇图文博文，支持实时搜索、Hashtag 标签筛选、相册轮播与沉浸式阅读。
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 text-xs font-semibold text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
            <FileText className="w-3.5 h-3.5 text-sky-400" />
            <span>实时同步 Telegram</span>
          </div>
        </div>

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

        {/* Filter / Search Status */}
        {(selectedTag || searchQuery) && (
          <div className="flex items-center justify-between bg-slate-900/40 px-4 py-2 rounded-xl border border-slate-800 text-xs text-slate-400">
            <span>
              已筛选 {filteredPosts.length} 篇文章
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
        {filteredPosts.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center gap-3 bg-slate-900/40 border border-slate-900 rounded-3xl p-8">
            <SearchX className="w-10 h-10 text-slate-600 mb-1" />
            <p className="text-sm font-bold text-slate-300">没有找到相关博文</p>
            <p className="text-xs text-slate-500">尝试更换搜索关键词或取消标签筛选</p>
            <button
              onClick={() => {
                setSelectedTag(null);
                setSearchQuery('');
              }}
              className="mt-2 px-4 py-2 bg-sky-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>查看全部文章</span>
            </button>
          </div>
        ) : (
          /* Post Feed Container */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {displayedPosts.map((post) => (
              <BlogCard
                key={post.id}
                post={post}
                onOpenArticle={(p) => setSelectedArticle(p)}
                onOpenImage={(url, title) => setLightboxInfo({ url, title })}
                onSelectTag={(tag) => {
                  setSelectedTag(tag);
                  setVisibleCount(24);
                }}
              />
            ))}
          </div>
        )}

        {/* Load More Button */}
        {visibleCount < filteredPosts.length && (
          <div className="py-8 flex justify-center">
            <button
              onClick={() => setVisibleCount(prev => prev + 24)}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <span>加载更多文章 ({filteredPosts.length - visibleCount} 篇剩余)</span>
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
            <span>BroadcastChannel • Telegram 频道博客转换系统</span>
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
            • 实时同步 & 网页全屏浏览
          </p>
        </div>
      </footer>

      {/* Lightbox Image Preview Modal */}
      <LightboxModal
        photo={activeLightboxPhoto}
        onClose={() => setLightboxInfo(null)}
        onNext={() => {}}
        onPrev={() => {}}
        hasNext={false}
        hasPrev={false}
      />

      {/* Article Reader Modal */}
      <ArticleModal
        post={selectedArticle}
        allPosts={filteredPosts}
        onClose={() => setSelectedArticle(null)}
        onNavigate={(p) => setSelectedArticle(p)}
        onOpenImage={(url, title) => setLightboxInfo({ url, title })}
      />
    </div>
  );
}

export default App;

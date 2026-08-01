import cachedPhotos from '../../channel_photos_cache.json';

export async function onRequest(context) {
  const url = new URL(context.request.url);
  
  // Group photos into blog posts logic inside edge function
  const postsMap = new Map();
  const photos = Array.isArray(cachedPhotos) ? cachedPhotos : [];

  photos.forEach(p => {
    if (!p) return;
    const msgId = p.messageId || p.id.replace('tg-', '').split('-')[0] || `post-${Date.now()}`;
    const rawTitle = p.title || '';
    const cleanTitle = rawTitle.replace(/\s*\(\d+\/\d+\)$/, '').trim() || '频道动态';
    const cleanContent = p.description || p.title || '';

    let tags = p.tags || [];
    if (!tags || tags.length === 0) {
      const tagMatches = cleanContent.match(/#([\w\u4e00-\u9fa5]+)/g) || [];
      tags = tagMatches.map(t => t.replace('#', '')).filter(Boolean);
    }
    if (tags.length === 0) tags = ['Telegram', '频道'];

    const validUrl = p.url;

    if (!postsMap.has(msgId)) {
      postsMap.set(msgId, {
        id: msgId,
        messageId: msgId,
        title: cleanTitle,
        content: cleanContent,
        photos: validUrl ? [validUrl] : [],
        date: p.date || new Date().toISOString().split('T')[0],
        timestamp: p.timestamp || (p.date ? new Date(`${p.date}T00:00:00+08:00`).getTime() : Date.now()),
        views: p.views || Math.floor(Math.random() * 500) + 100,
        likes: p.likes || Math.floor(Math.random() * 50) + 5,
        tags,
        telegramUrl: p.telegramUrl || `https://t.me/${(p.author || 'amlhmfzl').replace('@', '')}/${msgId}`,
        author: p.author || '@amlhmfzl'
      });
    } else {
      const post = postsMap.get(msgId);
      if (validUrl && !post.photos.includes(validUrl)) {
        post.photos.push(validUrl);
      }
    }
  });

  const posts = Array.from(postsMap.values()).sort((a, b) => {
    const aId = parseInt(a.messageId || '0', 10);
    const bId = parseInt(b.messageId || '0', 10);
    if (aId && bId && aId !== bId) return bId - aId;
    return b.timestamp - a.timestamp;
  });

  return new Response(JSON.stringify({
    photos: photos,
    posts: posts,
    channelName: 'Telegram 频道博客',
    handle: 'amlhmfzl'
  }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}

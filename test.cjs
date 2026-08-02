const fs = require('fs');

function isJunkOrEmojiUrl(url) {
  if (!url) return true;
  const lower = url.toLowerCase();
  if (lower.includes('.js') || lower.includes('.css') || lower.includes('.json') || lower.includes('.html')) return true;
  if (lower.includes('telegram.org/img/emoji')) return true;
  if (lower.includes('/emoji/')) return true;
  if (lower.includes('sticker')) return true;
  if (lower.includes('reaction')) return true;
  if (lower.endsWith('.svg')) return true;

  const isTgCdnFile = lower.includes('telesco.pe/file/') || lower.includes('telegram-cdn.org/file/') || lower.includes('telegram.org/file/') || lower.includes('tgstat') || lower.includes('cdn');
  const isImageExt = /\.(?:jpg|jpeg|png|webp|gif)(\?|$)/i.test(lower);

  if (!isTgCdnFile && !isImageExt) return true;

  return false;
}

async function testFull() {
  const handle = 'amlhmfzl';
  console.log('Fetching t.me/s/' + handle);
  const res = await fetch('https://t.me/s/' + handle, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  });
  const html = await res.text();

  // Split safely by js-widget_message
  const messageBlocks = html.split(/(?=<div[^>]*class=["'][^"']*(?:js-widget_message|tgme_widget_message_wrap|tgme_widget_message\s))/i);

  console.log('Total message blocks:', messageBlocks.length - 1);

  const photos = [];
  for (let i = 1; i < messageBlocks.length; i++) {
    const block = messageBlocks[i];
    const cleanBlock = block.replace(/&quot;/g, '"');
    const contentBlock = cleanBlock.replace(/<div[^>]*class=["'][^"']*tgme_widget_message_userphoto[^"']*[\s\S]*?<\/div>/gi, '');

    const photoWrapMatches = contentBlock.match(/<(?:a|div|i|span)[^>]*class=["'][^"']*(?:tgme_widget_message_photo_wrap|js-message_photo|tgme_widget_message_photo|tgme_widget_message_grouped_media_wrap)[^"']*["'][^>]*>/gi) || [];

    const imageUrls = [];
    for (const wrapTag of photoWrapMatches) {
      const bgMatch = wrapTag.match(/background-image\s*:\s*url\(['"]?([^'"]+?)['"]?\)/i);
      let url = bgMatch ? bgMatch[1] : null;
      if (!url) {
        const srcMatch = wrapTag.match(/(?:src|data-src)=["']([^"']+)["']/i);
        if (srcMatch) url = srcMatch[1];
      }
      if (url) {
        url = url.trim();
        if (url.startsWith('//')) url = 'https:' + url;
        if (url.startsWith('http') && !imageUrls.includes(url) && !isJunkOrEmojiUrl(url)) {
          imageUrls.push(url);
        }
      }
    }

    if (imageUrls.length === 0) {
      const allBgMatches = contentBlock.match(/background-image\s*:\s*url\(['"]?([^'"]+?)['"]?\)/gi) || [];
      for (const bgStr of allBgMatches) {
        const m = bgStr.match(/url\(['"]?([^'"]+?)['"]?\)/i);
        if (m && m[1]) {
          let url = m[1].trim();
          if (url.startsWith('//')) url = 'https:' + url;
          if (url.startsWith('http') && !imageUrls.includes(url) && !isJunkOrEmojiUrl(url)) {
            imageUrls.push(url);
          }
        }
      }
    }

    if (imageUrls.length > 0) {
      const msgIdMatch = cleanBlock.match(/href="https:\/\/t\.me\/[^\/]+\/(\d+)"/i) || cleanBlock.match(/data-post="[^\/]+\/(\d+)"/i);
      const messageId = msgIdMatch ? msgIdMatch[1] : `${i}`;
      imageUrls.forEach((u, idx) => {
        photos.push({ messageId, url: u });
      });
    }
  }

  console.log(`Parsed ${photos.length} photo items total!`);
  if (photos.length > 0) {
    console.log('Sample parsed photos:');
    photos.slice(0, 5).forEach(p => console.log(`Msg #${p.messageId}: ${p.url.slice(0, 80)}`));
  }
}

testFull();

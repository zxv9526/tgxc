const fs = require('fs');

async function test() {
  const handle = 'amlhmfzl';
  console.log('Fetching https://t.me/s/' + handle);
  try {
    const res = await fetch('https://t.me/s/' + handle, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    console.log('HTML length:', html.length);

    const blocks = html.split('tgme_widget_message');
    console.log('Blocks count:', blocks.length - 1);

    let photos = [];
    blocks.slice(1).forEach((b, i) => {
      const cleanB = b.replace(/&quot;/g, '"');
      const bgRegex = /background-image:\s*url\(['"]?(https:\/\/[^'"\)\s]+)['"]?\)/gi;
      let match;
      while ((match = bgRegex.exec(cleanB)) !== null) {
        photos.push(match[1]);
      }
    });
    console.log('Photos extracted:', photos.length);
    if (photos.length > 0) {
      console.log('First photo URL:', photos[0].slice(0, 100));
    }
  } catch (err) {
    console.error('Test error:', err);
  }
}

test();

import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = "https://mydramalist.com";

// Advanced headers to mimic a real browser more closely
const HEADERS = {
  'authority': 'mydramalist.com',
  'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'accept-language': 'en-US,en;q=0.9',
  'cache-control': 'max-age=0',
  'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest': 'document',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-site': 'none',
  'sec-fetch-user': '?1',
  'upgrade-insecure-requests': '1',
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

// Use a proxy service or a different approach if 403 persists. 
// For now, let's try to rotate the User-Agent or use a more specific search URL.
export const mdl = {
  async SearchQuery(query: string) {
    try {
      // MDL sometimes blocks the /search?q= endpoint more aggressively.
      // Let's try to add some randomness or a referer.
      const searchUrl = `${BASE_URL}/search?q=${encodeURIComponent(query)}&t=d`;
      const response = await axios.get(searchUrl, {
        headers: {
          ...HEADERS,
          'referer': 'https://www.google.com/',
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const results: any[] = [];
      
      $('div.box').each((_, item) => {
        const titleElem = $(item).find('h6.title');
        const linkElem = titleElem.find('a');
        if (!linkElem.length) return;

        const title = titleElem.text().trim();
        const link = linkElem.attr('href') || '';
        const slug = link.split('/').pop() || '';
        
        const yearElem = $(item).find('span.text-muted');
        const yearMatch = yearElem.text().match(/(\d{4})/);
        const year = yearMatch ? yearMatch[1] : '';

        const imgElem = $(item).find('img.lazy');
        const thumb = imgElem.attr('data-src') || $(item).find('img').attr('src') || '';

        results.push({
          title,
          slug,
          year,
          thumb,
          url: `${BASE_URL}${link}`,
          type: 'Drama'
        });
      });

      if (results.length === 0 && response.data.includes('Just a moment')) {
        throw new Error("Cloudflare protection active (403).");
      }

      return { dramas: results };
    } catch (error: any) {
      console.error("MDL Search Error (Axios):", error.message);
      if (error.response?.status === 403 || error.message.includes('403')) {
        // Fallback: If 403, we can't do much without a proxy or a real browser (Puppeteer).
        // Since we are in a limited environment, we inform the user.
        throw new Error("Akses ke MyDramaList dibatasi oleh Cloudflare. Coba lagi dalam beberapa menit atau gunakan judul pencarian yang lebih spesifik.");
      }
      throw error;
    }
  },

  async FetchQuery(slug: string) {
    try {
      const dramaUrl = `${BASE_URL}/${slug}`;
      const response = await axios.get(dramaUrl, { 
        headers: {
          ...HEADERS,
          'referer': BASE_URL
        }, 
        timeout: 10000 
      });
      const $ = cheerio.load(response.data);

      const title = $('h1.film-title').text().trim() || 'N/A';
      const poster = $('div.film-cover img').attr('src') || '';
      const synopsis = $('div.show-synopsis > p').text().replace(' Edit Translation', '').trim() || '';
      const rating = $('.hfs b').text().trim() || 'N/A';

      const cast: any[] = [];
      $('ul.list.cast-list li.list-item').each((_, item) => {
        const nameElem = $(item).find('a.text-primary b');
        if (nameElem.length) {
          cast.push({
            name: nameElem.text().trim(),
            character: $(item).find('small').text().trim()
          });
        }
      });

      return {
        title,
        posterUrl: poster,
        synopsis,
        rating,
        cast,
        source: "mdl"
      };
    } catch (error: any) {
      console.error("MDL Fetch Error (Axios):", error.message);
      throw error;
    }
  }
};

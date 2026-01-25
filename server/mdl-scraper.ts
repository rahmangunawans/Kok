import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = "https://mydramalist.com";

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
};

export const mdl = {
  async SearchQuery(query: string) {
    try {
      const searchUrl = `${BASE_URL}/search?q=${encodeURIComponent(query)}`;
      const response = await axios.get(searchUrl, {
        headers: {
          ...HEADERS,
          'Referer': 'https://www.google.com/'
        }
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
          url: `${BASE_URL}${link}`
        });
      });

      return { dramas: results };
    } catch (error: any) {
      console.error("MDL Search Error:", error.message);
      throw error;
    }
  },

  async FetchQuery(slug: string) {
    try {
      const dramaUrl = `${BASE_URL}/${slug}`;
      const response = await axios.get(dramaUrl, { headers: HEADERS });
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
            role: $(item).find('small').text().trim()
          });
        }
      });

      return {
        title,
        poster,
        synopsis,
        rating,
        cast
      };
    } catch (error: any) {
      console.error("MDL Fetch Error:", error.message);
      throw error;
    }
  }
};

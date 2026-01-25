import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = "https://mydramalist.com";

// More realistic browser headers to bypass Cloudflare
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Cache-Control': 'max-age=0',
  'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
};

// Simple utility for delay to avoid rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mdl = {
  async SearchQuery(query: string) {
    try {
      // Use search?q= instead of direct slug search for better compatibility
      const searchUrl = `${BASE_URL}/search?q=${encodeURIComponent(query)}`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          ...HEADERS,
          'Referer': 'https://www.google.com/'
        },
        timeout: 10000,
        validateStatus: (status) => status === 200 // Only proceed if 200 OK
      });

      const $ = cheerio.load(response.data);
      const results: any[] = [];
      
      // Select items based on the reference structure
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

        // Handle lazy loaded images
        const imgElem = $(item).find('img.lazy');
        const thumb = imgElem.attr('data-src') || $(item).find('img').attr('src') || '';

        const ratingElem = $(item).find('span.score');
        const rating = ratingElem.text().trim();

        results.push({
          title,
          slug,
          year,
          thumb,
          rating,
          url: `${BASE_URL}${link}`,
          type: $(item).find('span.text-muted').first().text().split(',')[0].trim() || 'Drama'
        });
      });

      return { dramas: results };
    } catch (error: any) {
      if (error.response?.status === 403) {
        console.error("MDL Search Error: 403 Forbidden - Cloudflare block");
        throw new Error("MyDramaList is currently blocking requests. Please try again later.");
      }
      console.error("MDL Search Error:", error.message);
      throw error;
    }
  },

  async FetchQuery(slug: string) {
    try {
      const dramaUrl = `${BASE_URL}/${slug}`;
      const response = await axios.get(dramaUrl, { 
        headers: HEADERS,
        timeout: 10000
      });
      const $ = cheerio.load(response.data);

      const title = $('h1.film-title').text().trim() || 'N/A';
      const poster = $('div.film-cover img').attr('src') || '';
      const synopsis = $('div.show-synopsis > p').text().replace(' Edit Translation', '').trim() || '';
      
      // Overall Rating
      const rating = $('.hfs b').text().trim() || 'N/A';

      const cast: any[] = [];
      // Parsing cast based on reference
      $('ul.list.cast-list li.list-item').each((_, item) => {
        const nameElem = $(item).find('a.text-primary b');
        const charRole = $(item).find('small').text().trim();
        if (nameElem.length) {
          cast.push({
            name: nameElem.text().trim(),
            character: charRole,
            image: $(item).find('img').attr('src') || $(item).find('img').attr('data-src') || ''
          });
        }
      });

      // Additional Details
      const details: any = {};
      $('li.list-item').each((_, item) => {
        const text = $(item).text();
        if (text.includes('Drama:')) details.type = text.replace('Drama:', '').trim();
        if (text.includes('Country:')) details.country = text.replace('Country:', '').trim();
        if (text.includes('Episodes:')) details.episodes = text.replace('Episodes:', '').trim();
        if (text.includes('Aired:')) details.aired = text.replace('Aired:', '').trim();
      });

      return {
        title,
        poster,
        synopsis,
        rating,
        cast,
        ...details
      };
    } catch (error: any) {
      console.error("MDL Fetch Error:", error.message);
      throw error;
    }
  }
};

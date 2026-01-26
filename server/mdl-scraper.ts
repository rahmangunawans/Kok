import { Kuryana } from '@tbdhdev/kuryana-ts';

// kuryana-ts is a wrapper around an API endpoint
const client = new Kuryana();

export const mdl = {
  async SearchQuery(query: string) {
    try {
      console.log(`Searching MDL for: ${query}`);
      const response = (await client.search(query)) as any;
      console.log("MDL Search raw response:", JSON.stringify(response));

      if (!response.success) {
        throw new Error(response.error || "Search failed");
      }
      
      // The error "dramas.map is not a function" suggests response.result might be the array itself
      // or nested differently. Looking at typical kuryana-ts structure:
      // result: { dramas: [...] } OR result: [...]
      
      let dramas = [];
      if (Array.isArray(response.result)) {
        dramas = response.result;
      } else if (response.result && Array.isArray(response.result.dramas)) {
        dramas = response.result.dramas;
      } else if (response.result && typeof response.result === 'object') {
        // Fallback for unexpected object structure
        dramas = Object.values(response.result).find(val => Array.isArray(val)) as any[] || [];
      }

      return { 
        dramas: dramas.map((drama: any) => ({
          title: drama.title || drama.name,
          slug: drama.slug || drama.id,
          year: drama.year,
          thumb: drama.image || drama.thumb || drama.poster,
          rating: drama.rating,
          url: drama.slug ? `https://mydramalist.com${drama.slug}` : '',
          type: drama.type || 'Drama'
        }))
      };
    } catch (error: any) {
      console.error("MDL Search Error (kuryana-ts):", error.message);
      throw error;
    }
  },

  async FetchQuery(slug: string) {
    try {
      console.log(`Fetching MDL drama: ${slug}`);
      const response = (await client.getDrama(slug)) as any;
      console.log("MDL Fetch raw response:", JSON.stringify(response));

      if (!response.success) {
        throw new Error(response.error || "Fetch failed");
      }

      const drama = response.result;
      if (!drama) throw new Error("Drama data not found in response");

      return {
        id: slug,
        title: drama.title || drama.name,
        synopsis: drama.synopsis || drama.description || drama.plot,
        posterUrl: drama.image || drama.thumb || drama.poster,
        rating: drama.rating,
        cast: (drama.cast || []).map((c: any) => ({
          name: c.name,
          character: c.role || c.character,
          image: c.image || c.thumb
        })),
        source: "mdl"
      };
    } catch (error: any) {
      console.error("MDL Fetch Error (kuryana-ts):", error.message);
      throw error;
    }
  }
};

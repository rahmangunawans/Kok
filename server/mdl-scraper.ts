import { Kuryana } from '@tbdhdev/kuryana-ts';

// kuryana-ts is a wrapper around an API endpoint
const client = new Kuryana();

export const mdl = {
  async SearchQuery(query: string) {
    try {
      const response = (await client.search(query)) as any;
      if (!response.success) {
        throw new Error(response.error || "Search failed");
      }
      
      const dramas = response.result || [];
      return { 
        dramas: dramas.map((drama: any) => ({
          title: drama.title,
          slug: drama.slug,
          year: drama.year,
          thumb: drama.image,
          rating: drama.rating,
          url: `https://mydramalist.com${drama.slug}`,
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
      const response = (await client.getDrama(slug)) as any;
      if (!response.success) {
        throw new Error(response.error || "Fetch failed");
      }

      const drama = response.result;
      return {
        id: slug,
        title: drama.title,
        synopsis: drama.synopsis,
        posterUrl: drama.image,
        rating: drama.rating,
        cast: drama.cast?.map((c: any) => ({
          name: c.name,
          character: c.role,
          image: c.image
        })) || [],
        source: "mdl"
      };
    } catch (error: any) {
      console.error("MDL Fetch Error (kuryana-ts):", error.message);
      throw error;
    }
  }
};

import { Kuryana } from '@tbdhdev/kuryana-ts';

// kuryana-ts is a wrapper around an API endpoint
const client = new Kuryana();

export const mdl = {
  async SearchQuery(query: string) {
    try {
      console.log(`Searching MDL for: ${query}`);
      const response = (await client.search(query)) as any;
      console.log("MDL Search raw response success:", response.success);

      if (!response.success) {
        throw new Error(response.error || "Search failed");
      }
      
      // Based on test script: response.result.results.dramas
      let dramas = [];
      if (response.result?.results?.dramas && Array.isArray(response.result.results.dramas)) {
        dramas = response.result.results.dramas;
      } else if (response.result?.dramas && Array.isArray(response.result.dramas)) {
        dramas = response.result.dramas;
      } else if (Array.isArray(response.result)) {
        dramas = response.result;
      }

      return { 
        dramas: dramas.map((drama: any) => ({
          title: drama.title || drama.name,
          slug: drama.slug || drama.id,
          year: drama.year,
          thumb: drama.thumb || drama.image || drama.poster,
          rating: drama.rating,
          url: drama.slug ? `https://mydramalist.com/${drama.slug}` : '',
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
      
      if (!response.success) {
        throw new Error(response.error || "Fetch failed");
      }

      // Based on test script: response.result.data
      const drama = response.result?.data || response.result;
      if (!drama) throw new Error("Drama data not found in response");

      console.log("MDL Drama raw data keys:", Object.keys(drama));

      return {
        id: slug,
        title: drama.title || drama.complete_title || drama.name,
        synopsis: drama.synopsis || drama.description || drama.plot || drama.data?.synopsis,
        posterUrl: drama.poster || drama.image || drama.thumb || drama.poster_url,
        rating: drama.rating ? parseFloat(drama.rating) : (drama.score ? parseFloat(drama.score) : null),
        country: drama.country || drama.location || drama.data?.country,
        year: drama.year || drama.release_year || (drama.aired ? new Date(drama.aired).getFullYear() : null),
        type: drama.type,
        status: drama.status || drama.state,
        episodes: drama.episodes || drama.total_episodes,
        cast: (drama.casts || drama.cast || drama.data?.casts || []).map((c: any) => ({
          name: c.name,
          character: c.role || c.character,
          image: c.profile_image || c.image || c.thumb
        })),
        source: "mdl"
      };
    } catch (error: any) {
      console.error("MDL Fetch Error (kuryana-ts):", error.message);
      throw error;
    }
  }
};

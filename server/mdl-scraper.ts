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
      console.log("MDL Fetch raw response success:", response.success);
      
      if (!response.success) {
        throw new Error(response.error || "Fetch failed");
      }

      // Based on test script: response.result.data
      // Let's log the structure more clearly to debug
      console.log("MDL Response Result Structure:", JSON.stringify(Object.keys(response.result || {})));
      
      const resultData = response.result?.data || response.result;
      const drama = resultData?.data || resultData;
      
      if (!drama) throw new Error("Drama data not found in response");

      console.log("MDL Drama raw data keys:", Object.keys(drama));
      if (drama.data) console.log("MDL Drama nested data keys:", Object.keys(drama.data));

      return {
        id: slug,
        title: drama.title || drama.complete_title || drama.name || drama.data?.title,
        synopsis: drama.synopsis || drama.description || drama.plot || drama.data?.synopsis || drama.data?.description || drama.details?.synopsis,
        posterUrl: drama.poster || drama.image || drama.thumb || drama.poster_url || drama.data?.poster || drama.details?.poster,
        rating: drama.rating ? parseFloat(drama.rating) : (drama.score ? parseFloat(drama.score) : (drama.data?.rating ? parseFloat(drama.data.rating) : (drama.details?.rating ? parseFloat(drama.details.rating) : null))),
        country: drama.country || drama.location || drama.data?.country || drama.details?.country,
        year: drama.year || drama.release_year || (drama.aired ? new Date(drama.aired).getFullYear() : (drama.data?.year || drama.details?.year || (drama.release_date ? new Date(drama.release_date).getFullYear() : null))),
        type: drama.type || drama.data?.type || drama.details?.type,
        status: drama.status || drama.state || drama.data?.status || drama.details?.status,
        episodes: drama.episodes || drama.total_episodes || drama.data?.episodes || drama.details?.episodes,
        genres: drama.genres || drama.data?.genres || drama.details?.genres || [],
        tags: drama.tags || drama.data?.tags || drama.details?.tags || [],
        cast: (drama.casts || drama.cast || drama.data?.casts || drama.details?.casts || []).map((c: any) => ({
          name: c.name || c.full_name,
          character: c.role || c.character || c.role_name,
          image: c.profile_image || c.image || c.thumb || c.poster
        })),
        source: "mdl"
      };
    } catch (error: any) {
      console.error("MDL Fetch Error (kuryana-ts):", error.message);
      throw error;
    }
  }
};

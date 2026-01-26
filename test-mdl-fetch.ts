import { Kuryana } from '@tbdhdev/kuryana-ts';

async function test() {
  const client = new Kuryana();
  const slug = "749431-the-story-of-hua-zhi";
  console.log("Testing MDL fetch for: " + slug);
  try {
    const response = (await client.getDrama(slug)) as any;
    console.log("Response success: " + response.success);
    console.log("Full response: " + JSON.stringify(response, null, 2));
  } catch (e: any) {
    console.error("Test failed: " + e.message);
  }
}

test();

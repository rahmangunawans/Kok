import { Kuryana } from '@tbdhdev/kuryana-ts';

async function test() {
  const client = new Kuryana();
  const query = "Blossoms in Adversity";
  console.log("Testing MDL search for: " + query);
  try {
    const response = (await client.search(query)) as any;
    console.log("Response success: " + response.success);
    console.log("Full response: " + JSON.stringify(response, null, 2));
  } catch (e: any) {
    console.error("Test failed: " + e.message);
  }
}

test();

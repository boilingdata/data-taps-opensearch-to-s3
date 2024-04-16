import { Client } from "@opensearch-project/opensearch";

// OpenSearch connection
const host = process.env["ES_HOST"] ?? "localhost";
const port = parseInt(process.env["ES_PORT"] ?? "9200");
const user = process.env["ES_USERNAME"] ?? "admin";
const pw = process.env["ES_PASSWORD"] ?? "Admin123__kjljklkjl---";
const auth = `${user}:${pw}`;
const node = "https://" + auth + "@" + host + ":" + port;
const index = process.env["INDEX"] ?? "books";

async function addDocument(client, index, id) {
  const rand = (Math.random() * 1000000).toFixed(0);
  await client.bulk({
    index,
    refresh: true,
    body: [...new Array(1000)]
      .map((_, i) => [
        { create: { _id: `${rand}_${id}_${i}` } },
        {
          title: "The Outsider",
          author: "Stephen King",
          year: "2018",
          genre: "Crime fiction",
        },
      ])
      .flat(),
  });
}

async function createIndex(client, index) {
  const settings = { settings: { index: { number_of_shards: 1, number_of_replicas: 0 } } };
  await client.indices.create({ index, body: settings });
}

async function addMultipleDocs(index, client) {
  const base = Math.floor(Math.random() * 100_000_000);
  for (let i = 0; i < 1_000; i++) {
    await addDocument(client, index, (base + i).toFixed(0));
  }
}

const client = new Client({ node, ssl: { rejectUnauthorized: false } });

async function main() {
  await createIndex(client, index).catch(() => {});
  await addMultipleDocs(index, client);
}

main().catch(console.error);

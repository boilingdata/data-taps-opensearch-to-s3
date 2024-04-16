export async function createIndex(client, index) {
  const settings = { settings: { index: { number_of_shards: 1, number_of_replicas: 0 } } };
  await client.indices.create({ index, body: settings });
}

export function getDocCount(client, index) {
  return client.count({ index, body: { query: { match_all: {} } } });
}

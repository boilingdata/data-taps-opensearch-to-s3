export async function addDocument(client, index, id) {
  await client.index({
    id,
    index,
    refresh: true,
    body: {
      title: "The Outsider",
      author: "Stephen King",
      year: "2018",
      genre: "Crime fiction",
    },
  });
}

export async function addMultipleDocs(index, client) {
  const base = Math.floor(Math.random() * 1000000);
  for (let i = 0; i < 10_000; i++) {
    await addDocument(client, index, base + i);
  }
}

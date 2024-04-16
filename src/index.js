import { Client } from "@opensearch-project/opensearch";
import { Worker } from "worker_threads";

// OpenSearch connection
const host = process.env["ES_HOST"] ?? "localhost";
const port = parseInt(process.env["ES_PORT"] ?? "9200");
const user = process.env["ES_USERNAME"];
const pw = process.env["ES_PASSWORD"];
if (!user || !pw) throw new Error("Set ES_USERNAME and ES_PASSWORD");
const auth = `${user}:${pw}`;
const node = "https://" + auth + "@" + host + ":" + port;

// index and settings
const index = process.env["INDEX"];
if (!index) throw new Error("Set INDEX env to match your OpenSearch index to dump");
const workers = parseInt(process.env["WORKERS"] ?? "2");
const batchSize = parseInt(process.env["BATCH_SIZE"] ?? "2000");

const client = new Client({ node, ssl: { rejectUnauthorized: false } });

async function runWithWorker(workerData) {
  return new Promise((resolve, reject) => {
    const worker = new Worker("./src/worker.js", { workerData });
    worker.on("message", resolve);
    worker.on("error", reject);
    worker.on("exit", (code) => (code !== 0 ? reject(new Error(`Worker stopped with exit code ${code}`)) : resolve()));
  });
}

function getDocCount(client, index) {
  return client.count({ index, body: { query: { match_all: {} } } });
}

async function main() {
  const start = Date.now();
  // total count
  const totalCount = (await getDocCount(client, index)).body.count;
  console.log({ totalCount });
  // return;

  // get all documents with scroll API and max_slices workers
  const workerResults = [];
  const workerParams = { index, node, batchSize, numOfSlices: workers };
  [...new Array(workers)].map((_s, i) => workerResults.push(runWithWorker({ ...workerParams, sliceId: i })));
  const res = await Promise.all(workerResults);
  const sentCount = res.reduce((prev, curr) => prev + curr?.allResultsLength ?? 0, 0);
  const sentBytes = res.reduce((prev, curr) => prev + curr?.totalBytes ?? 0, 0);
  const throughput = (sentBytes / (1024 * 1024) / ((Date.now() - start) / 1000)).toFixed(2);
  console.log({ sentCount, totalCount, sentMBytes: (sentBytes / (1024 * 1024)).toFixed(2), throughput });
  if (sentCount != totalCount) throw new Error("Count mismatch");
}

main().catch(console.error);

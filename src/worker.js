import { Client } from "@opensearch-project/opensearch";
import { isMainThread, workerData, parentPort } from "worker_threads";
import { sendToDataTap } from "./boilingdata.js";

let allResultsLength = 0;
let totalBytes = 0;
let dataTapResp;

async function dumpDataWithScrollAPI(client, index, sliceId, batchSize, numOfSlices) {
  let scroll_id;
  //console.log({ id: sliceId + 1, batchSize });
  const body = { sort: ["_doc"], slice: { id: sliceId, max: numOfSlices } };
  const sres = await client.search({ index, scroll: "1m", scroll_id, size: batchSize, body });
  const total = sres.body.hits.total.value;

  scroll_id = sres.body._scroll_id;
  allResultsLength += sres.body?.hits?.hits.length;
  if (sres.body?.hits?.hits.length) dataTapResp = await sendToDataTap(sres.body?.hits?.hits);
  totalBytes += dataTapResp?.sentBytes ?? 0;
  console.log({ id: sliceId + 1, p: `${Math.floor((allResultsLength / total) * 100)}%`, bytes: totalBytes });

  // now we can parallelise
  let scrollResponse;
  let dataTapProm = Promise.resolve();
  do {
    [dataTapResp, scrollResponse] = await Promise.all([dataTapProm, client.scroll({ scroll: "1m", scroll_id })]);
    totalBytes += dataTapResp?.sentBytes ?? 0;
    scroll_id = scrollResponse.body._scroll_id;
    allResultsLength += scrollResponse.body?.hits?.hits?.length ?? 0;
    if (scrollResponse.body?.hits?.hits?.length) dataTapProm = sendToDataTap(scrollResponse.body?.hits?.hits);
    console.log({ id: sliceId + 1, p: `${((allResultsLength / total) * 100).toFixed(2)}%`, bytes: totalBytes });
  } while (scrollResponse?.body?.hits?.hits?.length);

  // clear scroll
  await client.clearScroll({ scroll_id });
  return { allResultsLength, totalBytes };
}

if (!isMainThread) {
  const { sliceId, index, node, batchSize, numOfSlices } = workerData;
  const client = new Client({ node, ssl: { rejectUnauthorized: false } });
  const res = await dumpDataWithScrollAPI(client, index, sliceId, batchSize, numOfSlices);
  parentPort.postMessage(res);
}

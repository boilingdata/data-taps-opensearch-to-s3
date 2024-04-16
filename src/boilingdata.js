import fetch from "node-fetch";
import aretry from "async-retry";
import * as fs from "fs/promises";
import jwt from "jsonwebtoken";
import { BoilingData } from "@boilingdata/node-boilingdata";
import https from "https";

const TAP_TOKEN_FILE = ".taptoken"; // fix this
const bd_username = process.env["BD_USERNAME"];
const bd_password = process.env["BD_PASSWORD"];
const bd_tapUrl = process.env["BD_TAPURL"];
const bd_tapowner = bd_username;
if (!bd_username || !bd_password || !bd_tapUrl) {
  throw new Error("You need to set BD_USERNAME, BD_PASSWORD, and BD_TAPURL envs");
}

const httpsAgent = new https.Agent({ keepAlive: true, timeout: 3000, maxSockets: 50 });
let jwtToken, decoded;

async function getValidTapToken(fetch = true) {
  try {
    jwtToken = jwtToken ?? Buffer.from(await fs.readFile(TAP_TOKEN_FILE)).toString("utf8"); // locally cached
    decoded = decoded ?? jwt.decode(jwtToken);
    if (decoded.exp * 1000 - 60 * 1000 <= Date.now()) throw new Error("Expired local JWT token");
    return jwtToken;
  } catch (err) {
    // expired or local cached file not exists or corrupted
    if (!fetch) {
      console.error(err);
      throw err;
    }
    const bd_Instance = new BoilingData({ username: bd_username, password: bd_password });
    const bd_tapClientToken = await bd_Instance.getTapClientToken("24h", bd_tapowner);
    await fs.writeFile(TAP_TOKEN_FILE, bd_tapClientToken);
    return getValidTapToken(false);
  }
}

export async function sendToDataTap(rows) {
  if (!Array.isArray(rows) || rows.length <= 0) {
    console.error({ message: "no rows" });
    return;
  }
  const body = rows?.map((r) => JSON.stringify(r)).join("\n"); // newline JSON
  const token = Buffer.from(await getValidTapToken()).toString("utf8");
  return await aretry(
    async (bail) => {
      const headers = { "x-bd-authorization": token, "Content-Type": "application/x-ndjson" };
      const signal = AbortSignal.timeout(5000);
      const res = await fetch(bd_tapUrl, { method: "POST", headers, body, agent: httpsAgent, signal });
      const jsonRes = await res.json();
      // console.log({ sentBytes: body.length, jsonRes });
      if (jsonRes?.statusCode == 403) bail("Unauthorized");
      return { sentBytes: body.length, jsonRes };
    },
    { retries: 10, onRetry: (err, attempt) => console.log("sendToDataTap attempt ", attempt, "; error:", err) }
  );
}

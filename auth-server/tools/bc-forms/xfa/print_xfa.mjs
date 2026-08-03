/* Flatten BC Supreme XFA forms to static PDFs, headlessly.
 *
 * pdf.js renders XFA to positioned DOM (the same thing Firefox's viewer shows);
 * Chrome then prints that DOM at exactly the form's page size. No Adobe, no
 * manual export. Driven over CDP so printing waits for the render to finish.
 *
 * Usage: node print_xfa.mjs <out-dir> <docId:sourcePdf> [...]
 */
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import WebSocket from "/Users/lorelaiphinnemore/Documents/CloudAct/Frontend /Calculator-code/cloudact-ui/node_modules/ws/index.js";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9333;
const ORIGIN = "http://localhost:8899";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function chromeTarget() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      return (await res.json()).webSocketDebuggerUrl;
    } catch {
      await sleep(250);
    }
  }
  throw new Error("Chrome did not expose a debugging port");
}

class Cdp {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); this.sessions = new Map();
    ws.on("message", (raw) => {
      const msg = JSON.parse(raw);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
      }
    });
  }
  send(method, params = {}, sessionId) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params, sessionId }));
    });
  }
}

async function main() {
  const [outDir, ...jobs] = process.argv.slice(2);
  fs.mkdirSync(outDir, { recursive: true });

  const chrome = spawn(CHROME, [
    "--headless=new", "--disable-gpu", "--no-sandbox", "--hide-scrollbars",
    "--no-first-run", "--no-default-browser-check",
    `--remote-debugging-port=${PORT}`, "--user-data-dir=" + path.join(outDir, ".chrome"),
    "about:blank",
  ], { stdio: "ignore" });

  const ws = new WebSocket(await chromeTarget(), { perMessageDeflate: false });
  await new Promise((resolve) => ws.on("open", resolve));
  const cdp = new Cdp(ws);

  const results = [];
  for (const job of jobs) {
    const [docId, source] = job.split("::");
    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
    try {
      await cdp.send("Page.enable", {}, sessionId);
      await cdp.send("Runtime.enable", {}, sessionId);
      const url = `${ORIGIN}/render.html?file=${encodeURIComponent(source)}`;
      await cdp.send("Page.navigate", { url }, sessionId);

      let pages = 0;
      for (let attempt = 0; attempt < 240; attempt += 1) {
        await sleep(500);
        const { result } = await cdp.send("Runtime.evaluate",
          { expression: "window.__renderDone || 0", returnByValue: true }, sessionId);
        if (result.value) { pages = result.value; break; }
      }
      if (pages <= 0) throw new Error("render did not finish");

      // Page boxes are inches in printToPDF; the forms are US Letter.
      const { data } = await cdp.send("Page.printToPDF", {
        printBackground: true, preferCSSPageSize: true,
        marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0,
        paperWidth: 8.5, paperHeight: 11,
      }, sessionId);
      const dest = path.join(outDir, `${docId}.pdf`);
      fs.writeFileSync(dest, Buffer.from(data, "base64"));

      const { result: fieldResult } = await cdp.send("Runtime.evaluate",
        { expression: "JSON.stringify(window.__fields || [])", returnByValue: true }, sessionId);
      const fields = JSON.parse(fieldResult.value);
      fs.writeFileSync(path.join(outDir, `${docId}.fields.json`), JSON.stringify(fields, null, 1));

      results.push({ docId, pages, bytes: fs.statSync(dest).size, fields: fields.length });
      console.log(`${docId}: ${pages} page(s), ${fields.length} XFA field(s) -> ${dest}`);
    } catch (error) {
      results.push({ docId, error: error.message });
      console.error(`${docId}: FAILED ${error.message}`);
    } finally {
      await cdp.send("Target.closeTarget", { targetId });
    }
  }

  ws.close();
  chrome.kill();
  fs.writeFileSync(path.join(outDir, "render-report.json"), JSON.stringify(results, null, 1));
  const failed = results.filter((r) => r.error);
  console.log(`\n${results.length - failed.length}/${results.length} rendered.`);
  process.exit(failed.length ? 1 : 0);
}

main();

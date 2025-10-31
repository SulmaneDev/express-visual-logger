import e, { type Handler } from "express";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { emitter } from "./emitter.js";
import { LoggerCtx } from "./ctx.js";

export class Logger {
  protected instance: e.Application;

  constructor(instance: e.Application) {
    this.instance = instance;
    this.setUpStatic();
    console.log("Open UI: http://localhost:5000/express-visual-logger");
  }

  protected setUpStatic() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const root = path.join(__dirname, "assets");
    this.instance.use("/express-visual-logger", e.static(root));
  }

  handler(): Handler {
    return (req, res, next) => {
      const start = Date.now();

      res.on("finish", () => {
        const duration = Date.now() - start;
        LoggerCtx.emit({
          timestamp: new Date().toISOString(),
          method: req.method,
          url: req.originalUrl || req.url,
          body: req.body,
          query: req.query,
          params: req.params,
          duration: `${duration}ms`,
        });
      });

      next();
    };
  }

  stream(): Handler {
    return (req, res) => {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });

      res.write(": sse connection opened\n\n");

      const listener = (data: any) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      };

      emitter.on("log", listener);

      req.on("close", () => {
        emitter.off("log", listener);
        res.end();
      });
    };
  }
}

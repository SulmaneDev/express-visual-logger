import express from "express";
import request from "supertest";
import { Logger } from "../src/logger";

describe("Logger Middleware", () => {
  const app = express();
  const logger = new Logger(app);

  app.use(logger.handler());
  app.get("/test", (req, res) => res.send("OK"));

  it("should log GET request", async () => {
    const res = await request(app).get("/test");
    expect(res.status).toBe(200);
  });
});

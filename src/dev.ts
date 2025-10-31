import e from "express";
import { Logger } from "./logger.js";

const app = e();

app.use(e.json());
app.use(e.urlencoded({ extended: true }));

const logger = new Logger(app);

app.use(logger.handler());
app.get("/express-visual-logger/stream", logger.stream());

app.get("/", (_req, res) => {
  res.send("Hello from Express Visual Logger!");
});

app.listen(5000, () => {
  console.log("Server running at http://localhost:5000");
  console.log("Open UI: http://localhost:5000/express-visual-logger");
});

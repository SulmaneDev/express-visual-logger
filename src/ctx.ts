import { emitter } from "./emitter.js";

export class LoggerCtx {
  static emit(data: any) {
    emitter.emit("log", data);
  }
}
import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";

// Polyfill for TextEncoder/TextDecoder
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Only add Web API polyfills if we're not in a DOM environment
if (typeof window === "undefined") {
  const { Request, Response, Headers } = require("undici");
  global.Request = Request;
  global.Response = Response;
  global.Headers = Headers;
}

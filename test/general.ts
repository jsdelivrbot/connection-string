import { throws } from "https://cdn.jsdelivr.net/gh/qoh/teset@v0.2.0/src/api.ts";
import { assertEquals } from "https://cdn.jsdelivr.net/gh/qoh/assert@v0.1.1/src/index.ts";
import { parseUrl } from "../src/parse";
import { InvalidConnectionStringError } from "../src/InvalidConnectionStringError";

export const unknownSchema = throws(
	InvalidConnectionStringError, "Unknown schema",
	() => { parseUrl("unknown:spitfire"); });

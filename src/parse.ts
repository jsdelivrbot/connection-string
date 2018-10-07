import { InvalidConnectionStringError } from "./InvalidConnectionStringError";
import { parsePostgresqlUrl } from "./postgresql/parse";

const parsersBySchema = new Map([
	["postgres", parsePostgresqlUrl],
	["postgresql", parsePostgresqlUrl],
]);

export function parseUrl(uri: string) {
	const schemaSeparatorIndex = uri.indexOf(":");

	if (schemaSeparatorIndex === -1) {
		throw new InvalidConnectionStringError("No schema separator");
	}

	const schema = uri.substring(0, schemaSeparatorIndex);
	const parser = parsersBySchema.get(schema);

	if (parser === undefined) {
		throw new InvalidConnectionStringError("Unknown schema");
	}

	return parser(uri);
}

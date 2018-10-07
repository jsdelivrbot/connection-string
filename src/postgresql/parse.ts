import { InvalidConnectionStringError } from "../InvalidConnectionStringError";
import { PostgresqlConnectionParameters } from "./PostgresqlConnectionParameters";

const ip6Re = /^\[([^\]]*)\]$/;

const prefixRe = /postgres(?:ql)?:\/\//;
const authRe = /(?:(?<user>[^\:@\/\?]*)(?:\:(?<password>[^@\/\?]*))?@)?/;
const targetsRe = /(?<targets>[^\/\?]*)/;
const dbnameRe = /(?:\/(?<dbname>[^\?]*))?/;
const optionsRe = /(?:\?(?<options>.*))?/;

const postgresqlUriRe = new RegExp("^"
	+ prefixRe.source + authRe.source + targetsRe.source + dbnameRe.source
	+ optionsRe.source + "$");

const targetRe = /(?<host>(?:\[[^\]]*\])|(?:[^:]+))?(?::(?<port>\d+))?/;
const optionRe = /^(?<key>[^=]*)=(?<value>.*)$/;

function parseOption(optionString: string): [string, string] {
	const match = optionString.match(optionRe);

	if (match === null) {
		throw new InvalidConnectionStringError("Invalid query string component");
	}

	return [
		decodeURIComponent(match.groups.key),
		decodeURIComponent(match.groups.value),
	];
}

function parseTarget(targetString: string) {
	const match = targetString.match(targetRe);

	if (match === null) {
		throw new InvalidConnectionStringError();
	}

	const host = match.groups.host !== undefined
		? decodeURIComponent(match.groups.host)
			.replace(ip6Re, (_, address) => address)
		: "";

	const port = match.groups.port !== undefined
		? decodeURIComponent(match.groups.port)
		: "";

	return { host, port };
}

function parseTargets(targetsString: string) {
	const targets = targetsString.split(",").map(parseTarget);

	return {
		host: targets.map(({ host }) => host).join(","),
		port: targets.map(({ port }) => port).join(","),
	};
}

function parseOptions(optionsString: string) {
	const options = {};

	if (optionsString === "") {
		return options;
	}

	for (let optionString of optionsString.split("&")) {
		const [key, value] = parseOption(optionString);
		options[key] = value;
	}

	return options;
}

function compose<A, B, C>(f: (b: B) => C, g: (a: A) => B): (a: A) => C {
	return function compose(a: A) {
		return f(g(a));
	};
}

function parsePostgresqlUrlBase(uri: string) {
	const match = uri.match(postgresqlUriRe);

	if (match === null) {
		throw new InvalidConnectionStringError();
	}

	const user = match.groups.user !== undefined
		? decodeURIComponent(match.groups.user)
		: undefined;

	const password = match.groups.password !== undefined
		? decodeURIComponent(match.groups.password)
		: undefined;

	const { host, port } = parseTargets(match.groups.targets);

	const dbname = match.groups.dbname !== undefined
		? decodeURIComponent(match.groups.dbname)
		: undefined;

	const options = match.groups.options !== undefined
		? parseOptions(match.groups.options)
		: {};

	return {
		user,
		password,
		host,
		port,
		dbname,
		...options,
	};
}

function mapPort(from: string) {
	if (from === "") {
		return 5432;
	}

	const port = parseInt(from, 10);

	if (!Number.isFinite(port)) {
		throw new InvalidConnectionStringError();
	}

	return port;
}

function applyPostgresqlParseTransforms(
	parse: { [key: string]: string },
): PostgresqlConnectionParameters {
	const user = get(parse, "user");
	const password = get(parse, "password");

	const hostOptions = get(parse, "host");
	const hostaddrOptions = get(parse, "hostaddr");
	const portOptions = get(parse, "port");

	const hosts = hostOptions.split(",");

	const hostaddrs = hostaddrOptions !== ""
		? hostaddrOptions.split(",")
		: [];

	const ports = portOptions.split(",").map(mapPort);

	if (ports.length !== hosts.length && ports.length !== 1) {
		throw new InvalidConnectionStringError("Number of ports must match number of hosts, or be 1");
	}

	if (hostaddrs.length !== hosts.length && hostaddrs.length !== 0) {
		throw new InvalidConnectionStringError("Number of hostaddrs must match number of hosts, or be 0");
	}

	const endpoints = [];

	for (const [index, host] of enumerate(hosts)) {
		const port = ports.length !== 1 ? ports[index] : ports[0];
		const hostaddr = hostaddrs.length !== 0 ? hostaddrs[index] : undefined;
		endpoints.push({ host, hostaddr, port });
	}

	let dbname = get(parse, "dbname");

	if (dbname === "") {
		dbname = user;
	}

	return {
		type: "postgresql",
		user,
		password,
		endpoints,
		dbname,
		options: exclude(parse, ["user", "password", "host", "port", "dbname"]),
	};
}

function get(target: { [key: string]: string }, key: string): string {
	return target[key] === undefined ? "" : target[key];
}

function* enumerate<T>(iterable: Iterable<T>): IterableIterator<[number, T]> {
	let index = 0;

	for (const value of iterable) {
		yield [index++, value];
	}
}

function exclude(object, keys) {
	const result = Object.create(Object.getPrototypeOf(object));

	for (const [key, value] of Object.entries(object)) {
		if (!keys.includes(key)) {
			result[key] = value;
		}
	}

	return result;
}

export const parsePostgresqlUrl = compose(
	applyPostgresqlParseTransforms,
	parsePostgresqlUrlBase,
);

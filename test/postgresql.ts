import { assertEquals } from "https://cdn.rawgit.com/qoh/assert/v0.1.1/src/index.ts";
import { parseUrl } from "../src/parse";

const defaultPort = 5432
const defaultEndpoint = { host: "", port: defaultPort };
const defaultEndpoints = [defaultEndpoint];
const base = {
	type: "postgresql",
	user: "",
	password: "",
	endpoints: defaultEndpoints,
	dbname: "",
	options: {},
};

// TODO: Failing tests?
// TODO: Test hostaddr

function test(uri, result) {
	return () => assertEquals(parseUrl(uri), result);
}

export const prefix = {
	postgresql: test("postgresql://", base),
	postgres: test("postgres://", base),
};

export const auth = {
	weird: test("postgresql://@", { ...base, user: "", dbname: "" }),
	userWithoutHost: test("postgresql://chance@", {
		...base,
		user: "chance",
		dbname: "chance",
	}),
	userPasswordWithoutHost: test("postgresql://chance:$!3@", {
		...base,
		user: "chance",
		password: "$!3",
		dbname: "chance",
	}),
	userPasswordWithHost: test("postgresql://chance:$!3@echo", {
		...base,
		user: "chance",
		password: "$!3",
		endpoints: [{ host: "echo", port: defaultPort }],
		dbname: "chance",
	}),
};

export const endpoint = {
	hostOnly: test("postgresql://host.net",
		{ ...base, endpoints: [{ host: "host.net", port: defaultPort }] }),
	hostWithPort: test("postgresql://host.net:65000",
		{ ...base, endpoints: [{ host: "host.net", port: 65000 }] }),
	ip4: test("postgresql://127.0.0.1:12345",
		{ ...base, endpoints: [{ host: "127.0.0.1", port: 12345 }] }),
	ip6: test("postgresql://[::1]:12345",
		{ ...base, endpoints: [{ host: "::1", port: 12345 }] }),
	multipleHostsWithPorts: test("postgresql://a,x:123,,c,:5", {
		...base,
		endpoints: [
			{ host: "a", port: defaultPort },
			{ host: "x", port: 123 },
			{ host: "", port: defaultPort },
			{ host: "c", port: defaultPort },
			{ host: "", port: 5 },
		],
	}),
};

export const dbname = {
	defaultToUser: test("postgresql://user@",
		{ ...base, user: "user", dbname: "user", }),
	defaultToUserWithSlash: test("postgresql://user@/",
		{ ...base, user: "user", dbname: "user" }),
	withoutPrefix: test("postgresql:///foo", { ...base, dbname: "foo" }),
	withPrefix: test("postgresql://user@/foo",
		{ ...base, user: "user", dbname: "foo" }),
};

export const query = {
	zero: test("postgresql://?", base),
	one: test("postgresql://?bumble=sugar", {
		...base,
		options: { bumble: "sugar" },
	}),
	two: test("postgresql://?bumble=sugar&austin=alice", {
		...base,
		options: { bumble: "sugar", austin: "alice" },
	}),
	three: test("postgresql://?bumble=sugar&austin=alice&and=more", {
		...base,
		options: { bumble: "sugar", austin: "alice", and: "more" },
	}),
	encoded: test("postgresql://?gift%20cards=log%20in", {
		...base,
		options: { "gift cards": "log in" },
	}),
};

export const override = {
	userAndPassword: test("postgresql://a:b@?user=c&password=d", {
		...base,
		user: "c",
		password: "d",
		dbname: "c",
	}),
	hostAndPort: test(
		"postgresql://mary:5,twitch:6?host=sofia,snowball&port=7,8",
		{
			...base,
			endpoints: [
				{ host: "sofia", port: 7 },
				{ host: "snowball", port: 8 },
			],
		},
	),
	dbname: test("postgresql:///lily?dbname=gala",
		{ ...base, dbname: "gala" }),
};

export const mix = {
	all: test(
		"postgresql://duke:perry@lana:123,razor:456/david" +
		"?glyph=crackers&bruiser=flint&kelvin=crash",
		{
			...base,
			user: "duke",
			password: "perry",
			endpoints: [
				{ host: "lana", port: 123 },
				{ host: "razor", port: 456 },
			],
			dbname: "david",
			options: {
				glyph: "crackers",
				bruiser: "flint",
				kelvin: "crash",
			},
		},
	),
};

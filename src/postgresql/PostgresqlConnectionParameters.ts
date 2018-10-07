export interface PostgresqlConnectionParameters {
	type: "postgresql";

	/**
	 * PostgreSQL user name to connect as. Defaults to be the same as the
	 * operating system name of the user running the application.
	 */
	user: string;

	/** Password to be used if the server demands password authentication. */
	password: string;

	endpoints: PostgresqlConnectionParametersEndpoint[];

	/**
	 * The database name. Defaults to be the same as the user name. In certain
	 * contexts, the value is checked for extended formats; see Section 33.1.1
	 * for more details on those.
	 */
	dbname: string;

	options: PostgresqlConnectionParametersOptions;
}

export interface PostgresqlConnectionParametersEndpoint {
	host: string;
	hostaddr: string;
	port: number;
}

// TODO: See https://www.postgresql.org/docs/10/static/libpq-connect.html#LIBPQ-PARAMKEYWORDS
export interface PostgresqlConnectionParametersOptions {
	[key: string]: string | undefined;
}

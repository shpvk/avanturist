export function parseAllowedOrigins(value: string): string[] {
	const origins = value
		.split(',')
		.map(origin => origin.trim())
		.filter(origin => origin.length > 0)

	if (origins.length === 0) {
		throw new Error(
			`Could not read any origin from "${value}".`
		)
	}

	return origins
}

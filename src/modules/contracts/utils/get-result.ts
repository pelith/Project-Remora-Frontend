export function getResult<T>(
	data?: { result?: T },
	defaultValue?: T,
): T | undefined {
	if (!data) return defaultValue;
	return data.result;
}

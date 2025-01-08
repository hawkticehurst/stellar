export function coerce(value: string | number | null | undefined) {
	if (value === null || value === undefined) return;
	// This doesn't differentiate between NaN and Infinity
	// TODO: Need more robust check?
	if (typeof value === 'number') return value;
	if (value === 'false' || value === 'true') return value === 'true';
	if (!isNaN(Number(value))) return Number(value);
	try {
		const correctedValue = value.replace(/'/g, '"');
		const parsed = JSON.parse(correctedValue);
		if (Array.isArray(parsed)) return parsed;
		if (typeof parsed === 'object') return parsed;
	} catch (e) {
		// Not valid JSON, return the original value
	}
	return value;
}

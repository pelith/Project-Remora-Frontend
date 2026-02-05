export function shortenTxId(address: string, chars = 6): string {
	return `${address.substring(0, chars + 2)}...${address.substring(64 - chars)}`;
}

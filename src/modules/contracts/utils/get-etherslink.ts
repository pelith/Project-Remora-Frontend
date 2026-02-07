import { mainnet, sepolia } from 'wagmi/chains';
export function getEtherscanLink(
	chainId: number,
	data: string,
	type: 'transaction' | 'token' | 'address',
): string {
	const prefix =
		chainId === mainnet.id
			? mainnet.blockExplorers.default.url
			: chainId === sepolia.id
				? sepolia.blockExplorers.default.url
				: mainnet.blockExplorers.default.url;

	switch (type) {
		case 'transaction': {
			return `${prefix}/tx/${data}`;
		}
		case 'token': {
			return `${prefix}/token/${data}`;
		}
		default: {
			return `${prefix}/address/${data}`;
		}
	}
}

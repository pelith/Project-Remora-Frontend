import type { PublicClient } from 'viem';
import { isAddress } from 'viem';

const CHAINLINK_AGGREGATOR_ABI = [
	{
		type: 'function',
		name: 'decimals',
		stateMutability: 'view',
		inputs: [],
		outputs: [{ name: '', type: 'uint8' }],
	},
	{
		type: 'function',
		name: 'latestRoundData',
		stateMutability: 'view',
		inputs: [],
		outputs: [
			{ name: 'roundId', type: 'uint80' },
			{ name: 'answer', type: 'int256' },
			{ name: 'startedAt', type: 'uint256' },
			{ name: 'updatedAt', type: 'uint256' },
			{ name: 'answeredInRound', type: 'uint80' },
		],
	},
] as const;

const MAINNET_PRICE_FEEDS: Record<string, `0x${string}`> = {
	// Symbol mapping
	eth: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
	usdc: '0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6',
	usdt: '0x3E7d1eAB13ad0104d2750B8863b489D65364e32D',
	wbtc: '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c',
	dai: '0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9',
	// Address mapping
	'0x0000000000000000000000000000000000000000':
		'0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419', // native ETH
	'0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48':
		'0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6',
	'0xdac17f958d2ee523a2206206994597c13d831ec7':
		'0x3E7d1eAB13ad0104d2750B8863b489D65364e32D',
	'0x2260fac5e5542a773aa44fbcfedf7c193bc2c599':
		'0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c',
	'0x6b175474e89094c44da98b954eedeac495271d0f':
		'0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9',
};

export interface TokenPriceRequest {
	id: string;
	vsCurrency?: 'usd';
}

export interface TokenPriceResponse {
	id: string;
	vsCurrency: string;
	price: number;
	raw: {
		decimals: number;
		answer: bigint;
		updatedAt: number;
	};
}

function resolveFeedAddress(id: string): `0x${string}` | null {
	const key = id.trim().toLowerCase();
	if (!key) return null;
	if (isAddress(key)) {
		return MAINNET_PRICE_FEEDS[key] ?? null;
	}
	return MAINNET_PRICE_FEEDS[key] ?? null;
}

export async function fetchTokenPrice(
	publicClient: PublicClient,
	request: TokenPriceRequest,
): Promise<TokenPriceResponse> {
	const { id, vsCurrency = 'usd' } = request;

	if (vsCurrency !== 'usd') {
		throw new Error('Oracle price only supports USD feeds on mainnet.');
	}

	const feedAddress = resolveFeedAddress(id);
	if (!feedAddress) {
		throw new Error(`No mainnet oracle price feed configured for "${id}".`);
	}

	const chainId = publicClient.chain?.id;
	if (chainId && chainId !== 1) {
		throw new Error('Oracle price lookup requires Ethereum mainnet.');
	}

	const [decimals, roundData] = await Promise.all([
		publicClient.readContract({
			address: feedAddress,
			abi: CHAINLINK_AGGREGATOR_ABI,
			functionName: 'decimals',
		}),
		publicClient.readContract({
			address: feedAddress,
			abi: CHAINLINK_AGGREGATOR_ABI,
			functionName: 'latestRoundData',
		}),
	]);

	const answer = roundData[1];
	const updatedAt = Number(roundData[3]);

	if (answer <= 0n) {
		throw new Error('Oracle returned invalid price.');
	}

	const divisor = 10 ** Number(decimals);
	const price = Number(answer) / divisor;

	return {
		id,
		vsCurrency,
		price,
		raw: {
			decimals: Number(decimals),
			answer,
			updatedAt,
		},
	};
}

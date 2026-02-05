import { type Address, encodeAbiParameters, keccak256 } from 'viem';

/**
 * PoolKey structure for Uniswap V4
 */
export interface PoolKey {
	currency0: Address;
	currency1: Address;
	fee: number; // uint24
	tickSpacing: number; // int24
	hooks: Address;
}

/**
 * Compute PoolId from PoolKey
 * @param poolKey The pool key containing currency0, currency1, fee, tickSpacing, and hooks
 * @returns The PoolId as a bytes32 (hex string)
 *
 * @example
 * ```ts
 * const poolId = computePoolId({
 *   currency0: '0x...',
 *   currency1: '0x...',
 *   fee: 3000,
 *   tickSpacing: 60,
 *   hooks: '0x0000000000000000000000000000000000000000'
 * })
 * ```
 */
export function computePoolId(poolKey: PoolKey): `0x${string}` {
	// ABI encoding for PoolKey struct:
	// - currency0: address (Currency type is address in ABI)
	// - currency1: address
	// - fee: uint24
	// - tickSpacing: int24
	// - hooks: address
	const encoded = encodeAbiParameters(
		[
			{ name: 'currency0', type: 'address' },
			{ name: 'currency1', type: 'address' },
			{ name: 'fee', type: 'uint24' },
			{ name: 'tickSpacing', type: 'int24' },
			{ name: 'hooks', type: 'address' },
		],
		[
			poolKey.currency0,
			poolKey.currency1,
			poolKey.fee,
			poolKey.tickSpacing,
			poolKey.hooks,
		],
	);

	// PoolId is keccak256(abi.encode(poolKey))
	return keccak256(encoded);
}

/**
 * Compute PoolId from individual parameters
 * @param currency0 The first currency address (lower address, sorted)
 * @param currency1 The second currency address (higher address, sorted)
 * @param fee The pool fee (uint24, e.g., 3000 for 0.3%)
 * @param tickSpacing The tick spacing (int24, e.g., 60)
 * @param hooks The hooks contract address (use zero address for no hooks)
 * @returns The PoolId as a bytes32 (hex string)
 */
export function computePoolIdFromParams(
	currency0: Address,
	currency1: Address,
	fee: number,
	tickSpacing: number,
	hooks: Address,
): `0x${string}` {
	return computePoolId({
		currency0,
		currency1,
		fee,
		tickSpacing,
		hooks,
	});
}

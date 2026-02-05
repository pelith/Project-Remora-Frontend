import { V4_AGENTIC_VAULT_ABI } from '../constants/v4-agentic-vault-abi';
import useAppWriteContract from './use-app-write-contract';

export function useVaultWithdraw(vaultAddress: string) {
	const { mutateAsync, ...result } = useAppWriteContract();
	return {
		...result,
		withdraw(args: { currency: string; amountRaw: bigint; to: string }) {
			return mutateAsync({
				address: vaultAddress as `0x${string}`,
				abi: V4_AGENTIC_VAULT_ABI,
				functionName: 'withdraw',
				args: [
					args.currency as `0x${string}`,
					args.amountRaw,
					args.to as `0x${string}`,
				],
			});
		},
	};
}

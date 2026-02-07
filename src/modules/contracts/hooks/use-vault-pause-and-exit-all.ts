import { addMinutes, getUnixTime } from 'date-fns';
import { V4_AGENTIC_VAULT_ABI } from '../constants/v4-agentic-vault-abi';
import useAppWriteContract from './use-app-write-contract';

const pendingMinutes = 10; // 10 minutes
export function useVaultPauseAndExitAll(vaultAddress: string) {
	const { mutateAsync, ...result } = useAppWriteContract();
	return {
		...result,
		exitAll() {
			const deadline = BigInt(
				getUnixTime(addMinutes(new Date(), pendingMinutes)),
			);
			return mutateAsync({
				address: vaultAddress as `0x${string}`,
				abi: V4_AGENTIC_VAULT_ABI,
				functionName: 'pauseAndExitAll',
				args: [deadline],
			});
		},
	};
}

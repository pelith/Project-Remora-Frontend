import { createStore, Provider } from 'jotai';

export const atomStore = createStore();

export function AtomStoreProvider({ children }: { children: React.ReactNode }) {
	return <Provider store={atomStore}>{children}</Provider>;
}

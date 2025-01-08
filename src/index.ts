import { Stellar } from "./stellar.js";
import type { SignalElement } from "./signal.js";
import { isCustomElement } from "./utils/helpers.js";

export function component(elemName: string, functions: any[]) {
	customElements.define(elemName, class extends Stellar {
		onMount?(): void;
		onDestroy?(): void;
		constructor() {
			super();
			for (const fn of functions) {
				const fnName = fn.name;
				if (fnName) {
					(this as any)[fnName] = fn;
				}
			}
		}
		connectedCallback() {
			// Call method onMount if it exists
			if (this.onMount) {
				this.onMount();
			}
		}
		disconnectedCallback() {
			if (this.onDestroy) {
				this.onDestroy();
			}
		}
	});
}

export function signal<T>(query: string): SignalElement<T> {
	const [elem, signalName] = query.split(" ");
	if (isCustomElement(elem)) {
		const name = signalName ? signalName : "x-signal";
		const node = document.querySelector(`${elem} ${name}`);
		if (node && node.tagName === "X-SIGNAL") {
			return node as SignalElement<T>;
		} else {
			throw new Error(`HTML signal ${name} does not exist in the ${elem} Stellar component`);
		}
	} else {
		throw new Error(`Invalid Stellar component name: ${elem}`);
	}
}
import { Stellar } from "./stellar.js";
import { SignalElement } from "./signal.js";
import { isCustomElement } from "./utils/helpers.js";

export function component(name: string, methods?: ((event: Event, ...args: any[]) => unknown)[]) {
	customElements.define(name, class extends Stellar {
		onMount?(): void;
		onDestroy?(): void;
		constructor() {
			super();
			if (methods) {
				for (const fn of methods) {
					const fnName = fn.name;
					if (fnName) {
						(this as any)[fnName] = fn;
					}
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

export function signal<T>(query: string, options?: {
	castSignal?: (state: string | number) => T;
}): SignalElement<T> {
	const [elem, signalName] = query.split(" ");
	if (isCustomElement(elem)) {
		const name = signalName ? signalName : "x-signal";
		const node = document.querySelector(`${elem} ${name}`);
		if (node && node.tagName === "X-SIGNAL") {
			if (!customElements.get("x-signal")) {
				customElements.define("x-signal", SignalElement);
			}
			if (options && options.castSignal) {
				// TODO: Implement coerce overrides in SignalElement
			}
			return node as SignalElement<T>;
		} else {
			throw new Error(`HTML signal ${name} does not exist in the ${elem} Stellar component`);
		}
	} else {
		throw new Error(`Invalid Stellar component name: ${elem}`);
	}
}
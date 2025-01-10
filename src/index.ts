import { Stellar } from "./stellar.js";
import { SignalElement } from "./signal.js";
import { isCustomElement } from "./utils/helpers.js";

export function component(name: string, methods?: ((event: Event, ...args: any[]) => unknown)[], attributes?: string[]) {
	customElements.define(name, class extends Stellar {
		onCreate?(): void;
		onMount?(): void;
		onDestroy?(): void;
		onAttributeChange?(attribute: any, previousValue: any, currentValue: any): void;
		onAdopted?(): void;
		static observedAttributes = attributes ? attributes : [];
		constructor() {
			super();
			if (this.onCreate) {
				this.onCreate();
			}
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
			if (this.onMount) {
				this.onMount();
			}
		}
		disconnectedCallback() {
			if (this.onDestroy) {
				this.onDestroy();
			}
		}
		attributeChangedCallback(attribute: any, previousValue: any, currentValue: any) {
			if (this.onAttributeChange) {
				this.onAttributeChange(attribute, previousValue, currentValue);
			}
		}
		adoptedCallback() {
			if (this.onAdopted) {
				this.onAdopted();
			}
		}
	});
}

export function signal<T>(query: string, options?: {
	type?: (state: string | number) => T;
}): SignalElement<T> {
	const [elem, signalName] = query.split(" ");
	if (isCustomElement(elem)) {
		const name = signalName ? signalName : "x-signal";
		const node = document.querySelector(`${elem} ${name}`);
		if (node && node.tagName === "X-SIGNAL") {
			if (!customElements.get("x-signal")) {
				customElements.define("x-signal", SignalElement);
			}
			if (options && options.type) {
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

export function portableComponent(name: string, render: () => string, methods?: ((event: Event, ...args: any[]) => unknown)[], attributes?: string[]) {
	return class extends Stellar {
		static tagName = name;
		static observedAttributes = attributes ? attributes : [];
		static define() {
			if (customElements.get(this.tagName)) return;
			customElements.define(this.tagName, this);
		}
		onCreate?(): void;
		onMount?(): void;
		onDestroy?(): void;
		onAttributeChange?(attribute: any, previousValue: any, currentValue: any): void;
		onAdopted?(): void;
		constructor() {
			super(render);
			if (methods) {
				for (const fn of methods) {
					const fnName = fn.name;
					if (fnName) {
						(this as any)[fnName] = fn.bind(this);
					}
				}
			}
			if (this.onCreate) {
				this.onCreate();
			}
		}
		connectedCallback() {
			if (this.onMount) {
				this.onMount();
			}
		}
		disconnectedCallback() {
			if (this.onDestroy) {
				this.onDestroy();
			}
		}
		attributeChangedCallback(attribute: any, previousValue: any, currentValue: any) {
			if (this.onAttributeChange) {
				this.onAttributeChange(attribute, previousValue, currentValue);
			}
		}
		adoptedCallback() {
			if (this.onAdopted) {
				this.onAdopted();
			}
		}
	};
}

export function html(strings: TemplateStringsArray, ...values: any[]): string {
  const parts = [strings[0]];
  for (let i = 0; i < values.length; i++) {
    if (Array.isArray(values[i])) {
      for (const value of values[i]) {
        parts.push(String(value));
      }
    } else {
      parts.push(String(values[i]));
    }
    parts.push(strings[i + 1]);
  }
  return parts.join('');
}

export const css = html;
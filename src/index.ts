import { Stellar } from "./stellar.js";
import { SignalElement } from "./signal.js";
import { isCustomElement } from "./utils/helpers.js";
import { effect } from "./utils/effect.js";

export { effect };

export function $component(
	name: string, 
	options?: { 
		methods?: ((event: Event, ...args: any[]) => unknown)[], 
		attributes?: string[], 
		portable?: boolean 
		render?: () => string, 
	}) {
	if (!customElements.get("x-signal")) {
		customElements.define("x-signal", SignalElement);
	}
	const component = class extends Stellar {
		static tagName = name;
		static observedAttributes = options?.attributes ? options.attributes : [];
		static define() {
			if (customElements.get(this.tagName)) return;
			customElements.define(this.tagName, this);
		}
		onCreate?(): void;
		onConnected?(): void;
		onDisconnected?(): void;
		onAttributeChange?(attribute: any, previousValue: any, currentValue: any): void;
		onAdopted?(): void;
		constructor() {
			super(options?.render ? options.render : undefined);
			if (options?.methods) {
				for (const fn of options.methods) {
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
			if (this.onConnected) {
				this.onConnected();
			}
		}
		disconnectedCallback() {
			if (this.onDisconnected) {
				this.onDisconnected();
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
	
	if (options?.portable) {
		return component;
	} else {
		component.define();
	}
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

export function html(strings: TemplateStringsArray, ...values: any[]): string {
  const parts = [strings[0]];
	
  for (let i = 0; i < values.length; i++) {
    if (Array.isArray(values[i])) {
      for (const value of values[i]) {
        parts.push(String(value));
      }
    } else if (typeof values[i] === 'object') {
			const parsed = JSON.stringify(values[i]);
			const escapedSpaces = parsed.replace(/ /g, "&nbsp;");
			parts.push(escapedSpaces);
		} else if (typeof values[i] === 'function') {
			// console.log("fn");
		} else {
      parts.push(String(values[i]));
    }
    parts.push(strings[i + 1]);
  }
  return parts.join('');
}

export const css = html;

export function $template(markup: string): HTMLTemplateElement {
	const template = document.createElement('template');
	template.innerHTML = markup;
	return template;
}

export function render(component: any, root: HTMLElement) {
  document.addEventListener('DOMContentLoaded', () => {
    root.innerHTML = '';
    const element = component();
    if (Array.isArray(element)) {
      element.forEach(child => {
        root.appendChild(
          child
        );
      });
    } else {
      root.appendChild(
        element
      );
    }
  });
}
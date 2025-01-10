import { eventModifiers, systemModifiers, keyModifiers } from "./utils/modifiers.js";
import type { EventModifier } from "./utils/modifiers.js";
import { isCustomElement, removeAttribute } from "./utils/helpers.js";

export class Stellar extends HTMLElement {
	#tracked: { elem: HTMLElement; event: string; modifiers: string[]; options: EventModifier; fn: EventListener }[];
	constructor(render?: () => string) {
		super();
		// If portable component, immediately set inner HTML
		if (render) {
			this.setHTMLUnsafe(render());
		}
		this.#tracked = [];
		let node;
		const changes: (() => void)[] = [];
		const nestedCustomElements: HTMLElement[] = [];
		const filter = (node: Node) => {
			// Reject any node that is not an HTML element
			if (!(node instanceof HTMLElement)) {
				return NodeFilter.FILTER_REJECT;
			}
			// Check if node is a nested custom element
			if (isCustomElement(node.tagName) && node.tagName !== this.tagName && node.tagName !== "X-SIGNAL") {        
				nestedCustomElements.push(node);
				return NodeFilter.FILTER_REJECT;
			}
			// Check if node is a child of a nested custom element
			for (const nested of nestedCustomElements) {
				if (nested.contains(node)) {
					return NodeFilter.FILTER_REJECT;
				}
			}
			return NodeFilter.FILTER_ACCEPT;
		};
		const iterator = document.createNodeIterator(
			this,
			NodeFilter.SHOW_ELEMENT,
			{ acceptNode: filter }
		);
		while ((node = iterator.nextNode())) {
			if (!node || !(node instanceof HTMLElement)) return;
			for (const attr of node.attributes) {
				if (attr.name.startsWith('@')) {
					changes.push(() => this.#setEventHandler(attr));
				}
			}
		}
		for (const change of changes) {
			change();
		}
		// Attach event listeners
		for (const { elem, event, modifiers, options, fn } of this.#tracked) {
			if (modifiers.length > 0) {
				if (event === 'keydown' || event === 'keyup') {
					elem?.addEventListener(event, (e) => {
						// TODO: Does the order of these options matter?
						if (options.prevent) {
							e.preventDefault();
						}
						if (options.stop) {
							e.stopPropagation();
						}
						if (options.self && e.target !== elem) {
							return;
						}
						if (e instanceof KeyboardEvent) {
							for (const modifier of modifiers) {
								if (e.key === modifier) {
									fn.bind(this)(e);
								}
							}
						}
					}, {
						capture: options.capture,
						once: options.once,
						passive: options.passive
					});
				}
			} else {
				elem?.addEventListener(event, (e) => {
					// TODO: Does the order of these options matter?
					if (options.prevent) {
						e.preventDefault();
					}
					if (options.stop) {
						e.stopPropagation();
					}
					if (options.self && e.target !== elem) {
						return;
					}
					fn.bind(this)(e);
				}, {
					capture: options.capture,
					once: options.once,
					passive: options.passive
				});
			}
		}
	}
	#setEventHandler(attr: Attr) {
		const elem = attr.ownerElement as HTMLElement;
		const { name: event, value: method } = attr;
		let eventName = event.slice(1);
		const modifiers: string[] = [];
		const options: { [key: string]: boolean } = {};
		// Handle event modifiers
		if (event.includes('.')) {
			const parts = event.split('.');
			eventName = parts[0].slice(1);
			parts.slice(1).forEach(mod => {
				if (mod in keyModifiers) {
					modifiers.push(keyModifiers[mod as keyof typeof keyModifiers]);
				} else if (mod in systemModifiers) {
					modifiers.push(systemModifiers[mod as keyof typeof systemModifiers]);
				} else if (eventModifiers.includes(mod)) {
					options[mod] = true;
				} else {
					throw new Error(`Invalid Stellar event modifier: ${mod}`);
				}
			});
		}
		this.#tracked.push({
			elem: elem,
			event: eventName,
			modifiers: modifiers,
			options: options,
			fn: (e: Event) => (this as any)[method](e),
		});
		// Remove non-standard attributes from elements after processing
		removeAttribute(elem, attr);
	}
}

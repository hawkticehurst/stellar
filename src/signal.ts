import { Signal } from 'signal-polyfill';
import { effect } from './utils/effect.js';
import { coerce } from './utils/coerce.js';

type Bound = {
	text?: HTMLElement[];
	value?: HTMLElement[];
	checked?: HTMLInputElement[];
	files?: HTMLInputElement[];
	audio?: HTMLElement[];
	video?: HTMLElement[];
	img?: HTMLElement[];
	details?: HTMLElement[];
	this?: HTMLElement[];
}

export class SignalElement<T> extends HTMLElement {
	signal: Signal.State<T> | Signal.Computed<T>;
	isHTML: boolean;
	trackedProperty: string | null;
	trackedChild: HTMLElement | null;
	stateAttr: string | null;
	boundElements: Bound;
	hasLocalStorage: boolean;
	mutation: (state: T) => unknown;
	cleanup: () => void;

	constructor() {
		super();

		this.isHTML = this.getAttribute('render') === 'html';
		this.trackedProperty = this.getAttribute('track');
		if (this.trackedProperty) {
			const child = this.children[0];
			if (child instanceof HTMLElement) {
				this.trackedChild = child;
			}
		}
		this.stateAttr = this.getAttribute('state');
		this.mutation = (state) => state;
		this.hasLocalStorage = this.getAttribute('local') !== null;

		// Check for elements bound to this signal
		this.boundElements = getBoundElements(`#${this.id}`);

		// NOTE: There is no event to track when the text content of an element changes
		// therefore, we cannot bind to text content changes. Plus if you're binding the
		// value of this signal to the text content of an element, you're effectively just
		// reflecting the value of the signal to the element. The chances of that element's
		// text content changing without the signal's value changing is slim to none.
				
		// Bind element value to this signal
		if (this.boundElements.value) {
			for (const bound of this.boundElements.value) {
				if (!(bound instanceof HTMLInputElement)) {
					// TODO: Fix this error message (i.e. typeof bound)
					throw new Error(`Cannot bind value property to ${typeof bound}`)
				}
				bound.addEventListener('input', () => {
					this.state = coerce(bound.value) as unknown as T;
				});
			}
		}

		let initial;
		if (this.trackedProperty === 'value') {
			if (!(this.trackedChild instanceof HTMLInputElement)) {
				throw new Error('Cannot track reactive value property on non-input element.');
			}
			initial = coerce(this.trackedChild.value);
			this.trackedChild.addEventListener('input', () => {
				const child = this.trackedChild;
				if (child && child instanceof HTMLInputElement) {
					this.state = coerce(child.value) as unknown as T;
				}
			});
		} else if (this.stateAttr) {
			// Always prefer using the `state` attribute if it exists
			initial = coerce(this.stateAttr);
		} else if (this.isHTML) {
			// Use HTML content if `isHTML` flag is set
			initial = this.getHTML();
		} else {
			// Default to initializing with text content
			const content = this.textContent;
			initial = coerce(content);
		}

		// Attempt to override initial value if local storage flag is set
		if (this.hasLocalStorage) {
			const item = this.getAttribute('local');
			if (item) {
				const value = localStorage.getItem(item);
				if (value) {
					initial = coerce(value);
				}
			}
		}

		// Initialize signal
		this.signal = new Signal.State(initial);
		this.cleanup = effect(() => this.#render());
	}
	connectedCallback() {
		this.#render();
	}
	disconnectedCallback() {
		// Cleanup effect
		this.cleanup();

		// Remove tracked properties
		if (this.trackedProperty === 'value') {
			if (this.trackedChild instanceof HTMLInputElement) {
				this.trackedChild.removeEventListener('input', () => {
					const child = this.trackedChild;
					if (child && child instanceof HTMLInputElement) {
						this.state = coerce(child.value) as unknown as T;
					}
				});
			}
		}
		
		// Unbind element values from this signal
		if (this.boundElements.value) {
			for (const bound of this.boundElements.value) {
				if (bound instanceof HTMLInputElement) {
					bound.removeEventListener('input', () => {
						this.state = coerce(bound.value) as unknown as T;
					});
				}
			}
		}
	}
	#render() {
		if (this.signal) {
			const value = this.mutation(this.signal.get());
			if (this.trackedProperty === 'value' && this.trackedChild instanceof HTMLInputElement) {
				this.trackedChild.value = `${value}`;
			} else if (this.isHTML) {
				this.setHTMLUnsafe(`${value}`);
			} else {
				this.textContent = `${value}`;
			}
		}
	}
	get state() {
		return this.signal.get();
	}
	set state(v: T) { 
		if (!(this.signal instanceof Signal.State)) {
			throw new Error('Cannot set value on a computed signal.');
		}

		// Update the signal
		this.signal.set(v);

		// Update local storage if flag is set
		if (this.hasLocalStorage) {
			const item = this.getAttribute('local');
			if (!item) {
				return;
			}
			if (Array.isArray(v) || typeof v === 'object') {
				localStorage.setItem(item, JSON.stringify(v));
				return;
			}
			localStorage.setItem(item, `${v}`);
		}

		// Update bound elements
		if (this.boundElements.text) {
			for (const bound of this.boundElements.text) {
				bound.textContent = `${v}`;
			}
		}
		if (this.boundElements.value) {
			for (const bound of this.boundElements.value) {
				if (bound instanceof HTMLInputElement) {
					bound.value = `${v}`;
				}
			}
		}
	}
	// Define a custom renderer for the state
	set render(callback: (state: T) => unknown) {
		this.mutation = callback;
		this.#render();
	}
	// Convert signal element to a computed signal
	set computed(callback: () => T) {
		this.cleanup();
		this.signal = new Signal.Computed<T>(callback);
		this.cleanup = effect(() => this.#render());
	}
	// Use an external store
	set store(signal: Signal.State<T>) {
		this.cleanup();
		this.signal = signal;
		this.cleanup = effect(() => this.#render());
	}
}

function getBoundElements(id: string) {
	const bound: Bound = {};
	let elements = document.querySelectorAll(`[bind="${id}"]`);
	for (const element of elements) {
		if (element instanceof HTMLElement) {
			if (!bound.text) {
				bound.text = [];
			}
			bound.text.push(element);
		}
	}
	elements = document.querySelectorAll(`[bind\\:value="${id}"]`);
	for (const element of elements) {
		if (element instanceof HTMLInputElement) {
			if (!bound.value) {
				bound.value = [];
			}
			bound.value.push(element);
		}
	}
	// Get bound checkboxes and radios
	// elements = document.querySelectorAll(`input[type="checkbox"][bind\\:checked="${id}"], input[type="radio"][bind\\:checked="${id}"]`);
	// for (const element of elements) {
	// 	if (element instanceof HTMLInputElement) {
	// 		bound.value.push(element);
	// 	}
	// }
	// Get bound file inputs
	// elements = document.querySelectorAll(`input[type="file"][bind\\:files="${id}"]`);
	// for (const element of elements) {
	// 	if (element instanceof HTMLInputElement) {
	// 		bound.value.push(element);
	// 	}
	// }
	return bound;
}
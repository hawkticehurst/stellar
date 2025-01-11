import { Signal } from 'signal-polyfill';
import { effect } from './utils/effect.js';
import { coerce } from './utils/coerce.js';

export class SignalElement<T> extends HTMLElement {
	signal: Signal.State<T> | Signal.Computed<T>;
	isBound: boolean;
	isLocalStorage: boolean;
	isHTML: boolean;
	stateAttr: string | null;
	targetId: string | null;
	targetElem: SignalElement<T> | null;
	boundElem: HTMLInputElement | HTMLButtonElement | HTMLOptionElement | HTMLMeterElement | HTMLProgressElement | null;
	mutation: (state: T) => unknown;
	cleanup: () => void;

	constructor() {
		super();
		this.isBound = this.getAttribute('bind:value') === "";
		this.isLocalStorage = this.getAttribute('local') !== null;
		this.isHTML = this.getAttribute('render') === 'html';
		this.stateAttr = this.getAttribute('state');
		this.mutation = (state) => state;
		if (this.isBound) {
			if (this.children.length !== 1) {
				throw new Error('Signal must contain a single child element when using bind directive.');
			}
			this.boundElem = this.children[0] as HTMLInputElement | HTMLButtonElement | HTMLOptionElement | HTMLMeterElement | HTMLProgressElement;
			this.boundElem.addEventListener('input', (e) => {
				this.state = this.boundElem?.value as unknown as T;
			});
			this.signal = new Signal.State(this.boundElem.value as unknown as T);
			this.cleanup = effect(() => this.#render());
		} else {
			let initial;
			if (this.stateAttr) {
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
			if (this.isLocalStorage) {
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
	}
	connectedCallback() {
		this.#render();
	}
	disconnectedCallback() {
		this.cleanup();
	}
	#render() {
		if (this.signal) {
			if (this.isBound) {
				if (this.boundElem) {
					this.boundElem.value = `${this.signal.get()}`;
				}
			} else {
				const value = this.mutation(this.signal.get());
				if (this.isHTML) {
					this.setHTMLUnsafe(`${value}`);
				} else {
					this.textContent = `${value}`;
				}
			}
		}
	}
	get state() {
		return this.signal.get();
	}
	set state(v: T) { 
		if (this.signal instanceof Signal.State) {
			this.signal.set(v);
			if (this.isLocalStorage) {
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
		} else {
			throw new Error('Cannot set value on a computed signal');
		}
	}
	// Define a custom renderer for the state
	set render(callback: (state: T) => unknown) {
		if (this.isBound) {
			throw new Error('Cannot set a custom renderer on a bound signal.');
		}
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

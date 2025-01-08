import { Signal } from 'signal-polyfill';
import { effect } from './utils/effect.js';
import { coerce } from './utils/coerce.js';

export class SignalElement<T> extends HTMLElement {
	signal: Signal.State<T> | Signal.Computed<T>;
	isBound: boolean;
	isHTML: boolean;
	stateAttr: string | null;
	targetId: string | null;
	targetElem: SignalElement<T> | null;
	boundElem: HTMLInputElement | HTMLButtonElement | HTMLOptionElement | HTMLMeterElement | HTMLProgressElement | null;
	mutation: (state: T) => unknown;
	cleanup: () => void;

	constructor() {
		super();
		this.isBound = this.getAttribute('bind:value') !== null;
		this.isHTML = this.getAttribute('render') === 'html';
		this.stateAttr = this.getAttribute('state');
		this.mutation = (state) => state;
		if (this.isBound) {
			this.targetId = this.getAttribute('bind:value');
			this.boundElem = this.children[0] as HTMLInputElement | HTMLButtonElement | HTMLOptionElement | HTMLMeterElement | HTMLProgressElement;
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
				if (content) {
					initial = coerce(content);
				}
			}
			// Initialize signal
			this.signal = new Signal.State(initial);
			this.cleanup = effect(() => this._render());
		}
	}
	connectedCallback() {
		if (this.isBound && this.targetId && this.boundElem) {
			this.targetElem = document.getElementById(this.targetId) as SignalElement<T>;
			if (!this.targetElem) {
				throw new Error(`Bind target element with id "${this.targetId}" not found.`);
			}
			this.boundElem.addEventListener('input', () => {
				if (this.targetElem && this.boundElem) {
					this.targetElem.state = coerce(this.boundElem.value);
				}
			});
		} else {
			this._render();
		}
	}
	disconnectedCallback() {
		if (this.isBound && this.boundElem) {
			this.boundElem.removeEventListener('input', () => {
				if (this.targetElem && this.boundElem) {
					this.targetElem.state = coerce(this.boundElem.value);
				}
			});
		} else {
			this.cleanup();
		}
	}
	private _render() {
		if (this.signal) {
			const value = this.mutation(this.signal.get());
			if (this.isHTML) {
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
		if (this.signal instanceof Signal.State) {
			this.signal.set(v);
		} else {
			throw new Error('Cannot set value on a computed signal');
		}
	}
	set render(callback: (state: T) => unknown) {
		this.mutation = callback;
		this._render();
	}
	set computed(callback: () => T) {
		this.cleanup();
		this.signal = new Signal.Computed<T>(callback);
		this.cleanup = effect(() => this._render());
	}
	set store(signal: Signal.State<T>) {
		this.cleanup();
		this.signal = signal;
		this.cleanup = effect(() => this._render());
	}
}

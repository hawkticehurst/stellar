import { Signal } from 'https://www.unpkg.com/signal-polyfill@0.2.1/dist/index.js';

let needsEnqueue = true;

const w = new Signal.subtle.Watcher(() => {
	if (needsEnqueue) {
		needsEnqueue = false;
		queueMicrotask(processPending);
	}
});

function processPending() {
	needsEnqueue = true;
	for (const s of w.getPending()) {
		s.get();
	}
	w.watch();
}

function effect(callback) {
	let cleanup;
	const computed = new Signal.Computed(() => {
		typeof cleanup === 'function' && cleanup();
		cleanup = callback();
	});
	w.watch(computed);
	computed.get();
	return () => {
		w.unwatch(computed);
		typeof cleanup === 'function' && cleanup();
		cleanup = undefined;
	};
}

function coerce(value) {
	if (value === null || value === undefined) return;
	if (value === 'false' || value === 'true') return value === 'true';
	if (!isNaN(Number(value))) return Number(value);
	try {
		const correctedValue = value.replace(/'/g, '"');
		const parsed = JSON.parse(correctedValue);
		if (Array.isArray(parsed)) return parsed;
		if (typeof parsed === 'object') return parsed;
	} catch (e) {
		// Not valid JSON, return the original value
	}
	return value;
}

class SignalElement extends HTMLElement {
	constructor() {
		super();
		this.isHTML = this.getAttribute('render') === 'html';
		this.mutation = (state) => state;
		const initial = this.isHTML
			? coerce(this.getAttribute('state')) || this.getHTML()
			: coerce(this.getAttribute('state')) || coerce(this.textContent);
		this.signal = new Signal.State(initial);
		this.cleanup = effect(() => this._render());
	}
	connectedCallback() {
		this._render();
	}
	disconnectedCallback() {
		this.cleanup();
	}
	_render() {
		const value = this.mutation(this.signal.get());
		if (this.isHTML) {
			this.setHTMLUnsafe(value);
		} else {
			this.textContent = `${value}`;
		}
	}
	get state() {
		return this.signal.get();
	}
	set state(v) {
		this.signal.set(v);
	}
	set render(callback) {
		this.mutation = callback;
		this._render();
	}
	set computed(callback) {
		this.cleanup();
		this.signal = new Signal.Computed(callback);
		this.cleanup = effect(() => this._render());
	}
}

customElements.define('x-signal', SignalElement);

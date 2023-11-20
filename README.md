# Stellar

A stellar way to build custom elements.

<img src="./assets/banner.png" alt="Stellar logo" width="100%" height="auto" />

## Usage

```bash
npm install stellar-element@latest
```

## What is Stellar?

Stellar is a tiny web framework for building a specific flavor of custom elements with an initially proposed name of "HTML Web Components."

These custom elements do not use any of the other APIs you might find in the "web components" bucket, such as Shadow DOM or Templates. Instead, the core premise of “HTML Web Components” is to write plain HTML and then simply wrap the parts you want to be interactive using a custom element tag.

For example, while a "regular" web component might look something like this...

```html
<counter-button></counter-button>
```

...an HTML web component will look like this:

```html
<counter-button>
  <button>Clicked <span>0</span> times</button>
</counter-button>
```

In the "regular" web component, component markdown is dynamically generated at runtime (using templates and shadow DOM), while the HTML web component simply does the job of progressively enhancing/hydrating existing HTML in your document.

One of the big pain points with HTML web components is that the Custom Elements API used to build these components is fairly low-level and verbose. Stellar steps in, just like "regular" web components frameworks (such as Lit or FAST), to improve the ergonomics of building HTML web components.

This is achieved by adding a handful of custom attributes called directives that implement event handling and a reactivity model. With Stellar, implementing functionality to the above counter button looks like this:

```html
<counter-button>
  <button @click="increment">
    Clicked <span $state="count">0</span> times
  </button>
</counter-button>

<script type="module">
  import { Stellar } from 'stellar-element';
  class CounterButton extends Stellar {
    increment = () => this.count++;
  }
  customElements.define('counter-button', CounterButton);
</script>
```

## Philosophy / goals

Forthcoming...

## Docs

- [Event handling](./docs/event-handling.md)
- [Reactivity](./docs/reactivity.md)
- [Using Stellar and Astro](./docs/using-astro.md)

## License

This project is licensed under [MIT](./LICENSE). Feel free to use, remix, and adapt the code found this repo in your own projects.

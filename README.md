# Stellar

A stellar way to build custom elements.

<img src="./assets/banner.png" alt="Stellar logo" width="100%" height="auto" />

## Usage

```bash
npm install stellar-element@latest
```

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

## What is Stellar?

Todo...

## Philosophy / goals

Todo...

## Docs

- [Event handling](./docs/event-handling.md)
- [Reactivity](./docs/reactivity.md)
- [Using Stellar and Astro](./docs/using-astro.md)

## License

This project is licensed under [MIT](./LICENSE). Feel free to use, remix, and adapt the code found this repo in your own projects.

# Event handling

Todo: Intro...

## @_eventname_

Create and attach an event listener to an element.

### Syntax

```
@eventname="callback"
```

### Usage

Event directives are a concise way to declare event-based behavior in a Stellar component. An event directive is defined with an `@` symbol, followed by any event name, followed by the name of a method that will be called when the event is fired.

Both default browser events and custom events are accepted and callback methods must always be defined within the custom element class that you create.

In the example below, a `<button>` tag contains a click event directive. When the button is clicked the `hello` method defined in the `HelloMessage` class will be executed and trigger a browser alert with the text "Hello there!".

```html
<hello-message>
  <button @click="hello">Click for message</button>
</hello-message>

<script type="module">
  import { Stellar } from 'stellar-element';
  class HelloMessage extends Stellar {
    hello = () => {
      alert('Hello there!');
    };
  }
  customElements.define('hello-message', HelloMessage);
</script>
```

> [!IMPORTANT]  
> It is highly reccommended that callback methods are implemented using arrow function syntax.
>
> Stellar will automatically add and remove event listeners when a custom element is connected and disconnected from the DOM. While, regular method syntax works when adding event listeners, it will often break when removing event listeners due to improper binding of `this`.
>
> Correctly removing event listeners is extremely important when using features like the View Transition API to persist custom elements across different page transitions.

### Coming later: Event modifiers

At this time, there is _**no way**_ to modify event directives, such as configuring an event to run once. A future release should address this my implementing "event modifiers". The syntax will likely take inspiration from Vue and use a dot syntax to declare event modification. For example: `@click.once="callback"`.

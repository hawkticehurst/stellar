# Reactivity

Stellar, like many other web frameworks, ships a reactivity model that lets you declaratively define pieces of stateful UI.

Unlike other web frameworks, however, state is defined a little different than what you might have experienced when using tools like React, Svelte, or Vue. In most frameworks, state is defined in JavaScript and then passed into component markup using some type of templating syntax. _In Stellar, this relationship is inversed._ Reactive state is defined in HTML and then made accessible for manipulation in JavaScript.

It's called "HTML-based state."

In practice, this means a handful custom attributes called "directives" that begin with a `$` can be declaratively added to elements within a Stellar component to access the reactivity model.

Reactive directives include:

- [$state](#state)
- [$state:_property_](#stateproperty)
- [$state:html](#$statehtml)
- [$bind](#bind)
- [$bind:_property_](#bindproperty)
- [$derive](#derive)

## $state

Create reactive state tied to an element's text content.

### Syntax

```
$state="name"
```

_Shorthand:_

```
$="name"
```

### Usage

The `$state` directive allows you to define a piece of reactive state in HTML that is then made accessible within JavaScript. If you're coming from another web framework, a new concept to become familiar with is that state is automatically initialized based on the existing text content of a stateful element.

When trying to understand a reactive state declaration, the following code...

```html
<p $state="text">Hello world!</p>
```

...should be interpreted in the following way:

- The paragraph element is marked as stateful via the `$state` directive
- The name of the state is `text` and can be accessed in JavaScript by calling `this.text`
- The initial value of the state is the string "Hello world!"

![HTML based state diagram](../assets/html-based-state.png)

To provide a more complete example below, state defined on the span element will be accessible as a reactive property (i.e. `this.count`) in the CounterButton class and will be initialized with the number zero. Accessing state will return the current state and updating the state will automatically update the elements text content.

> [!NOTE]
> As a convenience, all reactive state is coerced to the correct data type when being accessed in JavaScript. For example, when accessing the `count` state below it will be of type `number`.

```html
<counter-button>
  <button @click="increment">
    Clicked <span $state="count">0</span> times
  </button>
</counter-button>

<script type="module">
  import { Stellar } from 'stellar-element';
  class CounterButton extends Stellar {
    constructor() {
      super();
      console.log(this.count); // Logs: 0
    }
    // Increment count state and update span element with new count
    increment = () => this.count++;
  }
  customElements.define('counter-button', CounterButton);
</script>
```

A by-product of this model is that state must _always_ be tied to a DOM node –– state (and all reactive directives for the matter) must be explicitly defined using an HTML element.

### Initializing state in JavaScript

If for whatever reason you can't or don't want to rely on auto-initialization of state based on the text content of a stateful element, you can always manually initialize the state in the `constructor` method of any Stellar component.

> [!WARNING]
> This method of initializing state runs the risk of causing visual instability and layout issues since the initially rendered reactive HTML will not contain any content until JavaScript is parsed and executed.

```html
<counter-button>
  <button @click="increment">
    <!-- Count state has no HTML-based initial value -->
    Clicked <span $state="count"></span> times
  </button>
</counter-button>

<script type="module">
  import { Stellar } from 'stellar-element';
  class CounterButton extends Stellar {
    constructor() {
      super();
      this.count = 0; // Count is initialized here!
      console.log(this.count); // Logs: 0
    }
    // Increment count state and update span element with new count
    increment = () => this.count++;
  }
  customElements.define('counter-button', CounterButton);
</script>
```

### Scoping state

It is recommended that you scope your state to be as small as possible. In practice this usually means using a lot of `<span>` tags within your markup to denote pockets of reactivity.

```html
<hello-message>
  <button @click="hello">Click for message</button>
  <p>Message: <span $state="message"></span></p>
</hello-message>

<script type="module">
  import { Stellar } from 'stellar-element';
  class HelloMessage extends Stellar {
    hello = () => {
      this.message = 'Hey there!'; // Update span element with text "Hey there!"
    };
  }
  customElements.define('hello-message', HelloMessage);
</script>
```

### State should start in the server

An intentional goal of this model is to be extremely SSR-friendly and align (mostly) well with [hypermedia-driven principles](https://hypermedia.systems/). When used in a framework like Astro, initial component state can start in the server, be encoded directly into your HTML, and then be seamlessly hydrated on the client without any layout shift issues or flashes of new content once JavaScript is executed.

```astro
---
// State starts in the server!
const initial = "Hello world!"
---

<log-text>
  <p $state="text">{initial}</p>
</log-text>

<script>
  import { Stellar } from 'stellar-element';
  class LogText extends Stellar {
    constructor() {
      super();
      console.log(this.text) // Logs "Hello world!"
      this.text = "Hey there!" // Update paragraph element with text "Hey there!"
      console.log(this.text) // Logs "Hey there!"
    }
  }
  customElements.define('log-text', LogText);
</script>
```

## $state:_property_

Create reactive state tied to an element property.

### Syntax

```
$state:property="name"
```

_Shorthand:_

```
$property="name"
```

### Usage

Similar to the `$state` directive this will create a piece of state, but instead of reactively updating the element's text content, changes to state created with the `$state:property` (or just `$property`) directive will update an element's property.

Here's an example:

```html
<toggle-checkbox>
  <label>
    <input type="checkbox" $checked="isChecked" $disabled="isDisabled" />
    Some label
  </label>
  <button @click="toggleChecked">Toggle checked state</button>
  <button @click="toggleDisabled">Toggle disabled state</button>
</toggle-checkbox>

<script type="module">
  import { Stellar } from 'stellar-element';
  class ToggleCheckbox extends Stellar {
    toggleChecked = () => {
      // If not disabled, toggle between checked states
      this.isDisabled ? null : (this.isChecked = !this.isChecked);
    };
    toggleDisabled = () => {
      // Toggle between disabled states
      this.isDisabled = !this.isDisabled;
    };
  }
  customElements.define('toggle-checkbox', ToggleCheckbox);
</script>
```

## $state:html

Create reactive state tied to an element's inner HTML.

### Syntax

```
$state:html="name"
```

_Shorthand:_

```
$html="name"
```

### Usage

Similar, to the `$state` directive this will create a piece of state, but instead of reactively updating the element's text content changes to state created with the `$state:html` (or just `$html`) directive will update an element's inner HTML.

A classic example of needing to reactively set inner HTML content is when building a markdown editor. Using a markdown parser (such as [marked](https://github.com/markedjs/marked)) and the `$html` directive makes this task trivial –– like one line of JavaScript trivial.

```html
<markdown-editor>
  <textarea @input="updateEditor" $value="input"># Hello markdown</textarea>
  <div $html="output"><h1>Hello markdown</h1></div>
</markdown-editor>

<script type="module">
  import { Stellar } from 'stellar-element';
  import { marked } from 'marked';
  class MarkdownEditor extends Stellar {
    updateEditor = () => {
      // Set inner HTML of the div with the parsed markdown from the textarea
      this.output = marked(this.input ?? '');
    };
  }
  customElements.define('markdown-editor', MarkdownEditor);
</script>
```

## $bind

Bind an element's text content to some existing state.

### Syntax

```
$bind="statename"
```

### Usage

The `$bind` directive can be thought of as a way to reflect existing state (unaltered) somewhere else in your component. If you're looking to create new (alterted) state based on other state, see the [`$derive` directive](#derive).

The `$bind` directive accepts the name of some state that has been defined elsewhere (using the `$state` or `$state:property` directives) and ties (or shall we say "binds") the state and the bound element together –– whenever the state changes the bound element's text content will change as well.

```html
<bound-values>
  <button @click="increment">
    Clicked <span $state="count">0</span> times
  </button>
  <p>Bound to count state: <span $bind="count">0</span></p>
</bound-values>

<script type="module">
  import { Stellar } from 'stellar-element';
  class BoundValues extends Stellar {
    increment = () => this.count++; // Update all span elements tied to count state
  }
  customElements.define('bound-values', BoundValues);
</script>
```

If it helps, in other web frameworks the above markup would usually look something like this:

```html
<!-- This is fake psuedo-code! -->
<button>Clicked {count} times</button>
<p>Bound to count state: {count}</p>
```

You can think of this as Stellar's way of working around not using a templating syntax and comes as a consequence of encoding state declarations into HTML.

## $bind:_property_

Bind an element property to some existing state.

### Syntax

```
$bind:property="statename"
```

### Usage

Like the `$bind` directive, `$bind:property` is a way of reflecting existing state (unaltered) to an element's property, such as the `value` property.

Unlike `$bind`, however, `$bind:property` takes inspiration from projects like Svelte and Vue by implementing two way data flow. This means not only will changing the state change the bound property, but changing the property will change the state.

The canonical example of this functionality is binding a text field's value property to some state. When typing into the text field the `value` property is changed, but since that property is bound to the `name` state it will automatically be updated as well. The effect is that as you type, both the text field and span element will render the changes.

> [!NOTE]
> To achieve the best experience when using SSR it's good practice to explicitly define the initial value of your bound property (as seen with `value="world"` in the example below). This avoids a flash of new content once JavaScript is loaded and the state is synced with the property.

```html
<hello-world>
  <input type="text" $bind:value="name" value="world" />
  <p>Hello <span $state="name">world</span>!</p>
</hello-world>

<script type="module">
  import { Stellar } from 'stellar-element';
  class HelloWorld extends Stellar {}
  customElements.define('hello-world', HelloWorld);
</script>
```

To be clear, this directive is syntactic sugar and the same functionality could be achieved by manually adding an `@input` event directive that triggers a callback method that will sync that text field `value` with the `name` state.

```html
<hello-world>
  <input type="text" @input="sync" value="world" />
  <p>Hello <span $state="name">world</span>!</p>
</hello-world>

<script type="module">
  import { Stellar } from 'stellar-element';
  class HelloWorld extends Stellar {
    sync = (event) => {
      this.name = event.target.value;
    };
  }
  customElements.define('hello-world', HelloWorld);
</script>
```

However, like Svelte [says in their tutorial](https://learn.svelte.dev/tutorial/text-inputs) doing this every time you want to sync the changes between a property and some state feels "a bit... boilerplatey." So we'll happily take the convenience of some sugar.

## $derive

Derive new state based on existing state(s), tied to an element's text content.

### Syntax

```
$derive="callback(...statenames)"
```

### Usage

The `$derive` directive can be used to create new (alterted) state based on other state in a Stellar component.

Inspired by [Vue computed properties](https://vuejs.org/guide/essentials/computed.html), this directive let's you declare a callback method that accepts component state (defined using `$state` or `$state:property`) and will be executed whenever that dependent state changes.

```html
<derived-state>
  <button @click="increment">
    Clicked <span $state="count">0</span> times
  </button>
  <p>Doubled: <span $derive="double(count)">0</span></p>
</derived-state>

<script type="module">
  import { Stellar } from 'stellar-element';
  class DerivedState extends Stellar {
    increment = () => this.count++;
    // Whenever count state is changed the double method will be executed
    // with the new state passed in as a parameter
    double = (count) => count * 2;
  }
  customElements.define('derived-state', DerivedState);
</script>
```

In other web frameworks the above markup would usually look something like this:

```html
<!-- This is fake psuedo-code! -->
<button>Clicked {count} times</button>
<p>Doubled: {count * 2}</p>
```

Like `$bind` this is another workaround for not using a templating syntax and consequence of encoding state into HTML.

### Deriving multiple state values

If you would like to derive new state based on multiple pieces of existing state, simply add the state names as a comma separated list to the callback method (i.e. pass the state names as parameters to the method), like so:

```html
<span $derive="callback(state1, state2, state3, ...)"></span>
```

Here's an example:

```html
<slider-math>
  <input type="range" $bind:value="a" value="1" min="0" max="10" />
  <input type="range" $bind:value="b" value="2" min="0" max="10" />
  <input type="range" $bind:value="c" value="3" min="0" max="10" />
  <p>
    <span $state="a">1</span> + <span $state="b">2</span> +
    <span $state="c">3</span> =
    <span $derive="sum(a,b,c)">6</span>
  </p>
</slider-math>

<script type="module">
  import { Stellar } from 'stellar-element';
  class SliderMath extends Stellar {
    // Whenever state a, b, or c changes the sum method will be executed
    sum = (a, b, c) => a + b + c;
  }
  customElements.define('slider-math', SliderMath);
</script>
```

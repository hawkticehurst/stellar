function isCustomElement(tagName: string) {
  return tagName.includes('-');
}
function removeAttribute(elem: HTMLElement, attr: Attr) {
  elem?.removeAttributeNode(attr);
}
function coerce(value: string | null) {
  if (!value) return;
  if (value === 'false' || value === 'true') return value === 'true';
  if (!isNaN(Number(value))) return Number(value);
  return value;
}
export class Stellar extends HTMLElement {
  private _tracked: { elem: HTMLElement; event: string; fn: EventListener }[];
  private _bind: { elem: HTMLElement; name: string; property: string }[];
  private _derived: { elem: HTMLElement; method: string; vars: string[] }[];
  protected refs: Record<string, HTMLElement>;
  constructor() {
    super();
    this._tracked = [];
    this._bind = [];
    this._derived = [];
    this.refs = {};
    let node;
    const changes: (() => void)[] = [];
    const nestedCustomElements: HTMLElement[] = [];
    const filter = (node: Node) => {
      // Reject any node that is not an HTML element
      if (!(node instanceof HTMLElement)) {
        return NodeFilter.FILTER_REJECT;
      }
      // Check if node is a nested custom element
      if (isCustomElement(node.tagName) && node.tagName !== this.tagName) {
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
        switch (true) {
          case attr.name === ':ref':
            changes.push(() => this.#setRef(attr));
            break;
          case attr.name.startsWith('$bind'):
            this.#bindProperty(attr);
            break;
          case attr.name === '$derive':
            this.#deriveState(attr);
            break;
          case attr.name.startsWith('$'):
            changes.push(() => this.#setState(attr));
            break;
          case attr.name.startsWith('@'):
            changes.push(() => this.#setEventHandler(attr));
            break;
        }
      }
    }
    for (const change of changes) {
      change();
    }
  }
  connectedCallback() {
    for (const { elem, event, fn } of this._tracked) {
      elem?.addEventListener(event, fn);
    }
  }
  disconnectedCallback() {
    for (const { elem, event, fn } of this._tracked) {
      elem?.removeEventListener(event, fn);
    }
  }
  #setEventHandler(attr: Attr) {
    const elem = attr.ownerElement as HTMLElement;
    const { name: event, value: method } = attr;
    this._tracked.push({
      elem: elem,
      event: event.slice(1),
      fn: (e: Event) => (this as any)[method](e),
    });
    removeAttribute(elem, attr);
  }
  #setState(attr: Attr) {
    const elem = attr.ownerElement as HTMLElement;
    const stateName = attr.value;
    const bound: ((value: any) => void)[] = [];
    for (const { elem: boundElem, name, property } of this._bind) {
      if (stateName === name) {
        bound.push((value: any) => {
          (boundElem as any)[property] = `${value}`; // Todo: Can this have better typing?
          if (
            boundElem instanceof HTMLInputElement ||
            boundElem instanceof HTMLTextAreaElement
          ) {
            this._tracked.push({
              elem: boundElem,
              event: 'input', // Todo: Handle different types of property events (i.e. changed, checked, etc)
              fn: (e: any) => ((this as any)[name] = e.target[property]), // Todo: e is type any
            });
          }
        });
      }
    }
    if (attr.name === '$state' || attr.name === '$') {
      Object.defineProperty(this, stateName, {
        get() {
          return coerce(elem.textContent);
        },
        set(value) {
          elem.textContent = `${value}`;
          for (const bind of bound) {
            bind(value);
          }
          for (const { elem, method, vars } of this._derived) {
            const params: any = [];
            for (const v of vars) {
              if (v === stateName) {
                params.push(coerce(value));
              } else {
                params.push((this as any)[v]);
              }
            }
            if ((this as any)[method]) {
              elem.textContent = (this as any)[method](...params);
            }
          }
        },
        enumerable: true,
      });
      this.#initState(elem.textContent, stateName);
    } else if (attr.name === '$state:value' || attr.name === '$value') {
      if (
        elem instanceof HTMLInputElement ||
        elem instanceof HTMLTextAreaElement ||
        elem instanceof HTMLSelectElement
      ) {
        Object.defineProperty(this, stateName, {
          get() {
            return coerce(elem.value);
          },
          set(value) {
            elem.value = `${value}`;
          },
          enumerable: true,
        });
        this.#initState(elem.value, stateName);
      } else {
        console.error(
          'Error: Attribute `$state:value` can only be set on elements that have a `value` property.'
        );
      }
    } else if (attr.name === '$state:html' || attr.name === '$html') {
      Object.defineProperty(this, stateName, {
        get() {
          return elem.innerHTML;
        },
        set(value) {
          elem.innerHTML = `${value}`;
        },
        enumerable: true,
      });
      this.#initState(elem.innerHTML, stateName);
    } else if (attr.name === '$state:disabled' || attr.name === '$disabled') {
      if (
        elem instanceof HTMLButtonElement ||
        elem instanceof HTMLFieldSetElement ||
        elem instanceof HTMLOptGroupElement ||
        elem instanceof HTMLOptionElement ||
        elem instanceof HTMLSelectElement ||
        elem instanceof HTMLTextAreaElement ||
        elem instanceof HTMLInputElement
      ) {
        Object.defineProperty(this, stateName, {
          get() {
            return elem.disabled;
          },
          set(value: boolean) {
            elem.disabled = value;
          },
          enumerable: true,
        });
        this.#initState(elem.disabled, stateName);
      }
    }
    removeAttribute(elem, attr);
  }
  #initState(initial: string | boolean | null, stateName: string) {
    if (initial) {
      (this as any)[stateName] = initial;
    }
  }
  #setRef(attr: Attr) {
    const elem = attr.ownerElement as HTMLElement;
    const refName = attr.value;
    Object.defineProperty(this.refs, refName, {
      get() {
        return elem;
      },
      enumerable: true,
    });
    removeAttribute(elem, attr);
  }
  #bindProperty(attr: Attr) {
    // Todo: Abstract function to bind any property
    const elem = attr.ownerElement as HTMLElement;
    if (attr.name === '$bind') {
      this._bind.push({
        elem: elem,
        name: attr.value,
        property: 'textContent',
      });
    } else if (attr.name === '$bind:value') {
      if (
        elem instanceof HTMLInputElement ||
        elem instanceof HTMLTextAreaElement
      ) {
        this._bind.push({ elem: elem, name: attr.value, property: 'value' });
      } else {
        console.error(
          'Error: Attribute `$bind:value` can only be set on elements that have a `value` property.'
        );
      }
    }
    removeAttribute(elem, attr);
  }
  #deriveState(attr: Attr) {
    const elem = attr.ownerElement as HTMLElement;
    const value = attr.value.split('(');
    const method = value[0];
    const vars = value[1].slice(0, -1).split(',');
    this._derived.push({
      elem: elem,
      method: method,
      vars: vars,
    });
  }
}

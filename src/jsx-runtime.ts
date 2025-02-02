import { Stellar } from './stellar.js';

export function h(type: typeof Fragment | Function | string, props: any, ...children: any) {
	if (type === Fragment) {
		return children;
	}
	if (typeof type === 'function') {
		return type({ ...props, children });
	}

  console.log(type)
  const element = document.createElement(type);
  console.log(element);
  

  if (props) {
    for (const [key, value] of Object.entries(props)) {
      if (key === 'class') {
        element.className = value as string;
      } else if (key === 'props') {
        if (element instanceof Stellar) {
          element.props = value;
        }
      } else if (key.startsWith('on') && typeof value === 'function') {
        element.addEventListener(key.slice(2).toLowerCase(), value as EventListener);
      } else {
        element.setAttribute(key, value as string);
      }
    }
  }

	children.forEach((child: HTMLElement | string | number)=> {
		appendChild(element, child);
	});

  return element;
}

function appendChild(parent: HTMLElement, child: HTMLElement | string | number) {
	if (typeof child === 'string' || typeof child === 'number') {
		parent.appendChild(document.createTextNode(child.toString()));
	} else if (child instanceof Node) {
		parent.appendChild(child);
	} else {
		console.warn('Unsupported child type:', child);
	}
}

export const Fragment = Symbol('Fragment');
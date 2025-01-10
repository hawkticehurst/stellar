import { portableComponent, html } from "../../src/index.ts";
import { styles } from './link-button.styles.ts';

const tagName = "link-button";

function onCreate() {
	document.adoptedStyleSheets = [...document.adoptedStyleSheets, styles];
}
function render() {
	return html`
		<a href="">Hello world</button>
	`;
}

export const LinkButton = portableComponent(tagName, render, [onCreate]);

declare global {
	interface HTMLElementTagNameMap {
		tagName: typeof LinkButton;
	}
}

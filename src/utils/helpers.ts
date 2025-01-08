export function isCustomElement(tagName: string) {
	return tagName.includes('-');
}

export function removeAttribute(elem: HTMLElement, attr: Attr) {
	elem?.removeAttributeNode(attr);
}

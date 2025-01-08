// This file Stellar event modifier names mapped to
// the correct event option or keyboard name

export type EventModifier = {
	capture?: boolean;
	once?: boolean;
	passive?: boolean;
	prevent?: boolean;
	self?: boolean;
	stop?: boolean;
};
export const eventModifiers = [
	'capture',
	'once',
	'passive',
	'prevent',
	'self',
	'stop'
];
export const systemModifiers = {
	alt: 'Alt',
	ctrl: 'Control',
	meta: 'Meta',
	shift: 'Shift'
};
export const keyModifiers = {
	enter: 'Enter',
	tab: 'Tab',
	delete: 'Delete',
	esc: 'Escape',
	space: ' ',
	up: 'ArrowUp',
	down: 'ArrowDown',
	left: 'ArrowLeft',
	right: 'ArrowRight'
};
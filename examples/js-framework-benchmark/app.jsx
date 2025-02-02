import { $component, html, $template } from "../../src/index.ts";

function dispatch(e) {
	const action = e.target.id;
	this.parent[action]();
}

function Button() {
	return (
		<div class="col-sm-6 smallpad">
			<button onclick="dispatch" type="button" class="btn btn-primary btn-block">Hi</button>
		</div>
	)
}

$component("bench-button", { render: Button, methods: [dispatch] });

const adjectives = ['pretty', 'large', 'big', 'small', 'tall', 'short', 'long', 'handsome', 'plain', 'quaint', 'clean', 'elegant', 'easy', 'angry', 'crazy', 'helpful', 'mushy', 'odd', 'unsightly', 'adorable', 'important', 'inexpensive', 'cheap', 'expensive', 'fancy'];
const colours = ['red', 'yellow', 'blue', 'green', 'pink', 'brown', 'purple', 'brown', 'white', 'black', 'orange'];
const nouns = ['table', 'chair', 'house', 'bbq', 'desk', 'car', 'pony', 'cookie', 'sandwich', 'burger', 'pizza', 'mouse', 'keyboard'];

const pick = dict => dict[Math.round(Math.random() * 1000) % dict.length];
const label = () => `${pick(adjectives)} ${pick(colours)} ${pick(nouns)}`;
const labelOf = r => r.firstChild.nextSibling.firstChild.firstChild;

const {cloneNode} = Node.prototype;
const clone = n => cloneNode.call(n, true);
const insert = (parent, node, ref) => parent.insertBefore(node, ref);

const TROW = $template(html`<tr><td class="col-md-1">?</td><td class="col-md-4"><a>?</a></td><td class="col-md-1"><a><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></a></td><td class="col-md-6"></td></tr>`);

function onCreate() {
	this.ID = 1;
	this.SEL = null;
	this.TMPL = null;
	this.SIZE = 0;
	this.TABLE = this.querySelector('table');
	this.TBODY = this.querySelector('tbody');
	this.ROWS = this.TBODY.children;
}

function run() {
	this.create(1000);
}

function runlots() {
	this.create(10000);
}

function add() {
	this.create(1000, true);
}

function clear() {
	this.TBODY.textContent = '';
	this.SEL = null;
}

function update() {
	for (let i = 0, r; r = this.ROWS[i]; i += 10) {
		labelOf(r).nodeValue += ' !!!';
	}
}

function swaprows() {
	const [, r1, r2] = this.ROWS;
	const r998 = this.ROWS[998];
	if (r998) {
		insert(this.TBODY, r1, r998);
		insert(this.TBODY, r998, r2);
	}
}

function create(count, add = false) {
	if (this.SIZE !== count) {
		this.TMPL = clone(TROW.content);
		[...Array((this.SIZE = count) / 50 - 1)].forEach(() => {
			this.TMPL.append(clone(this.TMPL.firstChild));
		});
	}
	if (!add) {
		this.clear();
		this.TBODY.remove();
	}
	while (count) {
		for (const r of this.TMPL.children) {			
			(r.$id ??= r.firstChild.firstChild).nodeValue = this.ID++;
			(r.$label ??= labelOf(r)).nodeValue = label();
			count--;
		}
		insert(this.TBODY, clone(this.TMPL), null);
	}
	if (!add) {
		this.TABLE.append(this.TBODY);
	}
}

function rowSelect(e) {
	const t = e.target;
	const n = t.tagName;
	const r = t.closest('TR');
	e.stopPropagation();
	if (n == 'SPAN' || n == 'A' && t.firstElementChild) {
		r.remove();
	} else if (n == 'A' && (this.SEL && (this.SEL.className = ''), (this.SEL = r))) {
		this.SEL.className = 'danger';
	}
}

function App() {
	return (
		<bench-button props={["run", 'Create 1,000 rows', run]}></bench-button>
	)
}

// $component("bench-app", { 
// 	render: App, 
// 	methods: [onCreate, run, runlots, add, clear, update, swaprows, create, rowSelect] 
// });
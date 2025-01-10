import { css } from "../../src/index.ts";

export const styles = new CSSStyleSheet();
styles.replaceSync(css`
	link-button a {
		background: black;
		color: white;
		border: solid 2px black;
		font-weight: 500;
		border-radius: 6px;
		padding: 6px 14px;
		text-decoration: none;
	}
	link-button[variant="secondary"] a {
		background: transparent;
		color: black;
	}
	link-button[size="large"] a {
		padding: 10px 20px;
		font-size: 1.25rem;
	}
	link-button[pill] a {
		border-radius: 50px;
	}
`);
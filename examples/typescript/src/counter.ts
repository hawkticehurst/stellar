import { Stellar } from 'stellar-element';
import './style.css';

class CounterButton extends Stellar {
  // The type(s) of state must be declared –– this let's the TS compiler know that the
  // state already exists (it is defined within the Stellar class)
  declare count: number;
  increment = () => this.count++;
}

customElements.define('counter-button', CounterButton);

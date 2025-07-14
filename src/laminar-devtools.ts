import { LitElement, html } from 'lit'
import { customElement } from 'lit/decorators.js'

@customElement('laminar-devtools')
export class LaminarDevtools extends LitElement {
  render() {
    return html`
      <div>
        <h1>Hello World</h1>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'laminar-devtools': LaminarDevtools
  }
}

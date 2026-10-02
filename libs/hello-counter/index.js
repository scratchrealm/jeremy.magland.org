// <hello-counter start="0">: a button that counts its clicks. A minimal example
// of a widget library; real libraries usually import a widget from a
// proof-of-concept repo installed as a git dependency in libs/package.json.
//
// It inherits the page's text color and font, and uses the site's --link color
// when the page defines it.

class HelloCounter extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot) return
    let count = Number(this.getAttribute('start') ?? 0)
    const root = this.attachShadow({ mode: 'open' })
    root.innerHTML = `
      <style>
        button {
          font: inherit;
          color: inherit;
          background: none;
          border: 1px solid var(--link, currentColor);
          border-radius: 6px;
          padding: 0.4em 0.9em;
          cursor: pointer;
        }
        button:hover { color: var(--link, currentColor); }
      </style>
      <button type="button"></button>
    `
    const button = root.querySelector('button')
    const show = () => (button.textContent = `Clicked ${count} time${count === 1 ? '' : 's'}`)
    button.addEventListener('click', () => {
      count++
      show()
    })
    show()
  }
}

if (!customElements.get('hello-counter')) customElements.define('hello-counter', HelloCounter)

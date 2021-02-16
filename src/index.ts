import { controller, target } from "@github/catalyst"

@controller
class HelloWorldElement extends HTMLElement {
  @target nameTarget: HTMLElement
  @target outputTarget: HTMLElement

  greet() {
    this.outputTarget.textContent =
      `Hello, ${(<HTMLInputElement>this.nameTarget).value}!`
  }
}
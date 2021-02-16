import { controller, target } from "@github/catalyst"

@controller
class HelloWorldElement extends HTMLElement {
  @target nameTarget: HTMLInputElement;
  @target outputTarget: HTMLElement

  greet() {
    this.outputTarget.textContent = `Hello, ${this.nameTarget.value}!`;
  }
}

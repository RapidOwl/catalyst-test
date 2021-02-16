import { controller, target } from "@github/catalyst"

@controller
class HelloWorldElement extends HTMLElement {
  @target name: HTMLInputElement;
  @target output: HTMLElement;

  greet() {
    this.output.textContent = `Hello, ${this.name.value}!`;
  }
}

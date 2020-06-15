// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Vue, { VNode } from "vue";

declare global {
  namespace JSX {
    type Element = VNode;
    type ElementClass = Vue;
    interface IntrinsicElements {
      [elem: string]: any;
    }
  }
}

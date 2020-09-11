import { DirectiveOptions } from "vue";
import { VNode, VNodeDirective } from "vue/types/vnode";

interface LongPressHTMLElement extends HTMLElement {
  $alt_action_listener: (ev: MouseEvent) => void;
  $lost_capture_listener: () => void;
}

function emit(el: HTMLElement, vnode: VNode, ev: MouseEvent) {
  const newEvent = new MouseEvent("alt-action", ev);
  if (vnode.componentInstance) {
    vnode.componentInstance.$emit(newEvent.type, newEvent);
  } else {
    el.dispatchEvent(newEvent);
  }
}

function getTimeoutId(id: string | undefined) {
  return id ? parseInt(id) : 0;
}

const directiveOption: DirectiveOptions = {
  bind(el: HTMLElement, binding: VNodeDirective, vnode: VNode) {
    const timeout = binding.value ?? 600;
    if (typeof timeout !== "number") {
      throw Error("value is not number");
    }
    const onPointerUp = () => {
      clearTimeout(getTimeoutId(el.dataset.actionTimeoutId));
      document.removeEventListener("pointerup", onPointerUp);
    };
    const onAction = (ev: MouseEvent) => {
      if (ev.type === "contextmenu") {
        clearTimeout(getTimeoutId(el.dataset.actionTimeoutId));
        emit(el, vnode, ev);
        ev.preventDefault();
      } else if ((ev as PointerEvent)?.isPrimary) {
        document.addEventListener("pointerup", onPointerUp);
        const timeoutId = setTimeout(() => emit(el, vnode, ev), timeout);
        el.dataset.actionTimeoutId = timeoutId.toString();
      }
    };
    const lostCapture = () => {
      clearTimeout(getTimeoutId(el.dataset.actionTimeoutId));
    };
    el.addEventListener("pointerdown", onAction);
    el.addEventListener("contextmenu", onAction);
    el.addEventListener("lostpointercapture", lostCapture);
    const listenerHolder = el as LongPressHTMLElement;
    listenerHolder.$alt_action_listener = onAction;
    listenerHolder.$lost_capture_listener = lostCapture;
  },
  unbind(el: HTMLElement) {
    clearTimeout(getTimeoutId(el.dataset.actionTimeoutId));
    const listenerHolder = el as LongPressHTMLElement;
    listenerHolder.removeEventListener("pointerdown", listenerHolder.$alt_action_listener);
    listenerHolder.removeEventListener("contextmenu", listenerHolder.$alt_action_listener);
    listenerHolder.removeEventListener("lostpointercapture", listenerHolder.$lost_capture_listener);
  },
};

export default directiveOption;

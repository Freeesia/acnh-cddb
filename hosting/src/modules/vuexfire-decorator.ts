import { firestore } from "firebase";
import { ActionContext } from "vuex";
import { FirestoreOptions } from "@posva/vuefire-core";
import { firestoreAction } from "vuexfire";

export interface FirestoreActionContext<S, R> extends ActionContext<S, R> {
  bindFirestoreRef(
    key: string,
    ref: firestore.Query | firestore.CollectionReference,
    options?: FirestoreOptions
  ): Promise<firestore.DocumentData[]>;
  bindFirestoreRef(
    key: string,
    ref: firestore.DocumentReference,
    options?: FirestoreOptions
  ): Promise<firestore.DocumentData>;
  unbindFirestoreRef(key: string): void;
}

const FirestoreAction = () => {
  return function (_target: any, _key: string, descriptor: PropertyDescriptor) {
    const delegate = descriptor.value;
    descriptor.value = function (payload: any) {
      const action = firestoreAction(context => {
        const thisObj = { context };
        return delegate.call(thisObj, payload);
      });

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return action(this.context);
    };
  };
};
export default FirestoreAction;

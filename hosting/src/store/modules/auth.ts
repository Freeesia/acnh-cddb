import { VuexModule, Module, Mutation, Action } from "vuex-module-decorators";
import { auth, User, firestore } from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import FirestoreAction, { FirestoreActionContext } from "@/modules/vuexfire-decorator";

interface UserInfo {
  favs: string[];
}

@Module({ namespaced: true, name: "auth" })
export default class Auth extends VuexModule {
  user: User | null = null;
  info: UserInfo | null = null;

  @Mutation
  private setUser(user: User | null) {
    this.user = user;
  }

  @Action
  async signOut() {
    await auth().signOut();
    this.context.commit("setUser", null);
  }

  @Action
  @FirestoreAction()
  init(user: User | null) {
    // Refactor: this line is kind of danger, so it should be refactored
    const { bindFirestoreRef, unbindFirestoreRef } = this.context as FirestoreActionContext<any, any>;

    if (user) {
      return bindFirestoreRef("info", firestore().doc(`users/${user.uid}`), { maxRefDepth: 0 });
    } else {
      return unbindFirestoreRef("info");
    }
  }

  @Action
  async isSignedIn() {
    let user = this.user;
    if (!user) {
      user = await new Promise<User | null>((res, rej) => {
        auth().onAuthStateChanged(res, rej);
      });
      if (!user) {
        auth().signOut();
      }
      this.context.commit("setUser", user);
      this.context.dispatch("init", user);
    }
    return user ? true : false;
  }
}

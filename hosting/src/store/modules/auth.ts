import { auth, User } from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import FirestoreAction, { FirestoreActionContext } from "@/modules/vuexfire-decorator";
import { DesignList } from "@core/models/types";
import { usersRef, designListsRef } from "@/plugins/firestore";
import { action, createModule, getRawActionContext } from "vuex-class-component";

const VuexModule = createModule({
  namespaced: "auth",
  strict: false,
});

interface UserInfo {
  favs: string[];
  downloaded: string[];
  dreamFavs: string[];
}

export default class Auth extends VuexModule {
  user: User | null = null;
  _info: UserInfo | null = null;
  _lists: DesignList[] = [];

  get info() {
    return this._info;
  }

  get lists() {
    return this._lists;
  }

  @action
  async signOut() {
    await auth().signOut();
    this.user = null;
  }

  @action({ mode: "raw" })
  @FirestoreAction()
  init() {
    const context = getRawActionContext(this);
    // Refactor: this line is kind of danger, so it should be refactored
    const { bindFirestoreRef, unbindFirestoreRef } = context as FirestoreActionContext<any, any>;
    const user = this.user;
    if (user) {
      return Promise.all([
        bindFirestoreRef("info", usersRef.doc(user.uid), { maxRefDepth: 0 }),
        bindFirestoreRef("lists", designListsRef.where("owner", "==", user.uid), { maxRefDepth: 0 }),
      ]);
    } else {
      unbindFirestoreRef("info");
      return Promise.resolve();
    }
  }

  @action
  async isSignedIn() {
    let user = this.user;
    if (!user) {
      user = await new Promise<User | null>((res, rej) => {
        auth().onAuthStateChanged(res, rej);
      });
      if (!user) {
        auth().signOut();
      }
      this.user = user;
      this.init();
    }
    return user ? true : false;
  }
}

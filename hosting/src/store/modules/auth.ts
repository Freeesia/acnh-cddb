import { VuexModule, Module, Mutation, Action } from "vuex-module-decorators";
import { auth, User } from "firebase/app";
import "firebase/auth";

@Module({ namespaced: true, name: "auth" })
export default class Auth extends VuexModule {
  user: User | null = null;

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
    }
    return user ? true : false;
  }
}

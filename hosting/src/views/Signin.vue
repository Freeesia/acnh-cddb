<template>
  <v-container>
    <h1>
      <p class="text-center text-h4">あつまれ マイデザの🌳</p>
      <p class="text-center text-h5">へ ようこそ</p>
    </h1>
    <section class="pa-6">
      <p class="text-center">あつまれ マイデザの🌳はあつ森のマイデザが集まっているサービスです</p>
    </section>
    <section class="pa-6">
      <p class="text-center"><router-link to="/tos">利用規約</router-link>に同意してログイン↓</p>
      <div id="auth-container"></div>
    </section>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { auth } from "firebase/app";
import "firebase/auth";
import firebaseui from "firebaseui-ja";
import "firebaseui-ja/dist/firebaseui.css";

@Component({})
export default class Signin extends Vue {
  @Prop({ type: String, default: "/" })
  private redirect!: string;

  private created() {
    auth().useDeviceLanguage();
  }

  private mounted() {
    let ui = firebaseui.auth.AuthUI.getInstance();
    if (!ui) {
      ui = new firebaseui.auth.AuthUI(auth());
    }
    ui.start("#auth-container", {
      signInOptions: [auth.TwitterAuthProvider.PROVIDER_ID],
      signInFlow: "popup",
      callbacks: {
        signInSuccessWithAuthResult: this.signInSuccess,
      },
    });
  }

  private signInSuccess() {
    this.$router.push(this.redirect);
    return false;
  }
}
</script>

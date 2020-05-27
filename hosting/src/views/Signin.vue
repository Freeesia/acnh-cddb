<template>
  <div id="auth-container"></div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";
import { auth } from "firebase/app";
import "firebase/auth";
import firebaseui from "firebaseui-ja";
import "firebaseui-ja/dist/firebaseui.css";

@Component({})
export default class Login extends Vue {
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
      callbacks: {
        signInSuccessWithAuthResult: this.signInSuccess,
      },
    });
  }

  private signInSuccess() {
    this.$router.push("/");
    return false;
  }
}
</script>

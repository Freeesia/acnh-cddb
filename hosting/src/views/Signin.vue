<template>
  <v-container>
    <h1>
      <i18n path="signin.title">
        <template #title>
          <p class="text-center text-h4">{{ $t("title") }}</p>
        </template>
        <template #welcome>
          <p class="text-center text-h5">{{ $t("signin.welcome") }}</p>
        </template>
      </i18n>
    </h1>
    <section class="pa-6">
      <p class="text-center">{{ $t("signin.desc") }}</p>
    </section>
    <section class="pa-6">
      <p v-if="loading" class="text-center">{{ $t("signin.signinning") }}</p>
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
  private loading = false;

  private created() {
    auth().useDeviceLanguage();
  }

  private mounted() {
    let ui = firebaseui.auth.AuthUI.getInstance();
    if (!ui) {
      ui = new firebaseui.auth.AuthUI(auth());
    }
    if (ui.isPendingRedirect()) {
      this.loading = true;
    }
    ui.start("#auth-container", {
      signInOptions: [auth.TwitterAuthProvider.PROVIDER_ID],
      callbacks: {
        signInSuccessWithAuthResult: this.signInSuccess,
      },
      tosUrl: () => {
        this.$router.push("/tos");
      },
      privacyPolicyUrl: () => {
        this.$router.push("/privacy");
      },
    });
  }

  private signInSuccess() {
    this.$gtag.event("login", { method: auth.TwitterAuthProvider.TWITTER_SIGN_IN_METHOD });
    this.$router.push(this.redirect);
    return false;
  }
}
</script>

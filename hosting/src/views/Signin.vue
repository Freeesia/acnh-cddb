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
// なぜか本家をimportするとjaでレイアウト崩れるけど、jaをimportしても本家は崩れない
import "firebaseui-ja/dist/firebaseui.css";
import { GeneralModule } from "../store";

@Component({})
export default class Signin extends Vue {
  @Prop({ type: String, default: "/" })
  private redirect!: string;
  private loading = false;

  private created() {
    auth().useDeviceLanguage();
  }

  private async mounted() {
    const AuthUI = await this.getAuthUI();
    let ui = AuthUI.getInstance();
    if (!ui) {
      ui = new AuthUI(auth());
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

  private async getAuthUI() {
    if (GeneralModule.locale === "ja") {
      const ui = await import("firebaseui-ja");
      return ui.auth.AuthUI;
    } else {
      const ui = await import("firebaseui");
      return ui.auth.AuthUI;
    }
  }

  private signInSuccess() {
    this.$gtag.event("login", { method: auth.TwitterAuthProvider.TWITTER_SIGN_IN_METHOD });
    this.$router.push(this.redirect);
    return false;
  }
}
</script>

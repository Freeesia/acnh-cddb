<template>
  <v-container fill-height>
    <v-row no-gutters class="fill-height mt-4">
      <v-col md="4" cols="12" class="pa-2">
        <section class="d-flex align-center flex-column">
          <v-avatar :size="200" color="primary">
            <v-img v-if="user.photoURL" :src="user.photoURL" alt="avatar">
              <template v-slot:placeholder>
                <v-row class="fill-height" align="center" justify="center">
                  <v-progress-circular indeterminate color="primary"></v-progress-circular>
                </v-row>
              </template>
            </v-img>
            <span v-else class="white--text display-4">{{ user.email[0] }}</span>
          </v-avatar>
          <p class="headline font-weight-bold ma-2">{{ user.displayName }}</p>
        </section>
      </v-col>
      <v-col md="8" cols="12">
        <v-tabs v-model="activeTab">
          <v-tab>お気に入り</v-tab>
          <v-tab>アカウント</v-tab>
        </v-tabs>
        <v-tabs-items v-model="activeTab" class="fill-height">
          <v-tab-item class="pa-2">
            <v-row>
              <v-col v-for="design in designs" :key="design.id" cols="6" sm="3" md="2" lg="1">
                <DesignCard :doc="design" :favs="favs" @click="select" />
              </v-col>
            </v-row>
          </v-tab-item>
          <v-tab-item class="pa-2">
            <section class="ma-2">
              <header class="headline">サインアウト</header>
              <p>サインアウトし、サインイン画面に遷移します</p>
              <v-btn color="info" @click="signOut">サインアウト</v-btn>
            </section>
            <v-divider class="my-4" />
            <section class="ma-2">
              <header class="headline">退会</header>
              <p>アカウントを削除します</p>
              <v-btn color="error" @click="deleteMe">退会</v-btn>
            </section>
          </v-tab-item>
        </v-tabs-items>
      </v-col>
    </v-row>
    <v-dialog v-model="dialog" width="500px" :fullscreen="$vuetify.breakpoint.xsOnly">
      <v-card>
        <v-toolbar flat dense>
          <v-spacer></v-spacer>
          <v-btn icon @click="close">
            <v-icon>close</v-icon>
          </v-btn>
        </v-toolbar>
        <DesignDetail :doc="selected"></DesignDetail>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import DesignCard from "../components/DesignCard.vue";
import DesignDetail from "../components/DesignDetail.vue";
import { AuthModule, GeneralModule } from "../store";
import { assertIsDefined } from "../utilities/assert";
import { User, firestore } from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import DocumentSnapshot = firestore.DocumentSnapshot;
import DocRef = firestore.DocumentReference;

@Component({ components: { DesignCard, DesignDetail } })
export default class Account extends Vue {
  private readonly db = firestore();
  private user!: User;
  private activeTab: any = null;
  private designs: DocumentSnapshot[] = [];
  private favs: string[] = [];
  private dialog = false;
  private selected: DocumentSnapshot | null = null;

  private created() {
    const user = AuthModule.user;
    assertIsDefined(user);
    this.user = user;
    this.getDesigns();
  }

  private async getDesigns() {
    const userInfoRef = this.db.doc(`/users/${this.user.uid}`);
    const userInfoSs = await userInfoRef.get();
    const favs = userInfoSs.get("favs") as DocRef[];
    this.favs = favs.map(f => f.path);
    for (const ref of favs) {
      this.designs.push(await ref.get());
    }
  }

  private async signOut() {
    GeneralModule.setLoading(true);
    await AuthModule.signOut();
    GeneralModule.setLoading(false);
    this.$router.push("/");
  }

  private async deleteMe() {
    GeneralModule.setLoading(true);
    try {
      if (!this.user) {
        throw new Error("ログインしていません");
      }
      await this.user.delete();
    } catch (error) {
      alert("退会処理が正常に完了しませんでした。再度ログインして退会してください");
      GeneralModule.setLoading(false);
      this.$router.push("/signin");
    }
    GeneralModule.setLoading(false);
    this.$router.push("/");
  }

  private select(doc: DocumentSnapshot) {
    this.selected = doc;
    this.dialog = true;
  }

  private close() {
    this.dialog = false;
    this.selected = null;
  }
}
</script>

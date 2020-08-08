<template>
  <v-container fluid>
    <v-row no-gutters class="fill-height mt-4">
      <v-col md="4" cols="12">
        <section class="d-flex align-center flex-column">
          <v-avatar :size="200" color="primary">
            <v-img v-if="user.photoURL" :lazy-src="user.photoURL" :src="profileUrl" alt="avatar">
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
          <v-tab>マイデザイン</v-tab>
          <v-tab>夢番地</v-tab>
          <v-tab>管理</v-tab>
          <v-tab>アカウント</v-tab>
        </v-tabs>
        <v-tabs-items v-model="activeTab" class="fill-height">
          <v-tab-item>
            <v-row dense>
              <v-col v-for="design in designs" :key="design.id" cols="6" sm="3" lg="2">
                <DesignCard :view-downloaded="true" :info="design" @click="select" />
              </v-col>
            </v-row>
          </v-tab-item>
          <v-tab-item>
            <v-row dense>
              <v-col v-for="dream in dreams" :key="dream.dreamId" cols="12" sm="6" md="4">
                <DreamCard :info="dream" />
              </v-col>
            </v-row>
          </v-tab-item>
          <v-tab-item>
            <v-toolbar dense flat>
              <v-toolbar-title>投稿した夢番地</v-toolbar-title>
              <v-spacer></v-spacer>
              <v-btn icon @click="setDream">
                <v-icon>add</v-icon>
              </v-btn>
              <v-btn icon :disabled="!myDream" :loading="deleting" @click="deleteDream">
                <v-icon>delete</v-icon>
              </v-btn>
            </v-toolbar>
            <DreamCard v-if="myDream" mine :info="myDream" />
            <v-toolbar dense flat>
              <v-toolbar-title>投稿したマイデザ</v-toolbar-title>
              <v-spacer></v-spacer>
              <v-btn icon @click="add">
                <v-icon>add</v-icon>
              </v-btn>
              <v-btn icon :disabled="!canDelete" :loading="deleting" @click="deleteDesigns">
                <v-icon>delete</v-icon>
              </v-btn>
            </v-toolbar>
            <v-data-table
              v-model="selected"
              :headers="headers"
              :items="myDesigns"
              mobile-breakpoint="0"
              show-select
              hide-default-footer
              fixed-header
              :items-per-page="-1"
            >
              <template v-slot:item.imageUrls="{ item }">
                <v-img width="40" aspect-ratio="1" class="secondary" :src="item.imageUrls.thumb1">
                  <template v-slot:placeholder>
                    <v-row class="fill-height ma-0" align="center" justify="center">
                      <v-progress-circular indeterminate color="accent"></v-progress-circular>
                    </v-row>
                  </template>
                </v-img>
              </template>
            </v-data-table>
          </v-tab-item>
          <v-tab-item>
            <section class="ma-2">
              <header class="headline">ユーザー情報</header>
              <v-text-field
                v-model="user.uid"
                readonly
                label="ID"
                prepend-icon="perm_identity"
                persistent-hint
                hint="お問い合わせの際、こちらのIDをご連絡ください"
              />
            </section>
            <v-divider class="my-4" />
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
  </v-container>
</template>
<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import DesignCard from "../components/DesignCard.vue";
import DesignDetail from "../components/DesignDetail.vue";
import DreamCard from "../components/DreamCard.vue";
import { AuthModule, GeneralModule } from "../store";
import { User, firestore } from "firebase/app";
import "firebase/firestore";
import { UserInfo, DesignInfo, DreamInfo } from "../../../core/src/models/types";
import { assertIsDefined } from "../../../core/src/utilities/assert";
import AddDesign from "../components/AddDesign.vue";
import { unregisterDesignInfo, unregisterDreamInfo } from "../plugins/functions";
import SetDream from "../components/SetDream.vue";

@Component({ components: { DesignCard, DreamCard } })
export default class Account extends Vue {
  private readonly db = firestore();
  private user!: User;
  private userInfo: UserInfo | null = null;
  private activeTab: any = null;
  private myDesigns: DesignInfo[] = [];
  private myDreams: DreamInfo[] = [];
  private headers = [
    { text: "", value: "imageUrls", sortable: false, filterable: false },
    { text: "タイトル", value: "title" },
    { text: "タイプ", value: "designType" },
  ];
  private selected: DesignInfo[] = [];
  private deleting = false;

  private get designs(): DesignInfo[] {
    return (
      this.userInfo?.favs.filter<DesignInfo>((f): f is DesignInfo => typeof f !== "string" && f !== null).reverse() ??
      []
    );
  }

  private get dreams(): DreamInfo[] {
    return (
      this.userInfo?.dreamFavs
        .filter<DreamInfo>((f): f is DreamInfo => typeof f !== "string" && f !== null)
        .reverse() ?? []
    );
  }

  private get myDream() {
    return this.myDreams.length > 0 ? this.myDreams[0] : null;
  }

  private get profileUrl() {
    return this.user.photoURL?.replace("_normal.png", ".png");
  }

  private get canDelete() {
    return this.selected.length > 0;
  }

  private created() {
    const user = AuthModule.user;
    assertIsDefined(user);
    this.user = user;
    this.$bind("userInfo", this.db.doc(`/users/${this.user.uid}`));
    const provData = this.user.providerData.find(p => p && p.providerId == "twitter.com");
    assertIsDefined(provData);
    const conRef = this.db.doc(`contributors/Twitter:${provData.uid}`);
    this.$bind("myDesigns", this.db.collection("designs").where("post.contributor", "==", conRef));
    this.$bind("myDreams", this.db.collection("dreams").where("post.contributor", "==", conRef).limit(1));
  }

  private async signOut() {
    GeneralModule.setLoading(true);
    await AuthModule.signOut();
    GeneralModule.setLoading(false);
    this.$router.push("/signin");
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
    this.$router.push("/signin");
  }

  private select(info: DesignInfo) {
    if (this.$vuetify.breakpoint.smAndUp) {
      this.$dialog.show(DesignDetail, {
        info,
      });
    } else {
      this.$router.push({
        name: "detail",
        params: {
          id: info.designId,
        },
      });
    }
  }

  private add() {
    this.$dialog.show(AddDesign, {
      showClose: false,
    });
  }

  private async deleteDesigns() {
    const titles = this.selected.map(d => d.title);
    const res = await this.$dialog.confirm({
      text: "以下のデザインを削除します<br/>" + titles.map(t => `<pre>${t}</pre><br/>`),
      title: "確認",
    });
    if (res) {
      this.deleting = true;
      const ids = this.selected.map(d => d.designId);
      await unregisterDesignInfo(ids);
      this.selected = [];
      this.deleting = false;
    }
  }

  private async setDream() {
    if (this.myDream) {
      const res = await this.$dialog.confirm({
        text: "現在投稿されている夢番地を上書きしますが、よろしいですか？",
      });
      if (!res) {
        return;
      }
    }
    this.$dialog.show(SetDream, {
      showClose: false,
      oldId: this.myDream?.dreamId ?? "",
    });
  }

  private async deleteDream() {
    const res = await this.$dialog.confirm({
      text: "投稿した夢番地を削除してよろしいですか？",
    });
    if (res) {
      this.deleting = true;
      assertIsDefined(this.myDream);
      await unregisterDreamInfo(this.myDream.dreamId);
      this.deleting = false;
    }
  }
}
</script>

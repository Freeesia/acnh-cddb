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
          <v-tab>{{ $t("mydesign.header") }}</v-tab>
          <v-tab>{{ $t("dreamaddress.header") }}</v-tab>
          <v-tab>{{ $t("management") }}</v-tab>
          <v-tab>{{ $t("account") }}</v-tab>
        </v-tabs>
        <v-tabs-items v-model="activeTab" class="fill-height">
          <v-tab-item>
            <v-row dense>
              <v-col v-for="design in designs" :key="design.id" cols="6" sm="3" lg="2">
                <DesignCard :view-downloaded="true" :info="design" @click="select" />
              </v-col>
              <p v-if="designs.length === 0">
                <i18n path="mydesign.noFav">
                  <template #here>
                    <router-link to="/">{{ $t("mydesign.here") }}</router-link>
                  </template>
                </i18n>
              </p>
            </v-row>
          </v-tab-item>
          <v-tab-item>
            <v-row dense>
              <v-col v-for="dream in dreams" :key="dream.dreamId" cols="12" sm="6" md="4">
                <DreamCard :info="dream" />
              </v-col>
              <p v-if="dreams.length === 0">
                <i18n path="dreamaddress.noFav">
                  <template #here>
                    <router-link to="/">{{ $t("dreamaddress.here") }}</router-link>
                  </template>
                </i18n>
              </p>
            </v-row>
          </v-tab-item>
          <v-tab-item>
            <v-toolbar dense flat>
              <v-toolbar-title>{{ $t("myDream.header") }}</v-toolbar-title>
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
              <v-toolbar-title>{{ $t("myMyDesigns.header") }}</v-toolbar-title>
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
            <v-toolbar dense flat>
              <v-toolbar-title>{{ $t("myDesignList.header") }}</v-toolbar-title>
              <v-spacer></v-spacer>
              <v-btn icon @click="createList">
                <v-icon>add</v-icon>
              </v-btn>
            </v-toolbar>
            <v-card v-for="list in myDesignLists" :key="list.id" outlined class="ma-2" @click="selectList(list)">
              <div class="d-flex flex-no-wrap justify-space-between">
                <v-card-title class="headline">
                  <div>{{ list.name }}</div>
                  <v-icon class="mx-1" small>{{ list.isPublic ? "public" : "lock" }}</v-icon>
                  <v-chip class="mx-2" small>{{ list.designs.length }}</v-chip>
                </v-card-title>
                <div class="ma-2">
                  <v-btn icon :loading="listDeleting == list.id" @click.stop="deleteList(list)">
                    <v-icon>delete</v-icon>
                  </v-btn>
                </div>
              </div>
            </v-card>
          </v-tab-item>
          <v-tab-item>
            <section class="ma-2">
              <header class="headline">{{ $t("userInfo") }}</header>
              <v-text-field
                v-model="user.uid"
                class="px-2"
                readonly
                label="ID"
                prepend-icon="perm_identity"
                persistent-hint
                :hint="$t('hintId')"
              />
              <v-select
                v-model="locale"
                :label="$t('language')"
                :items="langs"
                class="px-2"
                item-text="label"
                item-value="value"
                prepend-icon="language"
              />
            </section>
            <v-divider class="my-4" />
            <section class="ma-2">
              <header class="headline">{{ $t("signout.label") }}</header>
              <p>{{ $t("signout.desc") }}</p>
              <v-btn color="info" @click="signOut">{{ $t("signout.label") }}</v-btn>
            </section>
            <v-divider class="my-4" />
            <section class="ma-2">
              <header class="headline">{{ $t("deactive.label") }}</header>
              <p>{{ $t("deactive.desc") }}</p>
              <v-btn color="error" @click="deleteMe">{{ $t("deactive.label") }}</v-btn>
            </section>
          </v-tab-item>
        </v-tabs-items>
      </v-col>
    </v-row>
  </v-container>
</template>

<style lang="scss" scoped>
p {
  white-space: pre-wrap;
}
.test {
  background-color: rebeccapurple;
}
</style>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import DesignCard from "../components/DesignCard.vue";
import DesignDetail from "../components/DesignDetail.vue";
import DreamCard from "../components/DreamCard.vue";
import { AuthModule, GeneralModule } from "../store";
import { User, firestore } from "firebase/app";
import "firebase/firestore";
import { UserInfo, DesignInfo, DreamInfo, DesignList } from "../../../core/src/models/types";
import { assertIsDefined } from "../../../core/src/utilities/assert";
import AddDesign from "../components/AddDesign.vue";
import { unregisterDesignInfo, unregisterDreamInfo } from "../plugins/functions";
import SetDream from "../components/SetDream.vue";
import { setLocale } from "../plugins/i18n";
import { designListsRef } from "../plugins/firestore";
import CreateList from "../components/CreateList.vue";

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
    { text: this.$t("myMyDesigns.title"), value: "title" },
    { text: this.$t("myMyDesigns.type"), value: "designType" },
  ];
  private selected: DesignInfo[] = [];
  private deleting = false;
  private listDeleting = "";
  private langs = [
    { label: "日本語", value: "ja" },
    { label: "English", value: "en" },
    { label: "繁體中文", value: "zh" },
    { label: "한국", value: "ko" },
  ];

  private get designs(): DesignInfo[] {
    return (
      // eslint-disable-next-line no-undef
      this.userInfo?.favs.filter<DesignInfo>((f): f is DesignInfo => typeof f !== "string" && f !== null).reverse() ??
      []
    );
  }

  private get dreams(): DreamInfo[] {
    return (
      this.userInfo?.dreamFavs
        // eslint-disable-next-line no-undef
        ?.filter<DreamInfo>((f): f is DreamInfo => typeof f !== "string" && f !== null)
        .reverse() ?? []
    );
  }

  private get myDream() {
    return this.myDreams.length > 0 ? this.myDreams[0] : null;
  }

  private get myDesignLists(): DesignList[] {
    return AuthModule.lists ?? [];
  }

  private get profileUrl() {
    return this.user.photoURL?.replace("_normal.png", ".png");
  }

  private get canDelete() {
    return this.selected.length > 0;
  }

  private get locale() {
    return GeneralModule.locale;
  }

  private set locale(val: string) {
    GeneralModule.locale = val;
    setLocale(val);
    this.$vuetify.lang.current = val;
  }

  private created() {
    const user = AuthModule.user;
    assertIsDefined(user);
    this.user = user;
    this.$bind("userInfo", this.db.doc(`/users/${this.user.uid}`));
    const provData = this.user.providerData.find(p => p && p.providerId == "twitter.com");
    assertIsDefined(provData);
    const conTwitterRef = this.db.doc(`contributors/Twitter:${provData.uid}`);
    const conHostedRef = this.db.doc(`contributors/Hosted:${this.user.uid}`);
    this.$bind(
      "myDesigns",
      this.db.collection("designs").where("post.contributor", "in", [conTwitterRef, conHostedRef])
    );
    this.$bind("myDreams", this.db.collection("dreams").where("post.contributor", "==", conTwitterRef).limit(1));
  }

  private async signOut() {
    GeneralModule.loading = true;
    await AuthModule.signOut();
    GeneralModule.loading = false;
    this.$router.push("/signin");
  }

  private async deleteMe() {
    GeneralModule.loading = true;
    try {
      if (!this.user) {
        throw new Error("ログインしていません");
      }
      await this.user.delete();
    } catch (error) {
      await this.$dialog.error({
        text: this.$t("deactive.faild").toString(),
      });
    }
    GeneralModule.loading = false;
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
      text: this.$t("myMyDesigns.delete") + "<br/>" + titles.map(t => `<pre>${t}</pre><br/>`),
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
        text: this.$t("myDream.overwrite").toString(),
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
      text: this.$t("myDream.delete").toString(),
    });
    if (res) {
      this.deleting = true;
      assertIsDefined(this.myDream);
      await unregisterDreamInfo(this.myDream.dreamId);
      this.deleting = false;
    }
  }

  private async deleteList(list: DesignList & { id: string }) {
    this.listDeleting = list.id;
    await designListsRef.doc(list.id).delete();
    this.listDeleting = "";
  }

  private createList() {
    this.$dialog.show(CreateList, {
      showClose: false,
    });
  }

  private selectList(list: DesignList & { id: string }) {
    this.$router.push({
      name: "list",
      params: {
        id: list.id,
      },
    });
  }
}
</script>

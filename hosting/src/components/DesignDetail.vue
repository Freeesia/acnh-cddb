<template>
  <v-card tile flat class="pa-2">
    <v-img class="ma-2" :src="src" :lazy-src="lazySrc">
      <template v-slot:placeholder>
        <v-row class="fill-height" align="center" justify="center">
          <v-progress-circular indeterminate color="secondary" size="100"></v-progress-circular>
        </v-row>
      </template>
    </v-img>
    <v-card-title>{{ info.title }}</v-card-title>
    <v-card-subtitle>{{ info.designId }}</v-card-subtitle>
    <v-card-text>
      <v-chip
        v-for="tag in info.tags"
        :key="tag"
        small
        color="primary lighten-2"
        class="mx-1 accent--text"
        @click="selectTag(tag)"
      >
        <v-icon left small>tag</v-icon>
        {{ tag }}
      </v-chip>
    </v-card-text>
    <v-card-actions>
      <v-btn color="pink" rounded dark depressed :icon="faved" :loading="faving" @click="fav">
        <v-icon left>{{ faved ? "favorite" : "favorite_border" }}</v-icon>
        {{ faved ? "" : $t("detail.fav") }}
      </v-btn>
      <v-btn color="accent" rounded depressed @click="sheet = true">
        <v-icon left>playlist_add</v-icon>
        {{ $t("detail.list") }}
      </v-btn>
    </v-card-actions>
    <Tweet v-if="platform === 'Twitter'" :id="info.post.postId" :options="options" class="d-flex justify-center ma-2">
      <v-container fluid>
        <v-row align="center" justify="center">
          <v-progress-circular indeterminate color="secondary" size="100"></v-progress-circular>
        </v-row>
      </v-container>
    </Tweet>
    <instagram-embed v-if="platform === 'Instagram'" :url="instagramUrl" />
    <v-card v-if="postDesigns.length > 0" class="ma-2" outlined>
      <v-card-title>{{ $t("detail.together") }}</v-card-title>
      <v-container>
        <v-row dense>
          <v-col v-for="design in postDesigns" :key="design.designId" cols="6" sm="4">
            <DesignCard :info="design" @click="select" />
          </v-col>
        </v-row>
      </v-container>
    </v-card>
    <v-card v-if="userDesigns.length > 0" class="ma-2" outlined>
      <v-card-title>{{ $t("detail.sameUser") }}</v-card-title>
      <v-container>
        <v-row dense>
          <v-col v-for="design in userDesigns" :key="design.designId" cols="6" sm="4">
            <DesignCard :info="design" @click="select" />
          </v-col>
        </v-row>
      </v-container>
    </v-card>
    <v-bottom-sheet v-model="sheet">
      <v-list>
        <v-subheader>追加先</v-subheader>
        <v-list-item v-for="list in lists" :key="list.id" @click="toggleList(list)">
          <v-list-item-icon>
            <v-progress-circular v-if="listing" size="24" width="3" indeterminate></v-progress-circular>
            <v-icon v-else>{{ containsList(list) ? "check_box" : "check_box_outline_blank" }}</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>{{ list.name }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item @click="addList">
          <v-list-item-icon>
            <v-icon>add</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>新しいリストを追加</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-bottom-sheet>
  </v-card>
</template>
<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import InstagramEmbed from "vue-instagram-embed";
import { Prop, Watch, Emit } from "vue-property-decorator";
import { firestore } from "firebase/app";
import "firebase/firestore";
import { DesignInfo, DesignList } from "../../../core/src/models/types";
import { AuthModule, GeneralModule } from "../store";
import { assertIsDefined } from "../../../core/src/utilities/assert";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Tweet } = require("vue-tweet-embed");
import DesignCard from "./DesignCard.vue";
import DocRef = firestore.DocumentReference;
import FieldValue = firestore.FieldValue;
import { favDesign } from "../modules/gtag";
import AddList from "./AddList.vue";
import { designListsRef } from "../plugins/firestore";

@Component({ components: { Tweet, InstagramEmbed, DesignCard } })
export default class DesignDetail extends Vue {
  private readonly db = firestore();
  private readonly designsRef = this.db.collection("designs");
  private readonly options = {
    conversation: "none",
    lang: GeneralModule.locale,
  };

  @Prop()
  private info!: DesignInfo;
  private postDesigns: DesignInfo[] = [];
  private userDesigns: DesignInfo[] = [];
  private userRef!: DocRef;
  private platform = "";
  private faving = false;
  private sheet = false;
  private listing = false;

  private get src() {
    return this.info.imageUrls.large;
  }

  private get lazySrc() {
    return this.info.imageUrls.thumb2;
  }

  private get path() {
    return `designs/${this.info.designId}`;
  }

  private get favs() {
    return AuthModule.info?.favs || [];
  }

  private get faved() {
    return this.favs.includes(this.path);
  }

  private get instagramUrl() {
    return `https://www.instagram.com/p/${this.info.post.postId}/`;
  }

  private get lists(): DesignList[] {
    return AuthModule.lists ?? [];
  }

  private created() {
    const user = AuthModule.user;
    assertIsDefined(user);
    this.userRef = this.db.doc(`/users/${user.uid}`);
  }

  private async fav() {
    this.faving = true;
    const ref = this.db.doc(this.path);
    const arrayFunc = this.faved ? FieldValue.arrayRemove : FieldValue.arrayUnion;
    favDesign(this.$gtag, this.info, !this.faved);
    await this.userRef.update({
      favs: arrayFunc(ref),
    });
    this.faving = false;
  }

  @Watch("info", { immediate: true })
  private setPlatform() {
    this.platform = this.info.post.platform;
  }

  @Watch("info", { immediate: true })
  private async getRelatedDesigns() {
    const [res1, res2] = await Promise.all([
      this.designsRef.where("post.postId", "==", this.info.post.postId).get(),
      this.designsRef.where("post.contributor", "==", this.info.post.contributor).limit(8).get(),
    ]);
    if (!res1.empty) {
      this.postDesigns = res1.docs.filter(d => d.id !== this.info.designId).map(d => d.data()) as DesignInfo[];
    }
    if (!res2.empty) {
      const postIds = this.postDesigns.map(d => d.designId);
      this.userDesigns = res2.docs
        .filter(d => d.id !== this.info.designId && !postIds.includes(d.id))
        .map(d => d.data()) as DesignInfo[];
    }
  }

  @Emit()
  private select(info: DesignInfo) {
    this.platform = "";
    return info;
  }

  @Emit()
  private selectTag(tag: string) {
    return tag;
  }

  private containsList(list: DesignList) {
    return list.designs.includes(this.path);
  }

  private addList() {
    this.sheet = false;
    this.$dialog.show(AddList, {
      showClose: false,
      design: this.info.designId,
    });
  }
  private async toggleList(list: DesignList & { id: string }) {
    this.listing = true;
    const func = list.designs.includes(this.path) ? FieldValue.arrayRemove : FieldValue.arrayUnion;
    await designListsRef.doc(list.id).update({
      designs: func(this.designsRef.doc(this.info.designId)),
    });
    this.listing = false;
  }
}
</script>

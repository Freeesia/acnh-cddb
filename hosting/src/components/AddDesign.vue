<template>
  <v-card flat>
    <v-stepper v-model="step">
      <v-stepper-header>
        <v-stepper-step :complete="step > 1" step="1">SNSの選択</v-stepper-step>
        <v-divider></v-divider>
        <v-stepper-step :complete="step > 2" step="2">画像の選択</v-stepper-step>
        <v-divider></v-divider>
        <v-stepper-step step="3">投稿画像の情報</v-stepper-step>
      </v-stepper-header>

      <v-stepper-items>
        <v-stepper-content step="1">
          <v-btn color="success" :loading="getting" @click="login">Twitterから登録</v-btn>
        </v-stepper-content>

        <v-stepper-content step="2">
          <v-row dense>
            <v-col v-for="media in posts" :key="media.post.postId" cols="4">
              <v-card flat tile @click="select(media)">
                <v-img
                  :src="media.imageUrls.thumb2"
                  :lazy-src="media.imageUrls.thumb1"
                  aspect-ratio="1"
                  class="secondary"
                >
                  <template v-slot:placeholder>
                    <v-row class="fill-height ma-0" align="center" justify="center">
                      <v-progress-circular indeterminate color="accent"></v-progress-circular>
                    </v-row>
                  </template>
                </v-img>
              </v-card>
            </v-col>
          </v-row>
        </v-stepper-content>
        <v-stepper-content step="3">
          <FormDesign
            v-if="selected"
            ref="form"
            v-model="valid"
            :target="selected"
            :title.sync="title"
            :design-id.sync="designId"
            :design-type.sync="designType"
            :dominant-color-types.sync="dominantColorTypes"
            :author.sync="author"
            :author-id.sync="authorId"
            :island.sync="island"
          />
        </v-stepper-content>
      </v-stepper-items>
    </v-stepper>
    <v-card-actions>
      <v-btn outlined :disabled="step === 1 || posting" @click="back">戻る</v-btn>
      <v-spacer></v-spacer>
      <v-btn color="primary" :loading="posting" :disabled="step !== 3 || !valid" @click="post">投稿</v-btn>
      <v-btn text color="accent" :disabled="posting" @click="close">キャンセル</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Emit } from "vue-property-decorator";
import { auth } from "firebase/app";
import "firebase/auth";
import { assertIsDefined } from "../../../core/src/utilities/assert";
import { getTweetImages, registerDesignInfo } from "../plugins/functions";
import { UserMediaTweets, PostedMedia, DesignInfo, DesignType, ColorType } from "../../../core/src/models/types";
import { TweetUser } from "../../../core/src/models/twitterTypes";
import FormDesign from "./FormDesign.vue";

@Component({ components: { FormDesign } })
export default class AddDesign extends Vue {
  private step = 1;
  private posts: PostedMedia[] = [];
  private getting = false;
  private selected: PostedMedia | null = null;
  private posting = false;

  private title = "";
  private designId = "";
  private designType: DesignType = "マイデザイン";
  private dominantColorTypes: ColorType[] = [];
  private island = "";
  private author = "";
  private authorId = "";
  private valid = false;
  private contoributor?: TweetUser;

  private created() {
    auth().useDeviceLanguage();
  }

  private back() {
    this.step--;
  }

  private async login() {
    this.getting = true;
    const res = await auth().signInWithPopup(new auth.TwitterAuthProvider());
    const info = res.additionalUserInfo;
    assertIsDefined(info);
    const prof = info.profile as any;
    assertIsDefined(prof);
    this.contoributor = {
      id: prof.id_str,
      name: prof.name,
      screenName: prof.screen_name,
      platform: "Twitter",
    };
    const cred = res.credential as auth.OAuthCredential;
    assertIsDefined(cred);
    assertIsDefined(cred.accessToken);
    assertIsDefined(cred.secret);
    this.getImages(cred.accessToken, cred.secret);
  }

  private async getImages(token: string, secret: string) {
    const res = (await getTweetImages({ token, secret })) as UserMediaTweets;
    this.getting = false;
    this.step++;
    this.posts = res.posts;
  }

  private select(media: PostedMedia) {
    this.step++;
    this.selected = media;
  }

  private async post() {
    assertIsDefined(this.selected);
    assertIsDefined(this.contoributor);
    const form = this.$refs.form as FormDesign;
    if (!form.validate()) {
      return;
    }
    this.posting = true;
    const design: DesignInfo = {
      title: this.title,
      designId: "MO-" + this.designId,
      designType: this.designType,
      dominantColors: [],
      dominantColorTypes: this.dominantColorTypes,
      imageUrls: this.selected.imageUrls,
      post: this.selected.post,
      tags: [],
      createdAt: {},
    };
    design.post.contributor = this.contoributor;
    if (this.island && this.author && this.authorId) {
      design.author = {
        islandName: this.island + "島",
        authorName: this.author,
        authorId: "MA-" + this.authorId,
      };
    }
    await registerDesignInfo(design);
    this.close();
    this.posting = false;
  }

  @Emit("submit")
  private close() {}
}
</script>

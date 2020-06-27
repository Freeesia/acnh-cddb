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
          <v-row align="center" justify="center">
            <v-img
              v-if="selected"
              height="200"
              :src="selected.imageUrls.large"
              :lazy-src="selected.imageUrls.thumb2"
              class="secondary"
            >
              <template v-slot:placeholder>
                <v-row class="fill-height ma-0" align="center" justify="center">
                  <v-progress-circular indeterminate color="accent"></v-progress-circular>
                </v-row>
              </template>
            </v-img>
          </v-row>
          <v-form ref="form" v-model="valid" lazy-validation>
            <v-text-field v-model="title" :rules="[required]" required label="タイトル" />
            <v-select v-model="designType" :items="designTypes" required label="デザインタイプ" />
            <v-text-field
              v-model="designId"
              v-facade="designIdMask"
              :rules="[required, countId]"
              prefix="MO-"
              required
              label="デザインID"
            />
            <v-select
              v-model="dominantColorTypes"
              :items="colors"
              :rules="[limitColorTypes]"
              deletable-chips
              chips
              dense
              multiple
              required
              label="テーマカラー"
            />
            <v-text-field v-model="author" :error="authorError" :error-messages="authorErrorMessage" label="作者名" />
            <v-text-field
              v-model="island"
              :error="authorError"
              :error-messages="authorErrorMessage"
              suffix="島"
              label="島名"
            />
            <v-text-field
              v-model="authorId"
              v-facade="authorIdMask"
              :error="authorError"
              :error-messages="authorErrorMessage"
              :rules="[countId]"
              prefix="MA-"
              label="作者ID"
            />
          </v-form>
        </v-stepper-content>
      </v-stepper-items>
    </v-stepper>
    <v-card-actions>
      <v-btn outlined :disabled="step === 1 || posting" @click="back">戻る</v-btn>
      <v-spacer></v-spacer>
      <v-btn color="primary" :loading="posting" :disabled="step !== 3 || !valid" @click="post">
        投稿
      </v-btn>
      <v-btn text color="accent" :disabled="posting" @click="close">キャンセル</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Emit, Watch } from "vue-property-decorator";
import { auth } from "firebase/app";
import "firebase/auth";
import { assertIsDefined } from "../../../core/src/utilities/assert";
import { getTweetImages, registerDesignInfo } from "../plugins/functions";
import {
  UserMediaTweets,
  PostedMedia,
  DesignInfo,
  DesignType,
  DesignTypes,
  ColorType,
  ColorTypes,
} from "../../../core/src/models/types";
import { TweetUser } from "../../../core/src/models/twitterTypes";

@Component({})
export default class AddDesign extends Vue {
  private step = 1;
  private posts: PostedMedia[] = [];
  private getting = false;
  private selected: PostedMedia | null = null;
  private posting = false;
  private designTypes = DesignTypes;
  private designIdMask = "DDDD-DDDD-DDDD";
  private colors = ColorTypes;
  private authorIdMask = "####-####-####";

  private title = "";
  private designId = "";
  private designType: DesignType = "マイデザイン";
  private dominantColorTypes: ColorType[] = [];
  private island = "";
  private author = "";
  private authorId = "";
  private valid = false;
  private authorError = false;
  private authorErrorMessage = "";
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

  private required(v?: string) {
    return !!v || "入力してください";
  }

  private countId(v?: string) {
    return !v || v.length === 14 || "IDに必要な文字数を満たしていません";
  }

  private limitColorTypes(v: ColorType[]) {
    return v.length <= 2 || "選択できるカラーは2つまでです";
  }

  @Watch("island")
  @Watch("author")
  @Watch("authorId")
  private checkAllAuthorInfo() {
    const authors = [this.island, this.author, this.authorId];
    this.authorError = !(authors.every(v => v) || authors.every(v => !v));
    if (this.authorError) {
      this.authorErrorMessage = "作者情報はオプションです。入力する場合は全て埋めてください。";
    } else {
      this.authorErrorMessage = "";
    }
  }

  private async post() {
    assertIsDefined(this.selected);
    assertIsDefined(this.contoributor);
    const form = this.$refs.form as any;
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

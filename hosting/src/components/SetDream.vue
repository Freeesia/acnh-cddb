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
          <section>登録する画像を含んだツイートを選択してください</section>
          <v-row dense>
            <v-col v-for="post in posts" :key="post.postId" cols="12">
              <v-card @click="select(post)">
                <v-row dense>
                  <v-col v-for="(urls, i) in post.imageUrls" :key="i" :cols="isWide(i, post.imageUrls.length) ? 12 : 6">
                    <v-img
                      :src="urls.thumb2"
                      :lazy-src="urls.thumb1"
                      :aspect-ratio="isWide(i, post.imageUrls.length) ? 2 : 1"
                      class="secondary"
                    >
                      <template v-slot:placeholder>
                        <v-row class="fill-height ma-0" align="center" justify="center">
                          <v-progress-circular indeterminate color="accent"></v-progress-circular>
                        </v-row>
                      </template>
                    </v-img>
                  </v-col>
                </v-row>
                <v-card-text>
                  <p>{{ post.text }}</p>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-stepper-content>

        <v-stepper-content step="3">
          <v-row v-if="selected" dense align="center" justify="center">
            <v-col
              v-for="(urls, i) in selected.imageUrls"
              :key="i"
              :cols="isWide(i, selected.imageUrls.length) ? 12 : 6"
            >
              <v-img
                :src="urls.thumb2"
                :lazy-src="urls.thumb1"
                :aspect-ratio="isWide(i, selected.imageUrls.length) ? 2 : 1"
                class="secondary"
              >
                <template v-slot:placeholder>
                  <v-row class="fill-height ma-0" align="center" justify="center">
                    <v-progress-circular indeterminate color="accent"></v-progress-circular>
                  </v-row>
                </template>
              </v-img>
            </v-col>
          </v-row>
          <v-form ref="form" v-model="valid" lazy-validation>
            <v-text-field v-model="island" :rules="[required]" suffix="島" label="島名" />
            <v-text-field
              v-model="dreamId"
              v-facade="dreamIdMask"
              :rules="[required, countId]"
              prefix="DA-"
              required
              label="夢番地"
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
import { Emit, Prop } from "vue-property-decorator";
import { auth } from "firebase/app";
import "firebase/auth";
import { assertIsDefined } from "../../../core/src/utilities/assert";
import { registerDreamInfo, getTweets, unregisterDreamInfo } from "../plugins/functions";
import { DreamInfo, PostedTweet } from "../../../core/src/models/types";
import { TweetUser } from "../../../core/src/models/twitterTypes";

@Component({})
export default class SetDream extends Vue {
  private step = 1;
  private posts: PostedTweet[] = [];
  private getting = false;
  private selected: PostedTweet | null = null;
  private posting = false;
  private dreamIdMask = "####-####-####";

  private dreamId = "";
  private island = "";
  private valid = false;
  private contoributor?: TweetUser;
  private cred: auth.OAuthCredential | null = null;

  @Prop({ type: String, default: "" })
  private oldId!: string;

  private created() {
    auth().useDeviceLanguage();
  }

  private back() {
    this.step--;
  }

  private async login() {
    console.log("oldId:" + this.oldId);
    this.getting = true;
    if (!this.cred) {
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
      this.cred = res.credential as auth.OAuthCredential;
    }
    assertIsDefined(this.cred);
    assertIsDefined(this.cred.accessToken);
    assertIsDefined(this.cred.secret);
    this.getTweets(this.cred.accessToken, this.cred.secret);
  }

  private async getTweets(token: string, secret: string) {
    const res = (await getTweets({ token, secret })) as PostedTweet[];
    this.getting = false;
    this.step++;
    this.posts = res;
  }

  private select(post: PostedTweet) {
    this.step++;
    this.selected = post;
  }

  private required(v?: string) {
    return !!v || "入力してください";
  }

  private countId(v?: string) {
    return !v || v.length === 14 || "IDに必要な文字数を満たしていません";
  }

  private async post() {
    assertIsDefined(this.selected);
    assertIsDefined(this.contoributor);
    const form = this.$refs.form as any;
    if (!form.validate()) {
      return;
    }
    this.posting = true;
    const dream: DreamInfo = {
      dreamId: "DA-" + this.dreamId,
      islandName: this.island + "島",
      imageUrls: this.selected.imageUrls,
      post: {
        contributor: this.selected.contributor,
        postId: this.selected.postId,
        text: this.selected.text,
        fromSwitch: this.selected.fromSwitch,
        platform: this.selected.platform,
      },
      tags: this.selected.tags,
      createdAt: {},
    };
    dream.post.contributor = this.contoributor;
    if (this.oldId) {
      await unregisterDreamInfo(this.oldId);
    }
    await registerDreamInfo(dream);
    this.close();
    this.posting = false;
  }

  @Emit("submit")
  private close() {}

  private isWide(index: number, count: number) {
    if (count % 2 === 0) {
      return false;
    }
    return index + 1 === count;
  }
}
</script>

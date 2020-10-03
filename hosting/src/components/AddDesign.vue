<template>
  <v-card flat>
    <v-stepper v-model="step">
      <v-stepper-header>
        <v-stepper-step :complete="step > 1" step="1">{{ $t("add.selectProvider") }}</v-stepper-step>
        <v-divider></v-divider>
        <v-stepper-step :complete="step > 2" step="2">{{ $t("add.selectImage") }}</v-stepper-step>
        <v-divider></v-divider>
        <v-stepper-step step="3">{{ $t("add.editInfo") }}</v-stepper-step>
      </v-stepper-header>

      <v-stepper-items>
        <v-stepper-content step="1">
          <v-row dense>
            <v-col cols="12">
              <v-btn color="success" :loading="getting" @click="login">{{ $t("add.fromTwitter") }}</v-btn>
            </v-col>
            <v-col cols="12">
              <v-btn color="success" @click="upload">{{ $t("add.fromHosted") }}</v-btn>
            </v-col>
          </v-row>
        </v-stepper-content>

        <v-stepper-content step="2">
          <component :is="imageType" ref="imgs" @select="select" />
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
            :tags.sync="tags"
            :author.sync="author"
            :author-id.sync="authorId"
            :island.sync="island"
          />
        </v-stepper-content>
      </v-stepper-items>
    </v-stepper>
    <v-card-actions>
      <v-btn outlined :disabled="step === 1 || posting" @click="back">{{ $t("add.back") }}</v-btn>
      <v-spacer></v-spacer>
      <v-btn color="primary" :loading="posting" :disabled="step !== 3 || !valid" @click="post">
        {{ $t("add.submit") }}
      </v-btn>
      <v-btn text color="accent" :disabled="posting" @click="close">{{ $t("add.cancel") }}</v-btn>
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
import { registerDesignInfo } from "../plugins/functions";
import { PostedMedia, DesignInfo, DesignType, ColorType, Contributor } from "../../../core/src/models/types";
import { TweetUser } from "../../../core/src/models/twitterTypes";
import FormDesign from "./FormDesign.vue";
import SelectTweetImage from "./SelectTweetImage.vue";
import UploadImage from "./UploadImage.vue";
import { AuthModule } from "../store";

@Component({ components: { FormDesign, SelectTweetImage, UploadImage } })
export default class AddDesign extends Vue {
  private step = 1;
  private imageType: string | null = null;
  private getting = false;
  private selected: PostedMedia | null = null;
  private posting = false;

  private title = "";
  private designId = "";
  private designType: DesignType = "マイデザイン";
  private dominantColorTypes: ColorType[] = [];
  private tags: string[] = [];
  private island = "";
  private author = "";
  private authorId = "";
  private valid = false;
  private contoributor?: Contributor;

  private created() {
    auth().useDeviceLanguage();
  }

  private back() {
    this.step--;
  }

  private async login() {
    this.getting = true;
    this.imageType = "SelectTweetImage";
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
    } as TweetUser;
    const cred = res.credential as auth.OAuthCredential;
    assertIsDefined(cred);
    assertIsDefined(cred.accessToken);
    assertIsDefined(cred.secret);
    const imgs = this.$refs.imgs as SelectTweetImage;
    await imgs.getImages(cred.accessToken, cred.secret);
    this.getting = false;
    this.step++;
  }

  private upload() {
    assertIsDefined(AuthModule.user);
    this.contoributor = {
      id: AuthModule.user.uid,
      screenName: AuthModule.user.displayName ?? "",
      platform: "Hosted",
    };
    this.imageType = "UploadImage";
    this.step++;
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
      ...this.selected,
      title: this.title,
      designId: "MO-" + this.designId,
      designType: this.designType,
      dominantColors: [],
      dominantColorTypes: this.dominantColorTypes,
      tags: this.tags,
      createdAt: {},
    };
    design.post.contributor = this.contoributor;
    if (this.island && this.author && this.authorId) {
      design.author = {
        islandName: this.island + this.$t("islandSuffix"),
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

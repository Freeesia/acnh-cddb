<template>
  <v-card>
    <VueFileAgent v-model="file" accept="image/*" :help-text="$t('upload.selectImage')" />
    <v-card-actions>
      <v-spacer />
      <v-btn depressed color="primary" :disabled="!file" :loading="uploading" @click="upload">
        {{ $t("upload.upload") }}
        <template v-slot:loader>
          {{ $t("upload.uploading") }}
          <v-progress-linear
            top
            absolute
            rounded
            color="secondary"
            :query="query"
            :indeterminate="indeterminate"
            :value="progress"
          />
        </template>
      </v-btn>
    </v-card-actions>
  </v-card>
</template>
<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { storage } from "firebase/app";
import "firebase/storage";
import { AuthModule } from "../store";
import { assertIsDefined } from "../../../core/src/utilities/assert";
import UploadTask = storage.UploadTask;
import { Emit } from "vue-property-decorator";
import { HostedMedia } from "../../../core/src/models/types";
import { RawFileRecord } from "vue-file-agent/types/src/lib/file-record";
import { v4 as uuidv4 } from "uuid";

@Component
export default class UploadImage extends Vue {
  private file: RawFileRecord | null = null;
  private progress = 0;
  private task: UploadTask | null = null;
  private uploading = false;
  private indeterminate = true;

  private get ref() {
    assertIsDefined(AuthModule.user);
    return storage().ref(`${AuthModule.user.uid}/designs/`);
  }

  private get query() {
    return this.progress === 0;
  }

  private upload() {
    assertIsDefined(this.file);
    this.uploading = true;
    this.task = this.ref.child(`${uuidv4()}.${this.file.ext}`).put(this.file.file);
    this.task.on(
      "state_changed",
      sp => {
        this.indeterminate = false;
        this.progress = Math.floor((sp.bytesTransferred / sp.totalBytes) * 100);
      },
      null,
      this.completeUpload
    );
  }

  private async completeUpload() {
    this.indeterminate = true;
    this.progress = 100;
    assertIsDefined(this.task);
    this.select({
      path: this.task.snapshot.ref.fullPath,
      imageUrls: {
        large: await this.task.snapshot.ref.getDownloadURL(),
      },
      post: {
        contributor: "",
        postId: "",
        fromSwitch: false,
        platform: "Hosted",
      },
      createdAt: new Date(this.task.snapshot.metadata.timeCreated),
    });
    this.uploading = false;
    this.progress = 0;
  }

  @Emit()
  private select(media: HostedMedia) {
    return media;
  }
}
</script>

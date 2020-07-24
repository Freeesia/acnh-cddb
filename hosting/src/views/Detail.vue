<template>
  <DesignDetail v-if="info" :info="info" @select="select" @select-tag="selectTag"></DesignDetail>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { PropSync, Watch } from "vue-property-decorator";
import { firestore } from "firebase/app";
import "firebase/firestore";
import DesignDetail from "../components/DesignDetail.vue";
import { DesignInfo } from "../../../core/src/models/types";

@Component({ components: { DesignDetail } })
export default class Detail extends Vue {
  private readonly db = firestore();
  private info: DesignInfo | null = null;

  @PropSync("id", { required: true, type: String })
  private syncedId!: string;

  @Watch("syncedId", { immediate: true })
  private async getDoc() {
    const doc = await this.db.doc(`designs/${this.syncedId}`).get();
    this.info = doc.data() as DesignInfo;
  }

  private select(info: DesignInfo) {
    this.$router.push({
      name: "detail",
      params: {
        id: info.designId,
      },
    });
  }

  private selectTag(tag: string) {
    this.$router.push({
      name: "home",
      query: { tag },
    });
  }
}
</script>

<template>
  <component :is="style" :close-on-content-click="false" absolute :position-x="x" :position-y="y" :value="value">
    <v-list>
      <v-subheader>{{ $t("designList.add") }}</v-subheader>
      <v-list-item v-for="list in lists" :key="list.id" @click="toggleList(list)">
        <v-list-item-icon>
          <v-progress-circular v-if="listing == list.id" size="24" width="3" indeterminate></v-progress-circular>
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
          <v-list-item-title>{{ $t("designList.new") }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </component>
</template>
<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Model, Prop } from "vue-property-decorator";
import { DesignInfo, DesignList } from "../../../core/src/models/types";
import { designListsRef, designsRef } from "../plugins/firestore";
import { AuthModule } from "../store";
import CreateList from "./CreateList.vue";
import { firestore } from "firebase/app";
import "firebase/firestore";
import FieldValue = firestore.FieldValue;
import { VBottomSheet, VMenu } from "vuetify/lib";

@Component({ components: { VBottomSheet, VMenu } })
export default class DesignListSheet extends Vue {
  private listing = "";

  @Model("change", { type: Boolean })
  private readonly value!: boolean;

  @Prop({ required: true, type: Number })
  private readonly x!: number;

  @Prop({ required: true, type: Number })
  private readonly y!: number;

  @Prop({ required: true })
  private info!: DesignInfo;

  private get path() {
    return `designs/${this.info.designId}`;
  }

  private get lists(): DesignList[] {
    return AuthModule.lists ?? [];
  }

  private get style() {
    return this.$vuetify.breakpoint.smAndUp ? "v-menu" : "v-bottom-sheet";
  }

  private containsList(list: DesignList) {
    return list.designs.includes(this.path);
  }

  private addList() {
    this.$emit("change", false);
    this.$dialog.show(CreateList, {
      showClose: false,
      design: this.info.designId,
    });
  }

  private async toggleList(list: DesignList & { id: string }) {
    this.listing = list.id;
    const func = list.designs.includes(this.path) ? FieldValue.arrayRemove : FieldValue.arrayUnion;
    await designListsRef.doc(list.id).update({
      designs: func(designsRef.doc(this.info.designId)),
    });
    this.listing = "";
  }
}
</script>

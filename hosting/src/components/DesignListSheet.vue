<template>
  <v-bottom-sheet :value="value" @input="$emit('change', $event)">
    <v-list>
      <v-subheader>追加先</v-subheader>
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
          <v-list-item-title>新しいリストを追加</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-bottom-sheet>
</template>
<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Model, Prop } from "vue-property-decorator";
import { DesignInfo, DesignList } from "../../../core/src/models/types";
import { designListsRef, designsRef } from "../plugins/firestore";
import { AuthModule } from "../store";
import AddList from "./AddList.vue";
import { firestore } from "firebase/app";
import "firebase/firestore";
import FieldValue = firestore.FieldValue;

@Component
export default class DesignListSheet extends Vue {
  private listing = "";

  @Model("change", { type: Boolean })
  private readonly value!: boolean;

  @Prop({ required: true })
  private info!: DesignInfo;

  private get path() {
    return `designs/${this.info.designId}`;
  }

  private get lists(): DesignList[] {
    return AuthModule.lists ?? [];
  }

  private input(ev: Event) {
    console.log(ev);
  }

  private containsList(list: DesignList) {
    return list.designs.includes(this.path);
  }

  private addList() {
    this.$emit("change", false);
    this.$dialog.show(AddList, {
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

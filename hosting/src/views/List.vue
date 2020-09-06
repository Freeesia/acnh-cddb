<template>
  <v-container fluid>
    <v-alert v-if="error" type="warning">リストが公開されていないか、存在しません。</v-alert>
    <v-card v-if="list" flat>
      <v-card-title>
        <div>{{ list.name }}</div>
        <v-icon class="mx-1" small>{{ list.isPublic ? "public" : "lock" }}</v-icon>
        <v-chip class="mx-2" small>{{ list.designs.length }}</v-chip>
        <v-btn v-if="sharable && list.isPublic" icon @click="share">
          <v-icon>share</v-icon>
        </v-btn>
      </v-card-title>
    </v-card>
    <v-row dense>
      <v-col v-for="design in designs" :key="design.id" cols="6" sm="3" md="2">
        <DesignCard v-long-press="300" :info="design" @click="select" @long-press-start="onLongPressStart(design)" />
      </v-col>
    </v-row>
    <v-bottom-sheet v-model="sheet">
      <v-list>
        <v-subheader>操作メニュー</v-subheader>
        <v-list-item @click="deleteDesign">
          <v-list-item-icon>
            <v-icon>delete</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>削除</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-bottom-sheet>
  </v-container>
</template>
<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";
import { DesignInfo, DesignList } from "../../../core/src/models/types";
import DesignDetail from "../components/DesignDetail.vue";
import DesignCard from "../components/DesignCard.vue";
import { designListsRef, designsRef } from "../plugins/firestore";
import { AuthModule, GeneralModule } from "../store";
import assert from "assert";
import { firestore } from "firebase/app";
import "firebase/firestore";
import FieldValue = firestore.FieldValue;
import LongPress from "vue-directive-long-press";
import { assertIsDefined } from "../../../core/src/utilities/assert";

@Component({ components: { DesignCard }, directives: { LongPress } })
export default class List extends Vue {
  @Prop({ required: true, type: String })
  private readonly id!: string;
  private readonly list: DesignList | null = null;
  private readonly sharable = navigator.share !== undefined;
  private error = false;
  private sheet = false;
  private selecting: DesignInfo | null = null;

  private get designs(): DesignInfo[] {
    return (
      // eslint-disable-next-line no-undef
      this.list?.designs.filter<DesignInfo>((f): f is DesignInfo => typeof f !== "string" && f !== null).reverse() ?? []
    );
  }

  private get isOwner() {
    return AuthModule.user && this.list && AuthModule.user.uid === this.list.owner;
  }

  private async mounted() {
    GeneralModule.setLoading(true);
    try {
      await this.$bind("list", designListsRef.doc(this.id), { maxRefDepth: 2 });
    } catch (error) {
      this.error = true;
    }
    GeneralModule.setLoading(false);
  }

  private onLongPressStart(info: DesignInfo) {
    if (!this.isOwner) {
      return;
    }
    this.selecting = info;
    this.sheet = true;
  }
  private async deleteDesign() {
    assert(this.isOwner);
    assert(this.selecting);
    this.sheet = false;
    GeneralModule.setLoading(true);
    try {
      await designListsRef.doc(this.id).update({
        designs: FieldValue.arrayRemove(designsRef.doc(this.selecting.designId)),
      });
    } catch (error) {
      this.$dialog.notify.error("リストから削除出来ませんでした");
    }
    GeneralModule.setLoading(false);
  }

  private async select(info: DesignInfo) {
    if (this.sheet) {
      return;
    }
    this.$gtag.event("select_item", {
      items: [
        {
          item_id: info.designId,
          item_name: info.title,
          item_category: info.designType,
          item_brand: info.author?.authorId,
        },
      ],
    });
    if (this.$vuetify.breakpoint.smAndUp) {
      const doc = await designsRef.doc(info.designId).get();
      const data = doc.data();
      this.$dialog.show(DesignDetail, {
        info: data,
        width: 600,
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
  private async share() {
    assertIsDefined(this.list);
    try {
      await navigator.share({
        title: this.list.name,
        text: `#あつまれマイデザの🌳#マイデザ #ACNH #あつ森 #あつまれどうぶつの森`,
        url: `${process.env.VUE_APP_DOMAIN}list/${this.id}`,
      });
    } catch (error) {
      // 特に何もしない
    }
  }
}
</script>

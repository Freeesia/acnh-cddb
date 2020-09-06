<template>
  <v-container v-if="list" fluid>
    <v-card flat>
      <v-card-title>
        <div>{{ list.name }}</div>
        <v-icon class="mx-1" small>{{ list.isPublic ? "public" : "lock" }}</v-icon>
        <v-chip class="mx-2" small>{{ list.designs.length }}</v-chip>
      </v-card-title>
    </v-card>
    <v-row dense>
      <v-col v-for="design in designs" :key="design.id" cols="6" sm="3" md="2">
        <DesignCard :info="design" @click="select" />
      </v-col>
    </v-row>
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

@Component({ components: { DesignCard } })
export default class List extends Vue {
  @Prop({ required: true, type: String })
  private readonly id!: string;
  private readonly list: DesignList | null = null;

  private get designs(): DesignInfo[] {
    return (
      // eslint-disable-next-line no-undef
      this.list?.designs.filter<DesignInfo>((f): f is DesignInfo => typeof f !== "string" && f !== null).reverse() ?? []
    );
  }

  private mounted() {
    this.$bind("list", designListsRef.doc(this.id), { maxRefDepth: 2 });
  }

  private async select(info: DesignInfo) {
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
}
</script>

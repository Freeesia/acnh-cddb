<template>
  <v-container fluid>
    <v-alert v-if="error" type="warning">{{ $t("list.noData") }}</v-alert>
    <v-card v-if="list" flat>
      <v-card-title>
        <div>{{ list.name }}</div>
        <v-icon class="mx-1" small>{{ list.isPublic ? "public" : "lock" }}</v-icon>
        <v-chip class="mx-2" small>{{ list.designs.length }}</v-chip>
        <v-btn v-if="isOwner" icon @click="edit">
          <v-icon>edit</v-icon>
        </v-btn>
        <v-btn v-if="sharable && list.isPublic" icon @click="share">
          <v-icon>share</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text>
        {{ list.description }}
      </v-card-text>
      <v-card-actions class="share-network-list">
        <ShareNetwork
          v-for="network in networks"
          :key="network.network"
          :network="network.network"
          :style="{ backgroundColor: network.color }"
          :url="url"
          :title="list.name"
          :hashtags="tags.join(',')"
        >
          <v-fa :icon="network.icon" fixed-width class="fah pa-1" size="lg" />
          <span class="mx-1">{{ network.name }}</span>
        </ShareNetwork>
      </v-card-actions>
    </v-card>
    <v-row dense>
      <v-col v-for="design in designs" :key="design.id" cols="6" sm="3" md="2">
        <DesignCard v-alt-action="300" :info="design" @click="select" @alt-action="raiseMenu($event, design)" />
      </v-col>
    </v-row>
    <DesignListSheet v-if="menu" v-model="menu" :info="selecting" :x="menuX" :y="menuY" />
  </v-container>
</template>
<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";
import { DesignInfo, DesignList } from "../../../core/src/models/types";
import DesignDetail from "../components/DesignDetail.vue";
import DesignCard from "../components/DesignCard.vue";
import DesignListSheet from "../components/DesignListSheet.vue";
import { designListsRef, designsRef } from "../plugins/firestore";
import { AuthModule, GeneralModule } from "../store";
import { assertIsDefined } from "../../../core/src/utilities/assert";
import AltAction from "../directives/altActionDirective";
import EditList from "../components/EditList.vue";

@Component({ components: { DesignCard, DesignListSheet }, directives: { AltAction } })
export default class List extends Vue {
  @Prop({ required: true, type: String })
  private readonly id!: string;
  private readonly list: DesignList | null = null;
  private readonly sharable = navigator.share !== undefined;
  private error = false;
  private menu = false;
  private menuX = 0;
  private menuY = 0;
  private selecting: DesignInfo | null = null;
  private networks = [
    { network: "twitter", name: "Twitter", icon: ["fab", "twitter"], color: "#1da1f2" },
    { network: "facebook", name: "Facebook", icon: ["fab", "facebook-f"], color: "#1877f2" },
    { network: "line", name: "Line", icon: ["fab", "line"], color: "#00c300" },
    { network: "reddit", name: "Reddit", icon: ["fab", "reddit"], color: "#ff4500" },
    { network: "tumblr", name: "Tumblr", icon: ["fab", "tumblr"], color: "#35465c" },
    { network: "weibo", name: "Weibo", icon: ["fab", "weibo"], color: "#e9152d" },
    { network: "whatsapp", name: "Whatsapp", icon: ["fab", "whatsapp"], color: "#25d366" },
  ];
  private readonly tags = [
    "あつまれマイデザの🌳",
    "マイデザイン",
    "マイデザ",
    "マイデザまとめ",
    "ACNH",
    "あつ森",
    "あつまれどうぶつの森",
    "我的設計",
    "動物森友會",
    "동물의숲",
    "마이디자인",
  ];

  private get url() {
    return `${process.env.VUE_APP_DOMAIN}list/${this.id}`;
  }

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
    GeneralModule.loading = true;
    try {
      await this.$bind("list", designListsRef.doc(this.id), { maxRefDepth: 2 });
    } catch (error) {
      this.error = true;
    }
    GeneralModule.loading = false;
  }

  private raiseMenu(ev: MouseEvent, info: DesignInfo) {
    if (!this.isOwner) {
      return;
    }
    this.menuX = ev.clientX;
    this.menuY = ev.clientY;
    this.selecting = info;
    this.menu = true;
  }

  private async select(info: DesignInfo) {
    if (this.menu) {
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

  private edit() {
    assertIsDefined(this.list);
    this.$dialog.show(EditList, {
      showClose: false,
      id: this.id,
      public: this.list.isPublic,
      name: this.list.name,
      description: this.list.description,
    });
  }

  private async share() {
    assertIsDefined(this.list);
    try {
      await navigator.share({
        title: this.list.name,
        text: this.list.description + "\n" + this.tags.map(t => "#" + t).join(" "),
        url: this.url,
      });
    } catch (error) {
      // 特に何もしない
    }
  }
}
</script>
<style lang="scss">
.share-network-list {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  max-width: 1000px;
  margin: auto;
}
a[class^="share-network-"] {
  flex: none;
  color: #ffffff;
  background-color: #333;
  border-radius: 3px;
  overflow: hidden;
  display: flex;
  flex-direction: row;
  align-content: center;
  align-items: center;
  cursor: pointer;
  margin: 0 4px 4px 0;
}

a[class^="share-network-"] .fah {
  background-color: rgba(0, 0, 0, 0.2);
  flex: 0 1 auto;
}

a[class^="share-network-"] span {
  flex: 1 1 0%;
  font-weight: 500;
}
</style>

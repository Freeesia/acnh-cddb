<template>
  <v-card>
    <v-card-subtitle>リスト名を入力してください</v-card-subtitle>
    <v-form v-model="valid" class="mx-4">
      <v-text-field v-model="name" :rules="nameRules" label="名前" required></v-text-field>
      <v-checkbox v-model="public" label="他のユーザーに公開する"></v-checkbox>
    </v-form>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn color="accent" text :disabled="!valid" :loading="creating" @click="submit">作成</v-btn>
    </v-card-actions>
  </v-card>
</template>
<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Emit, Prop } from "vue-property-decorator";
import { createDreamList } from "../plugins/functions";

@Component
export default class AddList extends Vue {
  @Prop({ required: true, type: String })
  private dream!: string;
  private valid = true;
  private name = "";
  private nameRules = [(v: any) => !!v || "必須"];
  private public = true;
  private creating = false;

  @Emit()
  private async submit() {
    this.creating = true;
    await createDreamList(this.name, this.public, this.dream);
    this.creating = false;
  }
}
</script>

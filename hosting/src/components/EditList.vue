<template>
  <v-card>
    <v-card-subtitle>リスト名を入力してください</v-card-subtitle>
    <v-form ref="form" v-model="valid" class="mx-4">
      <v-text-field v-model="_name" :rules="nameRules" label="名前" required></v-text-field>
      <v-textarea v-model="_description" label="説明"></v-textarea>
      <v-checkbox v-model="_public" label="他のユーザーに公開する"></v-checkbox>
    </v-form>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn color="accent" text :disabled="!valid" :loading="creating" @click="submit">
        {{ id ? "OK" : "作成" }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>
<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Emit, Prop, Watch } from "vue-property-decorator";
import { createDesignList } from "../plugins/functions";
import { designListsRef } from "../plugins/firestore";

@Component
export default class EditList extends Vue {
  @Prop({ type: String })
  private readonly id!: string;
  @Prop({ type: String })
  private readonly design!: string;
  @Prop({ type: String, default: "" })
  private readonly name!: string;
  @Prop({ type: String, default: "" })
  private readonly description!: string;
  @Prop({ type: Boolean, default: true })
  private readonly public!: boolean;
  private valid = true;
  private nameRules = [(v: any) => !!v || "必須"];
  private creating = false;
  private _name = "";
  private _description = "";
  private _public = true;

  @Watch("name", { immediate: true })
  private nameChanged() {
    this._name = this.name;
  }

  @Watch("description", { immediate: true })
  private descriptionChanged() {
    this._description = this.description;
  }

  @Watch("public", { immediate: true })
  private publicChanged() {
    this._public = this.public;
  }

  @Emit()
  private async submit() {
    const form = this.$refs.form as any;
    if (!form.validate()) {
      return;
    }
    this.creating = true;
    if (this.id) {
      await designListsRef.doc(this.id).update({
        name: this._name,
        description: this._description,
        isPublic: this._public,
      });
    } else {
      await createDesignList(this._name, this._description ?? "", this._public, this.design);
      if (this.design) {
        this.$dialog.notify.success(`${this._name} に追加しました`);
      }
    }
    this.creating = false;
  }
}
</script>

<template>
  <v-card flat>
    <v-stepper v-model="e1">
      <v-stepper-header>
        <v-stepper-step :complete="e1 > 1" step="1">Name of step 1</v-stepper-step>

        <v-divider></v-divider>

        <v-stepper-step :complete="e1 > 2" step="2">Name of step 2</v-stepper-step>

        <v-divider></v-divider>

        <v-stepper-step step="3">Name of step 3</v-stepper-step>
      </v-stepper-header>

      <v-stepper-items>
        <v-stepper-content step="1">
          <v-card class="mb-12" color="grey lighten-1" height="200px"></v-card>
        </v-stepper-content>

        <v-stepper-content step="2">
          <v-card class="mb-12" color="grey lighten-1" height="200px"></v-card>
        </v-stepper-content>

        <v-stepper-content step="3">
          <v-card class="mb-12" color="grey lighten-1" height="200px"></v-card>
        </v-stepper-content>
      </v-stepper-items>
    </v-stepper>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn color="primary" :loading="posting" @click="next">
        Continue
      </v-btn>
      <v-btn text @click="close">Cancel</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Emit } from "vue-property-decorator";
import { sleep } from "../../../core/src/utilities/systemUtility";

@Component({})
export default class AddDesign extends Vue {
  private e1 = 1;
  private posting = false;

  private next() {
    if (this.e1 === 3) {
      this.post();
    } else {
      this.e1++;
    }
  }

  private async post() {
    this.posting = true;
    await sleep(3000);
    this.close();
  }

  @Emit("submit")
  private close() {}
}
</script>

import { VueGtag } from "vue-gtag";
import { DesignInfo } from "@core/models/types";

export function favDesign(gtag: VueGtag, design: DesignInfo, fav: boolean) {
  gtag.event(fav ? "add_to_fav" : "remove_from_fav", {
    items: [
      {
        item_id: design.designId,
        item_name: design.title,
        item_category: design.designType,
        item_brand: design.author?.authorId,
      },
    ],
    event_category: "design",
  });
}

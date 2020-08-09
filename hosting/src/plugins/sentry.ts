import Vue from "vue";
import * as Sentry from "@sentry/browser";
import { Vue as VueIntegration } from "@sentry/integrations";

if (process.env.NODE_ENV === "production") {
  Sentry.init({
    dsn: "https://61a8039368bf423190c6cecbb0a126ea@o351180.ingest.sentry.io/5309536",
    integrations: [new VueIntegration({ Vue, attachProps: true })],
  });
}

export default Sentry;

import { app } from "./app.js";
import { config } from "./config.js";

app.listen(config.port, "127.0.0.1", () => {
  console.log(`REST API is running on http://127.0.0.1:${config.port}`);
});

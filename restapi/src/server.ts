import { app } from "./app.js";
import { config } from "./config.js";
import fs from "node:fs";
import https from "node:https";
import path from "node:path";

if (config.https) {
  const key = fs.readFileSync(path.resolve(config.sslKeyPath));
  const cert = fs.readFileSync(path.resolve(config.sslCertPath));

  https.createServer({ key, cert, passphrase: config.sslPassphrase }, app).listen(config.port, config.host, () => {
    console.log(`REST API is listening on https://${config.host}:${config.port}`);
  });
} else {
  app.listen(config.port, config.host, () => {
    console.log(`REST API is listening on http://${config.host}:${config.port}`);
  });
}

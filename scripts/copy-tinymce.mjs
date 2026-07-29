import fse from "fs-extra";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const sourceDir = path.join(rootDir, "node_modules", "tinymce");
const targetDir = path.join(rootDir, "public", "tinymce");

fse.emptyDirSync(targetDir);
fse.copySync(sourceDir, targetDir, { overwrite: true });

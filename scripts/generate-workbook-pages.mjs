import { readFileSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const source=resolve("tmp/pdfs/present-simple-pages");
const target=resolve("app/api/student/workbook-page/workbook-pages.generated.ts");
mkdirSync(resolve("app/api/student/workbook-page"),{recursive:true});
const pages=readdirSync(source).filter(name=>name.endsWith(".webp")).sort().map(name=>readFileSync(resolve(source,name)).toString("base64"));
writeFileSync(target,`// Generated from the licensed workbook. Server bundle only; never import this module into client code.\nexport const WORKBOOK_PAGES=${JSON.stringify(pages)} as const;\n`);
console.log(`Generated ${pages.length} protected workbook pages.`);


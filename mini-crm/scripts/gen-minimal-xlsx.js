import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dir = path.join(root, ".tmp-xlsx");

fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(path.join(dir, "xl", "worksheets"), { recursive: true });
fs.mkdirSync(path.join(dir, "xl", "_rels"), { recursive: true });
fs.mkdirSync(path.join(dir, "_rels"), { recursive: true });

fs.writeFileSync(
  path.join(dir, "[Content_Types].xml"),
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`,
);

fs.writeFileSync(
  path.join(dir, "_rels", ".rels"),
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
);

fs.writeFileSync(
  path.join(dir, "xl", "workbook.xml"),
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Sheet1" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`,
);

fs.writeFileSync(
  path.join(dir, "xl", "_rels", "workbook.xml.rels"),
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`,
);

fs.writeFileSync(
  path.join(dir, "xl", "worksheets", "sheet1.xml"),
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData/>
</worksheet>`,
);

const zipPath = path.join(root, ".tmp-xlsx.zip");
fs.rmSync(zipPath, { force: true });
execSync(
  `powershell -NoProfile -Command "Compress-Archive -Path '${dir.replace(/'/g, "''")}\\*' -DestinationPath '${zipPath.replace(/'/g, "''")}' -Force"`,
  { stdio: "inherit" },
);

const base64 = fs.readFileSync(zipPath).toString("base64");
fs.writeFileSync(
  path.join(root, "src", "adapters", "minimalWorkbook.js"),
  `export const MINIMAL_XLSX_BASE64 = ${JSON.stringify(base64)};\n`,
);

console.log(`Generated minimal workbook (${base64.length} chars base64)`);

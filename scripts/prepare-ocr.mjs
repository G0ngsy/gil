/** OCR 배포 자료 준비: 고정된 npm 패키지에서 복사하므로 빌드 중 외부 모델 서버가 필요하지 않습니다. */
import { mkdir, copyFile, readdir, writeFile, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const target = join(root, "public/ocr/v1");
await mkdir(join(target, "core"), { recursive: true });
await mkdir(join(target, "lang"), { recursive: true });
const packagePath = (name) => join(root, "node_modules", name);
// 코어는 폰의 SIMD 지원에 따라 다른 파일을 고르므로 한 종류만 복사하지 않습니다.
const core = packagePath("tesseract.js-core");
for (const name of await readdir(core))
  if (/^tesseract-core.*\.(wasm|js)$/.test(name))
    await copyFile(join(core, name), join(target, "core", name));
for (const name of ["worker.min.js", "tesseract.min.js"])
  await copyFile(
    join(packagePath("tesseract.js"), "dist", name),
    join(target, name),
  );
for (const language of ["kor", "eng"])
  await copyFile(
    join(
      packagePath(`@tesseract.js-data/${language}`),
      "4.0.0_best_int",
      `${language}.traineddata.gz`,
    ),
    join(target, "lang", `${language}.traineddata.gz`),
  );
await copyFile(
  join(packagePath("tesseract.js"), "LICENSE.md"),
  join(target, "TESSERACT-LICENSE"),
);
for (const name of [
  "worker.min.js.LICENSE.txt",
  "tesseract.min.js.LICENSE.txt",
])
  await copyFile(
    join(packagePath("tesseract.js"), "dist", name),
    join(target, name),
  );
await copyFile(join(core, "LICENSE"), join(target, "CORE-LICENSE"));
// 언어 패키지의 메타데이터와 Apache 원문도 배포 자료 옆에 남깁니다.
await copyFile(join(core, "LICENSE"), join(target, "TRAINEDDATA-LICENSE"));
for(const language of ['kor','eng'])await copyFile(join(packagePath(`@tesseract.js-data/${language}`),'package.json'),join(target,'lang',`${language}.package.json`));
const coreVersion=JSON.parse(await readFile(join(core,'package.json'),'utf8')).version;
await writeFile(join(target,'versions.json'),JSON.stringify({tesseract:'6.0.1',core:coreVersion,kor:'1.0.0',eng:'1.0.0',models:'4.0.0_best_int'}));
await writeFile(
  join(target, "NOTICE.txt"),
  "Tesseract.js 6.0.1 / Apache-2.0. tesseract.js-core: versions.json / Apache-2.0. @tesseract.js-data/kor and eng 1.0.0: MIT package metadata; trained data (Apache-2.0). Sources: https://github.com/naptha/tesseract.js https://github.com/naptha/tessdata https://github.com/tesseract-ocr/tessdata (see LICENSE files alongside this notice).\n",
);
console.log("OCR 실행 파일과 한국어·영어 모델 준비 완료 (public/ocr/v1)");

/** 실제 엔진 정확도와 분리해 입력 제한·OCR 줄 정리의 규칙을 검증합니다. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { preparePhoto, recognizedLines } from "../src/navigation/photoOcr.ts";

test("OCR 줄은 공백/전각을 정리하고 말줄임 뒤 중복을 제거한다", () => {
  assert.deepEqual(
    recognizedLines(" 수협은행 \n수협은행\r\nＡＴＭ\n  서현역지점   ATM \n!"),
    ["수협은행", "ATM", "서현역지점 ATM"],
  );
  assert.equal(
    recognizedLines("긴".repeat(90) + "A\n" + "긴".repeat(90) + "B").length,
    1,
  );
  assert.equal(
    recognizedLines(
      Array.from({ length: 30 }, (_, i) => `간판 ${i}`).join("\n"),
    ).length,
    20,
  );
});
test("지원하지 않는 파일·10MB 초과·취소는 이미지 디코딩 전에 거절한다", async () => {
  const signal = new AbortController().signal;
  await assert.rejects(
    preparePhoto(new File(["x"], "photo.heic", { type: "image/heic" }), signal),
    /JPG/,
  );
  await assert.rejects(
    preparePhoto(
      new File([new Uint8Array(10 * 1024 * 1024 + 1)], "large.jpg", {
        type: "image/jpeg",
      }),
      signal,
    ),
    /10MB/,
  );
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    preparePhoto(
      new File(["x"], "photo.jpg", { type: "image/jpeg" }),
      controller.signal,
    ),
    { name: "AbortError" },
  );
});

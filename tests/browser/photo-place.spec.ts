/** 모의 OCR의 UI/수명 검증과 실제 엔진 검증을 이름과 테스트로 분리합니다. */
import { test, expect, type Page } from "@playwright/test";
test.use({ reducedMotion: "no-preference" });
const place = {
  id: "photo-place",
  name: "수협은행 서현역지점 ATM",
  address: "경기 성남시 분당구 서현동",
  category: "은행",
  lat: 37.386,
  lng: 127.124,
};

async function setup(page: Page, worker = "normal") {
  await page.addInitScript(() => {
    sessionStorage.setItem("gilbit.intro.seen.v1", "1");
    const testState = {
      geo: 0,
      started: 0,
      stopped: 0,
      ready: [] as string[],
      searchBodies: [] as unknown[],
      permission: 0,
    };
    Object.assign(window, { photoTest: testState });
    navigator.geolocation.getCurrentPosition = (ok) => {
      testState.geo++;
      ok({
        coords: { latitude: 37.386, longitude: 127.124, accuracy: 8 },
        timestamp: Date.now(),
      } as GeolocationPosition);
    };
    navigator.mediaDevices.getUserMedia = async () => {
      testState.permission++;
      throw Error("not requested");
    };
    const Original = window.Worker;
    window.Worker = class extends Original {
      constructor(url: URL | string, options?: WorkerOptions) {
        super(url, options);
        testState.started++;
      }
      override terminate() {
        testState.stopped++;
        super.terminate();
      }
    };
    const native = document.startViewTransition?.bind(document);
    if (native)
      document.startViewTransition = (update: any) => {
        const kind = document.documentElement.dataset.screenMotion || "";
        const t = native(update);
        void t.ready.then(
          () => testState.ready.push(kind),
          () => {},
        );
        return t;
      };
  });
  await page.route("**/api/navigation?**", async (r) => {
    const action = new URL(r.request().url()).searchParams.get("action");
    if (action === "search")
      await page.evaluate(
        (body) => (window as any).photoTest.searchBodies.push(body),
        r.request().postDataJSON() ?? {
          q: new URL(r.request().url()).searchParams.get("q"),
        },
      );
    await r.fulfill({
      json:
        action === "config"
          ? { searchConfigured: true }
          : action === "address"
            ? {
                location: {
                  address: "성남시 분당구 서현동",
                  area: "성남시 분당구",
                },
              }
            : {
                places: [
                  place,
                  { ...place, id: "other", name: "수협은행 다른지점" },
                ],
              },
    });
  });
  if (worker !== "real")
    await page.route("**/photo-ocr-worker.js", (r) =>
      r.fulfill({
        contentType: "text/javascript",
        body:
          worker === "error"
            ? `self.onmessage=()=>self.postMessage({type:'error'});`
            : `self.onmessage=()=>{self.postMessage({type:'progress',phase:'recognizing',progress:.4});setTimeout(()=>self.postMessage({type:'result',text:${JSON.stringify("수협은행\n서현역지점 ATM")}}),${worker === "slow" ? 1500 : 80});};`,
      }),
    );
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "실제 장소 검색", exact: true }),
  ).toBeEnabled();
}
async function open(page: Page) {
  await page
    .getByRole("button", { name: "사진으로 주변 장소 확인", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "지금 계신 곳을 보여 주세요" }),
  ).toBeVisible();
}
async function image(page: Page, width = 900, height = 300) {
  await page.evaluate(() => document.fonts.ready);
  const encoded = await page.evaluate(
    ({ width, height }) => {
      const c = document.createElement("canvas");
      c.width = width;
      c.height = height;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "black";
      ctx.font = "bold 70px GilbitSans, sans-serif";
      ctx.fillText("수협은행", 50, 110);
      ctx.font = "50px GilbitSans, sans-serif";
      ctx.fillText("서현역지점 ATM", 50, 210);
      return c.toDataURL("image/png").split(",")[1];
    },
    { width, height },
  );
  return {
    name: "sign.png",
    mimeType: "image/png",
    buffer: Buffer.from(encoded, "base64"),
  };
}
async function photo(page: Page) {
  await page
    .getByLabel("선택한 사진 파일", { exact: true })
    .setInputFiles(await image(page));
  await expect(
    page.getByRole("img", { name: "선택한 사진" }),
  ).toBeVisible();
}

for (const width of [360, 390, 430])
  test(`${width}px 모의 OCR→검색어 수정→주변 후보 확인과 push/back`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await setup(page);
    await open(page);
    await expect
      .poll(() => page.evaluate(() => (window as any).photoTest.ready))
      .toContain("push-forward");
    expect(await page.evaluate(() => (window as any).photoTest)).toMatchObject({
      geo: 0,
      started: 0,
      permission: 0,
    });
    await photo(page);
    await page.getByRole("button", { name: "이 사진에서 글자 읽기" }).click();
    await page.getByRole("button", { name: "수협은행", exact: true }).click();
    await page
      .getByRole("button", { name: "서현역지점 ATM", exact: true })
      .click();
    await expect(page.getByLabel("장소 이름", { exact: true })).toHaveValue(
      "수협은행 서현역지점 ATM",
    );
    await page.getByRole("button", { name: "현재 위치로 주변 검색" }).click();
    await expect(
      page.getByText("현재 위치 주변 10km · 거리순으로 찾아요"),
    ).toBeVisible();
    await page.getByRole("button", { name: "장소 찾기", exact: true }).click();
    await expect(page.locator(".photo-candidates .result-card")).toHaveCount(2);
    await page.getByRole("button", { name: new RegExp(place.name) }).click();
    await expect(
      page.getByRole("heading", { name: "사진에서 찾은 장소", exact: true }),
    ).toBeVisible();
    await expect(page.getByText(place.address, { exact: true })).toBeVisible();
    expect(
      await page.evaluate(() => (window as any).photoTest.searchBodies),
    ).toEqual([{ q: place.name, center: { lat: 37.386, lng: 127.124 } }]);
    expect(
      await page.evaluate(() => JSON.stringify(localStorage)),
    ).not.toContain(place.name);
    expect(
      await page.evaluate(() => (window as any).photoTest.permission),
    ).toBe(0);
    expect(
      await page
        .locator("main")
        .evaluate((e) => e.scrollWidth <= e.clientWidth),
    ).toBe(true);
    if (width === 390)
      await page.screenshot({
        path: "test-results/photo-place-confirmed-390.png",
      });
    await page.getByRole("button", { name: "확인 완료" }).click();
    await expect(page.locator(".home-hero")).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => (window as any).photoTest.ready))
      .toContain("push-back");
    await expect(page.getByText("최근 목적지가 없어요.")).toBeVisible();
  });

test("실제 OCR: 같은 주소의 한국어/영어 모델로 합성 간판을 읽고 사진은 전송하지 않는다", async ({
  page,
}) => {
  test.setTimeout(90000);
  await setup(page, "real");
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const external: string[] = [];
  page.on("request", (r) => {
    if (
      /tesseract|traineddata|wasm|ocr-worker/.test(r.url()) &&
      new URL(r.url()).origin !== "http://127.0.0.1:5182"
    )
      external.push(r.url());
  });
  await open(page);
  await photo(page);
  await page.getByRole("button", { name: "이 사진에서 글자 읽기" }).click();
  await expect(
    page.getByRole("heading", { name: "읽은 글자를 확인해 주세요" }),
  ).toBeVisible({ timeout: 60000 });
  await expect(page.getByRole("group", { name: "읽은 글자" })).toContainText(
    "수협은행",
  );
  await expect(page.getByRole("group", { name: "읽은 글자" })).toContainText(
    "ATM",
  );
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
  expect(
    await page.evaluate(() => (window as any).photoTest.searchBodies),
  ).toEqual([]);
  await page.screenshot({ path: "test-results/photo-place-real-ocr-390.png" });
});

test("취소·빠른 재선택·브라우저 뒤로가기 후 늦은 OCR은 반영하지 않는다", async ({
  page,
}) => {
  await setup(page, "slow");
  await open(page);
  await photo(page);
  await page.getByRole("button", { name: "이 사진에서 글자 읽기" }).click();
  await expect(page.getByRole("button", { name: "인식 취소" })).toBeVisible();
  await page.getByRole("button", { name: "인식 취소" }).click();
  await page.getByRole("button", { name: "장소 이름 직접 입력" }).click();
  await page.getByLabel("장소 이름", { exact: true }).fill("직접 입력");
  await page.waitForTimeout(1700);
  await expect(page.getByLabel("장소 이름", { exact: true })).toHaveValue(
    "직접 입력",
  );
  expect(await page.evaluate(() => (window as any).photoTest.stopped)).toBe(1);
  await page.goBack();
  await expect(page.locator(".home-hero")).toBeVisible();
  await open(page);
  await expect(page.getByRole("img", { name: "선택한 사진" })).toHaveCount(
    0,
  );
});

test("파일 오류·인식 실패·직접 입력과 지역명 검색·후보 없음", async ({
  page,
}) => {
  await setup(page, "error");
  await open(page);
  await page
    .getByLabel("선택한 사진 파일", { exact: true })
    .setInputFiles({
      name: "bad.heic",
      mimeType: "image/heic",
      buffer: Buffer.from("bad"),
    });
  await expect(page.getByRole("alert")).toContainText("JPG");
  await page
    .getByLabel("선택한 사진 파일", { exact: true })
    .setInputFiles({
      name: "bad.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from("bad"),
    });
  await expect(page.getByRole("alert")).toContainText("사진을 열지 못했어요");
  await photo(page);
  await page.getByRole("button", { name: "이 사진에서 글자 읽기" }).click();
  await expect(page.getByRole("alert")).toContainText("글자를 읽지 못했어요");
  await page.getByRole("button", { name: "장소 이름 직접 입력" }).click();
  await page.getByLabel("장소 이름", { exact: true }).fill("수협은행");
  await page.getByRole("button", { name: "장소 찾기", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("지역명");
  await page.getByLabel("지역명", { exact: true }).fill("성남시 서현동");
  await page.route("**/api/navigation?action=search**", (r) =>
    r.fulfill({ json: { places: [] } }),
  );
  await page.getByRole("button", { name: "장소 찾기", exact: true }).click();
  await expect(page.getByText(/맞는 장소가 없어요/)).toBeVisible();
  await page.getByRole("button", { name: "검색어 수정" }).click();
  await expect(page.getByLabel("장소 이름", { exact: true })).toHaveValue(
    "수협은행",
  );
});

test("동작 줄이기·키보드 이동·큰 글씨, 작업 중 화면 숨김 정리", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await setup(page, "slow");
  await page.setViewportSize({ width: 360, height: 640 });
  await open(page);
  expect(await page.evaluate(() => (window as any).photoTest.ready)).toEqual(
    [],
  );
  await page.addStyleTag({ content: "html{font-size:200%!important}" });
  await photo(page);
  await page.getByRole("button", { name: "이 사진에서 글자 읽기" }).click();
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.getByRole("alert")).toContainText("중지");
  expect(
    await page.locator("main").evaluate((e) => e.scrollWidth <= e.clientWidth),
  ).toBe(true);
  await page.getByRole("button", { name: "뒤로 가기", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".home-hero")).toBeVisible();
});

test("실제 엔진 준비 중 취소하면 하위 작업자까지 종료하고 네트워크 실패도 재시도 가능", async ({
  page,
}) => {
  await setup(page, "real");
  await open(page);
  await photo(page);
  let release = () => {};
  const gate = new Promise<void>((resolve) => (release = resolve));
  await page.route("**/ocr/v1/core/**", async (r) => {
    await gate;
    await r.abort().catch(() => {});
  });
  const cdp = await page.context().browser()!.newBrowserCDPSession();
  const workers = async () => {
    const result = await cdp.send("Target.getTargets");
    return result.targetInfos.filter(
      (t) =>
        t.type === "worker" &&
        /photo-ocr-worker\.js|worker\.min\.js/.test(t.url),
    ).length;
  };
  try {
    await page.getByRole("button", { name: "이 사진에서 글자 읽기" }).click();
    await expect.poll(workers).toBeGreaterThanOrEqual(2);
    await page.getByRole("button", { name: "인식 취소" }).click();
    await expect.poll(workers).toBe(0);
  } finally {
    release();
    await cdp.detach();
  }
  await page.unroute("**/ocr/v1/core/**");
  await page.route("**/ocr/v1/core/**", (r) => r.abort());
  await page.getByRole("button", { name: "이 사진에서 글자 읽기" }).click();
  await expect(page.getByRole("alert")).toContainText(/준비하지 못|읽지 못/);
  await expect(
    page.getByRole("button", { name: "이 사진에서 글자 읽기" }),
  ).toBeVisible();
});

test("검색 실패·조회 취소 뒤 늦은 응답이 후보 화면을 다시 열지 않는다", async ({
  page,
}) => {
  await setup(page);
  await open(page);
  await page.getByRole("button", { name: "장소 이름 직접 입력" }).click();
  await page.getByLabel("장소 이름", { exact: true }).fill("은행");
  await page.getByLabel("지역명", { exact: true }).fill("성남시");
  await page.route("**/api/navigation?action=search**", (r) =>
    r.fulfill({ status: 502, json: { error: { message: "검색 연결 오류" } } }),
  );
  await page.getByRole("button", { name: "장소 찾기", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("검색 연결 오류");
  let release = () => {};
  const gate = new Promise<void>((resolve) => (release = resolve));
  await page.route("**/api/navigation?action=search**", async (r) => {
    await gate;
    await r.fulfill({ json: { places: [place] } }).catch(() => {});
  });
  await page.getByRole("button", { name: "장소 찾기", exact: true }).click();
  await page.getByRole("button", { name: "조회 취소" }).click();
  release();
  await page.waitForTimeout(100);
  await expect(
    page.getByRole("heading", { name: "읽은 글자를 확인해 주세요" }),
  ).toBeVisible();
  await expect(page.locator(".photo-candidates")).toHaveCount(0);
  await expect(page.getByLabel("장소 이름", { exact: true })).toBeEnabled();
});

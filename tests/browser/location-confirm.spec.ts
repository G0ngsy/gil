/** GPS 확인→사진 단서 비교→검색의 경계와 좌표 분리를 검증합니다. API/센서는 모의입니다. */
import { test, expect, type Page } from "@playwright/test";
import { mockLocationMap } from "./helpers/locationMap";
test.use({ reducedMotion: "no-preference" });
const place = {
  id: "comparison",
  name: "사진에서 찾은 도서관",
  address: "서울 중구 세종대로",
  category: "도서관",
  lat: 37.567,
  lng: 126.979,
};
async function setup(page: Page) {
  await mockLocationMap(page);
  await page.addInitScript(() => {
    sessionStorage.setItem("gilbit.intro.seen.v1", "1");
    const state = {
      calls: 0,
      denied: false,
      lat: 37.5665,
      ready: [] as string[],
    };
    Object.assign(window, { locationFlow: state });
    navigator.geolocation.getCurrentPosition = (ok, fail) => {
      state.calls++;
      if (state.denied) {
        fail?.({ code: 1, message: "denied" } as GeolocationPositionError);
        return;
      }
      ok({
        coords: { latitude: state.lat, longitude: 126.978, accuracy: 8 },
        timestamp: Date.now(),
      } as GeolocationPosition);
    };
    const native = document.startViewTransition?.bind(document);
    if (native)
      document.startViewTransition = (update: any) => {
        const kind = document.documentElement.dataset.screenMotion || "";
        const t = native(update);
        void t.ready.then(
          () => state.ready.push(kind),
          () => {},
        );
        return t;
      };
  });
  await page.route("**/api/navigation?**", (r) => {
    const action = new URL(r.request().url()).searchParams.get("action");
    return r.fulfill({
      json:
        action === "config"
          ? { searchConfigured: true }
          : action === "address"
            ? {
                location: { address: "서울 중구 현재 주소", area: "서울 중구" },
              }
            : { places: [place] },
    });
  });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "실제 장소 검색", exact: true }),
  ).toBeEnabled();
}
async function photoClue(page: Page) {
  await page
    .getByRole("button", { name: "사진으로 주변 확인", exact: true })
    .click();
  await page.getByRole("button", { name: "장소 이름 직접 입력" }).click();
  await page.getByLabel("장소 이름", { exact: true }).fill("도서관");
  if (await page.getByLabel("지역명", { exact: true }).count())
    await page.getByLabel("지역명", { exact: true }).fill("서울 중구");
  await page.getByRole("button", { name: "장소 찾기", exact: true }).click();
  await page.locator(".photo-candidates .result-card").click();
  await page.getByRole("button", { name: "확인 완료" }).click();
  await expect(
    page.getByRole("heading", { name: "지금 계신 곳이 맞나요?" }),
  ).toBeVisible();
}
for (const width of [360, 390, 430])
  test(`${width}px GPS 지도→사진 장소 비교→검색, 양방향 push`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await setup(page);
    await expect(
      page.getByRole("button", {
        name: "사진으로 주변 장소 확인",
        exact: true,
      }),
    ).toHaveCount(0);
    expect(await page.evaluate(() => (window as any).locationFlow.calls)).toBe(
      0,
    );
    await page
      .getByRole("button", { name: "현재 위치 확인", exact: true })
      .click();
    await expect(
      page.getByText("서울 중구 현재 주소", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("현재 위치", { exact: true })).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => (window as any).locationFlow.ready))
      .toContain("push-forward");
    await photoClue(page);
    await expect(page.locator(".location-photo-reference")).toContainText(
      place.name,
    );
    const active = await page.evaluate(() =>
      (window as any).locationMapTest.layers
        .filter((layer: any) => layer.map && layer.options.title)
        .map((layer: any) => layer.options),
    );
    expect(
      active.find((o: any) => o.title === "현재 GPS 위치").position,
    ).toMatchObject({ lat: 37.5665, lng: 126.978 });
    expect(
      active.find((o: any) => o.title.startsWith("사진에서 확인한 장소"))
        .position,
    ).toMatchObject({ lat: place.lat, lng: place.lng });
    expect(await page.evaluate(() => (window as any).locationFlow.calls)).toBe(
      1,
    );
    await page.waitForFunction(
      () => !document.documentElement.dataset.screenMotion,
    );
    if (width === 390)
      await page.screenshot({
        path: "test-results/location-comparison-390.png",
      });
    await page.evaluate(() => ((window as any).locationFlow.lat = 37.5666));
    await page
      .getByRole("button", { name: "현재 위치 다시 확인", exact: true })
      .click();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as any).locationMapTest.layers.find(
              (layer: any) =>
                layer.map && layer.options.title === "현재 GPS 위치",
            )?.options.position.lat,
        ),
      )
      .toBe(37.5666);
    await page.getByRole("button", { name: "이 위치에서 길찾기" }).click();
    await expect(
      page.getByRole("textbox", { name: "실제 목적지 검색" }),
    ).toBeFocused();
    await expect(page.getByRole("combobox", { name: "검색 범위" })).toHaveValue(
      "nearby",
    );
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as any).locationFlow.ready.filter(
              (value: string) => value === "push-back",
            ).length,
        ),
      )
      .toBe(2);
    expect(
      await page.evaluate(() => JSON.stringify(localStorage)),
    ).not.toContain(place.name);
  });
test("GPS 거절 후 사진 장소만 찾으면 GPS로 간주하지 않고 재확인을 제공한다", async ({
  page,
}) => {
  await setup(page);
  await page.evaluate(() => ((window as any).locationFlow.denied = true));
  await page
    .getByRole("button", { name: "현재 위치 확인", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "이 위치에서 길찾기" }),
  ).toBeDisabled();
  await photoClue(page);
  await expect(page.locator(".location-photo-reference")).toContainText(
    place.name,
  );
  await expect(
    page.getByRole("button", { name: "이 위치에서 길찾기" }),
  ).toBeDisabled();
  expect(
    await page.evaluate(() =>
      (window as any).locationMapTest.layers.some(
        (layer: any) => layer.map && layer.options.title === "현재 GPS 위치",
      ),
    ),
  ).toBe(false);
  await page.evaluate(() => ((window as any).locationFlow.denied = false));
  await page
    .getByRole("button", { name: "현재 위치 확인", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "이 위치에서 길찾기" }),
  ).toBeEnabled();
});
test("지도 실패도 주소 확인 가능, 큰 글씨/reduced motion/뒤로가기를 유지한다", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await setup(page);
  await page.addStyleTag({ content: "html{font-size:200%!important}" });
  await page.setViewportSize({ width: 360, height: 640 });
  await page.evaluate(() => delete window.Tmapv2);
  await page.route("https://apis.openapi.sk.com/tmap/jsv2**", (r) => r.abort());
  await page
    .getByRole("button", { name: "현재 위치 확인", exact: true })
    .click();
  await expect(
    page.getByText("서울 중구 현재 주소", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("alert")).toContainText(
    "지도를 불러오지 못했어요",
  );
  await page
    .getByRole("button", { name: "사진으로 주변 확인" })
    .scrollIntoViewIfNeeded();
  await expect(
    page.getByRole("button", { name: "사진으로 주변 확인" }),
  ).toBeInViewport();
  expect(
    await page.locator("main").evaluate((e) => e.scrollWidth <= e.clientWidth),
  ).toBe(true);
  expect(await page.evaluate(() => (window as any).locationFlow.ready)).toEqual(
    [],
  );
  await page.goBack();
  await expect(page.locator(".home-hero")).toBeVisible();
});

test("도로 편 확인·기기 추정 오차 표시, 오래된 GPS는 다시 확인해야 확정한다", async ({
  page,
}) => {
  await page.clock.install();
  await setup(page);
  await page
    .getByRole("button", { name: "현재 위치 확인", exact: true })
    .click();
  await expect(
    page.getByText("기기 추정 오차 약 8m", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/도로 어느 편/)).toBeVisible();
  await page.clock.runFor(121000);
  await expect(
    page.getByRole("button", { name: "이 위치에서 길찾기" }),
  ).toBeDisabled();
  await expect(
    page.getByText("이전 위치예요. 다시 확인해 주세요.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("마지막 확인 위치", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "현재 위치 다시 확인", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "이 위치에서 길찾기" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "이 위치에서 길찾기" }).click();
  await expect(
    page.getByRole("textbox", { name: "실제 목적지 검색" }),
  ).toBeFocused();
});

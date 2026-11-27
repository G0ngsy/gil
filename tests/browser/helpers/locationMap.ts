/** 위치 확인 화면의 지도 SDK만 격리합니다. 좌표는 테스트가 주입한 값 그대로 기록합니다. */
import type { Page } from "@playwright/test";
export async function mockLocationMap(page: Page) {
  await page.addInitScript(() => {
    const state = { layers: [] as any[], maps: 0, destroyed: 0 };
    Object.assign(window, { locationMapTest: state });
    class Map {
      constructor() {
        state.maps++;
      }
      setCenter() {}
      fitBounds() {}
      resize() {}
      destroy() {
        state.destroyed++;
      }
    }
    class Layer {
      options: any;
      map: any;
      constructor(options: any) {
        this.options = options;
        this.map = options.map;
        state.layers.push(this);
      }
      setMap(map: any) {
        this.map = map;
      }
    }
    window.Tmapv2 = {
      Map,
      LatLng: class {
        constructor(
          public lat: number,
          public lng: number,
        ) {}
      },
      LatLngBounds: class {
        extend() {}
      },
      Marker: Layer,
      Polyline: Layer,
      Circle: Layer,
      Size: class {
        constructor(
          public w: number,
          public h: number,
        ) {}
      },
      Point: class {
        constructor(
          public x: number,
          public y: number,
        ) {}
      },
    };
  });
}

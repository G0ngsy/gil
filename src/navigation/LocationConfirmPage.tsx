/** 내 위치 확인 화면: GPS와 사진 속 장소를 비교하며 사진 좌표를 현재 위치로 대입하지 않습니다. */
import { useEffect, useId, useRef, useState } from "react";
import type { LocationAddress, Place } from "../../shared/navigation";
import type { UserPosition } from "./client";
import { loadTMap, point, type TMapOverlay, type TMapView } from "./tmap";
import { Icon } from "../ui";
import "./locationConfirm.css";

interface Props {
  position: UserPosition | null;
  address: LocationAddress | null;
  photoPlace: Place | null;
  locating: boolean;
  addressLoading: boolean;
  locationError: string;
  addressError: string;
  onRefresh: () => void;
  onPhoto: () => void;
  onConfirm: () => void;
  onAddressRetry: () => void;
}
const svg = (body: string, width: number, height: number) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`)}`;

/** 지도는 관측한 GPS와 사용자가 고른 주변 장소만 표시합니다. 위치가 없을 때 예시 점을 만들지 않습니다. */
function LocationComparisonMap({
  position,
  place,
  stale,
}: {
  position: UserPosition | null;
  place: Place | null;
  stale: boolean;
}) {
  const host = useRef<HTMLDivElement>(null),
    id = useId().replaceAll(":", "");
  const [error, setError] = useState(""),
    [ready, setReady] = useState(false),
    [retry, setRetry] = useState(0);
  const key = import.meta.env.VITE_TMAP_MAP_KEY || "";
  useEffect(() => {
    setReady(false);
    setError("");
    if (!key || !host.current || (!position && !place)) return;
    let cancelled = false,
      map: TMapView | undefined;
    const overlays: TMapOverlay[] = [];
    const element = host.current;
    loadTMap(key)
      .then((sdk) => {
        if (cancelled) return;
        const center = position ?? place!;
        map = new sdk.Map(element.id, {
          center: point(sdk, center),
          width: "100%",
          height: "100%",
          zoom: 17,
          zoomControl: false,
        });
        if (position) {
          overlays.push(
            new sdk.Marker({
              map,
              position: point(sdk, position),
              title: stale ? "마지막 확인 위치" : "현재 GPS 위치",
              icon: svg(
                `<circle cx="12" cy="12" r="10" fill="${stale ? "#77776E" : "#2878D0"}" stroke="white" stroke-width="3"/>`,
                24,
                24,
              ),
              iconSize: sdk.Size ? new sdk.Size(24, 24) : undefined,
              offset: sdk.Point ? new sdk.Point(12, 12) : undefined,
              zIndex: 6,
            }),
          );
          if (sdk.Circle)
            overlays.push(
              new sdk.Circle({
                map,
                center: point(sdk, position),
                radius: position.accuracy,
                fillColor: "#2878D0",
                fillOpacity: 0.12,
                strokeColor: "#2878D0",
                strokeOpacity: 0.2,
                strokeWeight: 1,
                zIndex: 1,
              }),
            );
        }
        if (place)
          overlays.push(
            new sdk.Marker({
              map,
              position: point(sdk, place),
              title: `사진에서 확인한 장소: ${place.name}`,
              icon: svg(
                '<path d="M18 2a14 14 0 0 0-14 14c0 11 14 24 14 24s14-13 14-24A14 14 0 0 0 18 2Z" fill="#245447" stroke="white" stroke-width="2"/><circle cx="18" cy="16" r="5" fill="white"/>',
                36,
                42,
              ),
              iconSize: sdk.Size ? new sdk.Size(36, 42) : undefined,
              offset: sdk.Point ? new sdk.Point(18, 40) : undefined,
              zIndex: 5,
            }),
          );
        if (position && place) {
          const bounds = new sdk.LatLngBounds();
          bounds.extend(point(sdk, position));
          bounds.extend(point(sdk, place));
          map.fitBounds(bounds, { left: 65, top: 65, right: 65, bottom: 65 });
        }
        setReady(true);
      })
      .catch(() => {
        if (!cancelled)
          setError(
            "지도를 불러오지 못했어요. 주소를 확인하거나 다시 시도해 주세요.",
          );
      });
    // 지도 크기가 변하면 타일/터치 영역도 맞추고, 마커를 지도보다 먼저 해제합니다.
    const observer = new ResizeObserver(() => map?.resize?.());
    observer.observe(element);
    return () => {
      cancelled = true;
      observer.disconnect();
      overlays.forEach((layer) => layer.setMap(null));
      map?.destroy?.();
      element.replaceChildren();
    };
  }, [position, place, key, retry, stale]);
  return (
    <div className="location-comparison-map">
      <div
        ref={host}
        id={`location-map-${id}`}
        className="live-map-canvas"
        role="region"
        aria-label="현재 위치와 사진 장소 비교 지도"
      />
      {(!ready || !key) && (
        <div className="location-map-message" role={error ? "alert" : "status"}>
          {error ||
            (!position && !place
              ? "현재 위치를 확인하면 지도가 표시돼요."
              : !key
                ? "지도를 준비하지 못했어요. 아래 주소를 확인해 주세요."
                : "지도를 불러오고 있어요…")}
          {error && (
            <button
              className="secondary"
              onClick={() => setRetry((value) => value + 1)}
            >
              지도 다시 보기
            </button>
          )}
        </div>
      )}
      {ready && (
        <div className="location-map-legend">
          {position && (
            <span>
              <i className="location-gps-dot" data-stale={stale} />
              {stale ? "마지막 확인 위치" : "현재 위치"}
            </span>
          )}
          {place && (
            <span>
              <i className="location-photo-dot" />
              사진에서 확인한 장소
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function LocationConfirmPage(props: Props) {
  const {
    position,
    address,
    photoPlace,
    locating,
    addressLoading,
    locationError,
    addressError,
    onRefresh,
    onPhoto,
    onConfirm,
    onAddressRetry,
  } = props;
  // 확인 화면에 오래 머물렀다고 예전 GPS를 새 출발 위치로 확정하지 않도록 합니다.
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!position) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [position]);
  const stale = Boolean(
    position && Math.max(now, Date.now()) - position.timestamp > 120000,
  );
  return (
    <section className="location-confirm" aria-label="내 위치 확인">
      <LocationComparisonMap
        position={position}
        place={photoPlace}
        stale={stale}
      />
      <div className="location-confirm-sheet">
        <h2>지금 계신 곳이 맞나요?</h2>
        <p className="current-address">
          {address?.address ||
            (locating
              ? "현재 위치를 확인하고 있어요…"
              : addressLoading
                ? "주소를 확인하고 있어요…"
                : position
                  ? "현재 위치를 확인했어요"
                  : "현재 위치를 확인하지 못했어요")}
        </p>
        {position && locating && <small>위치 갱신 중 · 이전 확인 위치</small>}
        {position && locationError && <small>이전 확인 위치</small>}
        {position && (
          <p className="location-confirm-accuracy">
            기기 추정 오차 약 {Math.round(position.accuracy)}m
          </p>
        )}
        {stale && (
          <p className="location-confirm-note" role="status">
            이전 위치예요. 다시 확인해 주세요.
          </p>
        )}
        <p className="location-confirm-note">
          도로 어느 편에 있는지도 확인해 주세요. 위치는 실제와 다를 수 있어요.
        </p>
        {locationError && (
          <p className="inline-error" role="alert">
            {locationError}
          </p>
        )}
        {addressError && (
          <div className="location-address-error">
            <p role="status">{addressError}</p>
            <button
              className="text-button"
              disabled={addressLoading}
              onClick={onAddressRetry}
            >
              주소 다시 확인
            </button>
          </div>
        )}
        {photoPlace && (
          <div className="location-photo-reference">
            <Icon name="pin" size={20} />
            <div>
              <small>사진에서 확인한 장소</small>
              <strong>{photoPlace.name}</strong>
              <p>{photoPlace.address}</p>
            </div>
          </div>
        )}
        {photoPlace && !position && (
          <p className="location-confirm-note">
            사진 속 장소만 확인했어요. 현재 위치는 다시 확인해 주세요.
          </p>
        )}
        <button
          className="primary"
          disabled={!position || stale || locating || Boolean(locationError)}
          onClick={onConfirm}
        >
          이 위치에서 길찾기
          <Icon name="arrow" size={18} />
        </button>
        <div className="location-confirm-actions">
          <button
            className="secondary"
            aria-label={
              locating
                ? "현재 위치 확인 중…"
                : position
                  ? "현재 위치 다시 확인"
                  : "현재 위치 확인"
            }
            disabled={locating}
            onClick={onRefresh}
          >
            <Icon name="locate" size={18} />
            {locating ? "확인 중…" : "다시 확인"}
          </button>
          <button className="secondary" onClick={onPhoto}>
            <Icon name="camera" size={18} />
            사진으로 주변 확인
          </button>
        </div>
      </div>
    </section>
  );
}

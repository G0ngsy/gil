/**
 * 글자 영역 선택: 터치/마우스 드래그는 화면 비율로, 실제 자르기는 원본 화소로 처리합니다.
 * 화면 표시 크기·회전·축소와 원본 좌표를 섞지 않기 위해 0~1 비율만 부모에 전달합니다.
 */
import { useRef, type PointerEvent } from "react";
import type { PhotoCrop } from "./photoOcr";
interface Props {
  src: string;
  width: number;
  height: number;
  value: PhotoCrop | null;
  onChange: (crop: PhotoCrop | null) => void;
}
const full: PhotoCrop = { x: 0, y: 0, width: 1, height: 1 };
const clamp = (value: number, min = 0, max = 1) =>
  Math.max(min, Math.min(max, value));
export function PhotoCropSelector({
  src,
  width,
  height,
  value,
  onChange,
}: Props) {
  const drag = useRef<{
    x: number;
    y: number;
    previous: PhotoCrop | null;
    id: number;
  } | null>(null);
  function point(event: PointerEvent<HTMLDivElement>) {
    const r = event.currentTarget.getBoundingClientRect();
    return {
      x: clamp((event.clientX - r.left) / r.width),
      y: clamp((event.clientY - r.top) / r.height),
    };
  }
  function start(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    const p = point(event);
    drag.current = { ...p, previous: value, id: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    const from = drag.current;
    if (!from || from.id !== event.pointerId) return;
    const to = point(event);
    const w = Math.abs(to.x - from.x),
      h = Math.abs(to.y - from.y);
    if (w < 0.02 || h < 0.02) return;
    onChange({
      x: Math.min(from.x, to.x),
      y: Math.min(from.y, to.y),
      width: w,
      height: h,
    });
  }
  function finish(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.id !== event.pointerId) return;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function cancel(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.id !== event.pointerId) return;
    onChange(drag.current.previous);
    finish(event);
  }
  // 네이티브 슬라이더는 터치 드래그가 어려운 사용자와 키보드/읽어주기를 위한 대체 조작입니다.
  function adjust(key: keyof PhotoCrop, percent: number) {
    const c = { ...(value ?? full) },
      v = percent / 100;
    if (key === "x") {
      c.x = clamp(v, 0, 1 - c.width);
    } else if (key === "y") {
      c.y = clamp(v, 0, 1 - c.height);
    } else if (key === "width") {
      c.width = clamp(v, 0.02, 1 - c.x);
    } else {
      c.height = clamp(v, 0.02, 1 - c.y);
    }
    onChange(c);
  }
  return (
    <div
      className="photo-crop-selector"
      role="group"
      aria-label="글자 영역 선택"
    >
      <p className="photo-description" id="photo-crop-help">
        사진에서 건물 이름이나 글자 부분을 손가락으로 드래그해 선택해 주세요.
      </p>
      <div
        className="photo-crop-image"
        style={{ maxWidth: `${(320 * width) / height}px` }}
        aria-describedby="photo-crop-help"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={finish}
        onPointerCancel={cancel}
        onLostPointerCapture={() => {
          drag.current = null;
        }}
      >
        <img src={src} alt="선택한 사진" draggable={false} />
        {value && (
          <span
            className="photo-crop-box"
            style={{
              left: `${value.x * 100}%`,
              top: `${value.y * 100}%`,
              width: `${value.width * 100}%`,
              height: `${value.height * 100}%`,
            }}
          />
        )}
      </div>
      <p className="photo-crop-status" role="status">
        {value
          ? `선택 영역: 약 ${Math.round(width * value.width)} × ${Math.round(height * value.height)}픽셀`
          : "아직 읽을 영역을 선택하지 않았어요."}
      </p>
      <div className="photo-crop-actions">
        <button
          type="button"
          className="text-button"
          onClick={() => onChange({ ...full })}
        >
          사진 전체 선택
        </button>
        <button
          type="button"
          className="text-button"
          disabled={!value}
          onClick={() => onChange(null)}
        >
          선택 지우기
        </button>
      </div>
      <details className="photo-crop-adjust">
        <summary>선택 영역 미세 조절</summary>
        {(["width", "height", "x", "y"] as const).map((key) => {
          const c = value ?? full;
          const labels = {
            x: "왼쪽 위치",
            y: "위쪽 위치",
            width: "선택 너비",
            height: "선택 높이",
          };
          const min = key === "width" || key === "height" ? 2 : 0;
          const max =
            key === "x"
              ? (1 - c.width) * 100
              : key === "y"
                ? (1 - c.height) * 100
                : key === "width"
                  ? (1 - c.x) * 100
                  : (1 - c.y) * 100;
          return (
            <label key={key}>
              {labels[key]}
              <input
                type="range"
                min={min}
                max={Math.max(min, Math.floor(max))}
                step={1}
                value={Math.round(c[key] * 100)}
                onChange={(e) => adjust(key, Number(e.target.value))}
              />
            </label>
          );
        })}
      </details>
    </div>
  );
}

/**
 * 사진으로 주변 장소 확인: 사진 → OCR → 검색어 확인 → 후보 → 사용자 확인.
 * 이 화면의 장소 선택은 GPS·출발지·목적지·길 안내 상태를 변경하지 않습니다.
 */
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  distanceBetween,
  formatDistance,
  type Place,
} from "../../shared/navigation";
import { Icon } from "../ui";
import { getUserPosition, searchPlaces, type UserPosition } from "./client";
import { PhotoCropSelector } from "./PhotoCropSelector";
import {
  cropPhoto,
  preparePhoto,
  recognizedLines,
  startPhotoOcr,
  type OcrProgress,
  type PreparedPhoto,
  type PhotoCrop,
} from "./photoOcr";
import "./photoPlace.css";

type Step = "input" | "review" | "reading" | "text" | "results" | "selected";
interface Props {
  initialPosition: UserPosition | null;
  configured: boolean;
  onDone: (place: Place) => void;
}
const validOrigin = (point: UserPosition | null) =>
  point &&
  point.accuracy <= 100 &&
  point.timestamp <= Date.now() &&
  Date.now() - point.timestamp <= 120000
    ? point
    : null;
const message = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "처리하지 못했어요. 다시 시도해 주세요.";

export function PhotoPlacePage({ initialPosition, configured, onDone }: Props) {
  const [step, setStep] = useState<Step>("input"),
    [photo, setPhoto] = useState<PreparedPhoto | null>(null),
    [preview, setPreview] = useState("");
  const [preparing, setPreparing] = useState(false),
    [readingProgress, setReadingProgress] = useState<OcrProgress>({
      phase: "preparing",
      progress: 0,
    });
  const [crop, setCrop] = useState<PhotoCrop | null>(null);
  const [lines, setLines] = useState<string[]>([]),
    [chosenLines, setChosenLines] = useState<string[]>([]),
    [query, setQuery] = useState("");
  const [region, setRegion] = useState(""),
    [origin, setOrigin] = useState<UserPosition | null>(() =>
      validOrigin(initialPosition),
    );
  const [searchCenter, setSearchCenter] = useState<UserPosition | null>(null),
    [places, setPlaces] = useState<Place[]>([]),
    [selected, setSelected] = useState<Place | null>(null);
  const [searching, setSearching] = useState(false),
    [locating, setLocating] = useState(false),
    [error, setError] = useState("");
  const camera = useRef<HTMLInputElement>(null),
    gallery = useRef<HTMLInputElement>(null),
    title = useRef<HTMLHeadingElement>(null);
  const version = useRef(0),
    request = useRef<AbortController | null>(null),
    ocr = useRef<ReturnType<typeof startPhotoOcr> | null>(null);
  const phase = useRef(step);
  phase.current = step;

  // 미리보기 URL은 사진 메모리를 붙잡으므로 사진 교체/화면 종료 시 반환합니다.
  useEffect(() => {
    if (!photo) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(photo.blob);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);
  // 작업마다 번호를 바꿔 취소된 결과가 다음 사진이나 화면을 덮어쓰지 못하게 합니다.
  function cancel() {
    version.current++;
    request.current?.abort();
    request.current = null;
    ocr.current?.cancel();
    ocr.current = null;
  }
  useEffect(() => {
    const leave = () => {
      cancel();
      setPreparing(false);
      setSearching(false);
      setLocating(false);
      if (phase.current === "reading") {
        setStep("review");
        setError("화면을 떠나 글자 인식을 중지했어요.");
      }
    };
    const hidden = () => {
      if (document.hidden) leave();
    };
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("pagehide", leave);
    return () => {
      cancel();
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("pagehide", leave);
    };
  }, []);
  // 단계가 바뀌면 제목으로 초점을 옮겨 키보드/읽어주기 사용자도 새 내용을 찾게 합니다.
  useEffect(() => {
    title.current?.focus({ preventScroll: true });
  }, [step]);

  /** 사진 선택기의 숨김/복귀와 실제 인식 중단을 구분합니다. 선택된 파일은 복귀한 뒤 검증합니다. */
  async function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    cancel();
    const token = version.current,
      controller = new AbortController();
    request.current = controller;
    setPreparing(true);
    setSearching(false);
    setLocating(false);
    setError("");
    setPhoto(null);
    setCrop(null);
    setSelected(null);
    setLines([]);
    setChosenLines([]);
    setQuery("");
    setPlaces([]);
    setStep("input");
    try {
      const prepared = await preparePhoto(file, controller.signal);
      if (token !== version.current) return;
      setPhoto(prepared);
      setStep("review");
    } catch (e) {
      if (token === version.current) setError(message(e));
    } finally {
      if (token === version.current) {
        setPreparing(false);
        request.current = null;
      }
    }
  }

  /** OCR은 명시적으로 누를 때만 시작합니다. 사진 자체는 검색 서버에 보내지 않습니다. */
  async function readPhoto() {
    if (!photo || !crop) return;
    cancel();
    const token = version.current,
      controller = new AbortController();
    request.current = controller;
    setError("");
    setReadingProgress({ phase: "preparing", progress: 0 });
    setStep("reading");
    try {
      // 전체 사진을 먼저 축소하지 않고 선택한 원본 영역만 잘라 엔진에 전달합니다.
      const selectedPhoto = await cropPhoto(photo, crop, controller.signal);
      if (token !== version.current) return;
      const job = startPhotoOcr(selectedPhoto.blob, (value) => {
        if (token === version.current) setReadingProgress(value);
      });
      ocr.current = job;
      const text = await job.promise;
      if (token !== version.current) return;
      const choices = recognizedLines(text);
      setLines(choices);
      setChosenLines([]);
      setQuery("");
      setStep("text");
      if (!choices.length)
        setError(
          "글자를 찾지 못했어요. 다시 촬영하거나 장소 이름을 직접 입력해 주세요.",
        );
    } catch (e) {
      if (token === version.current) {
        setStep("review");
        setError(message(e));
      }
    } finally {
      if (token === version.current) {
        ocr.current = null;
        request.current = null;
      }
    }
  }

  function editText() {
    cancel();
    setSearching(false);
    setLocating(false);
    setPreparing(false);
    setStep("text");
    setError("");
  }
  function toggleLine(line: string) {
    const next = chosenLines.includes(line)
      ? chosenLines.filter((value) => value !== line)
      : [...chosenLines, line];
    setChosenLines(next);
    setQuery(next.join(" ").slice(0, 80));
  }

  /** 사진 검색용 위치만 확인하며 부모 화면의 GPS나 진행 중인 안내에 쓰지 않습니다. */
  async function locate() {
    cancel();
    const token = version.current,
      controller = new AbortController();
    request.current = controller;
    setLocating(true);
    setError("");
    try {
      const point = await getUserPosition(controller.signal);
      if (token === version.current) setOrigin(point);
    } catch (e) {
      if (token === version.current) {
        setOrigin(null);
        setError(message(e));
      }
    } finally {
      if (token === version.current) {
        setLocating(false);
        request.current = null;
      }
    }
  }

  /** 사용자가 확인한 단일 검색어만 요청합니다. OCR 점수로 장소를 자동 확정하지 않습니다. */
  async function search(event: FormEvent) {
    event.preventDefault();
    const name = query.trim(),
      center = validOrigin(origin),
      area = region.trim();
    if (name.length < 2) {
      setError("장소 이름을 2자 이상 입력해 주세요.");
      return;
    }
    if (!configured) {
      setError("지금은 장소를 검색할 수 없어요. 잠시 후 다시 시도해 주세요.");
      return;
    }
    if (!center && !area) {
      setError("현재 위치를 확인하거나 지역명을 입력해 주세요.");
      return;
    }
    const keyword = center ? name : `${area} ${name}`;
    if (keyword.length > 80) {
      setError("지역명과 검색어를 합해 80자 이내로 입력해 주세요.");
      return;
    }
    cancel();
    const token = version.current,
      controller = new AbortController();
    request.current = controller;
    setSearching(true);
    setError("");
    try {
      const result = await searchPlaces(
        keyword,
        controller.signal,
        center ?? undefined,
      );
      if (token !== version.current) return;
      setSearchCenter(center);
      setPlaces(result.places);
      setStep("results");
    } catch (e) {
      if (token === version.current) setError(message(e));
    } finally {
      if (token === version.current) {
        setSearching(false);
        request.current = null;
      }
    }
  }

  return (
    <section className="photo-place" aria-labelledby="photo-place-heading">
      <h2 id="photo-place-heading" ref={title} tabIndex={-1}>
        {step === "selected"
          ? "사진에서 찾은 장소"
          : step === "results"
            ? "어느 장소인가요?"
            : step === "text"
              ? "읽은 글자를 확인해 주세요"
              : step === "reading"
                ? "사진의 글자를 읽고 있어요"
                : step === "review"
                  ? "읽을 글자 부분을 선택해 주세요"
                  : "지금 계신 곳을 보여 주세요"}
      </h2>
      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}
      {/* 사진 입력/확인: 자동 실행하지 않고 사용자가 인식을 누를 때까지 미리보기만 보여줍니다. */}
      {(step === "input" || step === "review") && (
        <>
          {step==='input'&&<p className="photo-description">
            안전한 곳에 멈춰 주변 건물의 이름이나 글자가 보이게 촬영해 주세요.
          </p>}
          {step === "review" && preview && (
            <PhotoCropSelector
              src={preview}
              width={photo!.width}
              height={photo!.height}
              value={crop}
              onChange={setCrop}
            />
          )}
          {preparing && <p role="status">사진을 준비하고 있어요…</p>}
          <div className="photo-actions">
            <button
              className={step === "input" ? "primary" : "secondary"}
              disabled={preparing}
              onClick={() => camera.current?.click()}
            >
              <Icon name="camera" />
              사진 촬영
            </button>
            <button
              className="secondary"
              disabled={preparing}
              onClick={() => gallery.current?.click()}
            >
              사진 선택
            </button>
          </div>
          {step === "review" && (
            <button
              className="primary"
              disabled={!crop}
              onClick={() => void readPhoto()}
            >
              선택한 영역 읽기
            </button>
          )}
          <button
            className="text-button"
            disabled={preparing}
            onClick={editText}
          >
            장소 이름 직접 입력
          </button>
          <p className="photo-description photo-privacy">
            사진은 이 기기에서 처리하고 저장하거나 서버에 보내지 않아요.
          </p>
        </>
      )}
      {/* 입력은 파일 선택기가 필요할 때만 사용합니다. 사진 화면 진입만으로 권한을 요청하지 않습니다. */}
      <input
        ref={camera}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        aria-label="사진 촬영 파일"
        hidden
        onChange={(e) => void choosePhoto(e)}
      />
      <input
        ref={gallery}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label="선택한 사진 파일"
        hidden
        onChange={(e) => void choosePhoto(e)}
      />
      {/* 준비와 글자 읽기 진행률은 별개입니다. 모델 다운로드 100%를 전체 완료로 표시하지 않습니다. */}
      {step === "reading" && (
        <div className="photo-reading" role="status">
          <Icon name="search" size={36} />
          <p>
            {readingProgress.phase === "preparing"
              ? "인식 기능을 준비하고 있어요…"
              : "사진의 글자를 읽고 있어요…"}
          </p>
          {readingProgress.phase === "recognizing" && (
            <progress
              value={readingProgress.progress}
              max={1}
              aria-label="글자 인식 진행률"
            />
          )}
          <small>
            처음에는 한국어·영어 자료를 내려받아 시간이 걸릴 수 있어요.
          </small>
          <button
            className="secondary"
            onClick={() => {
              cancel();
              setStep("review");
            }}
          >
            인식 취소
          </button>
        </div>
      )}
      {/* 인식 원문을 검색하지 않고, 고른 줄/직접 고친 검색어에만 장소 검색을 연결합니다. */}
      {step === "text" && (
        <form className="photo-search" onSubmit={(e) => void search(e)}>
          {!!lines.length && (
            <>
              <p className="photo-description">
                간판의 상호와 지점명을 골라 검색어를 만들어요.
              </p>
              <div className="photo-lines" role="group" aria-label="읽은 글자">
                {lines.map((line) => (
                  <button
                    key={line}
                    type="button"
                    disabled={searching || locating}
                    aria-pressed={chosenLines.includes(line)}
                    onClick={() => toggleLine(line)}
                  >
                    {line}
                  </button>
                ))}
              </div>
            </>
          )}
          <label>
            장소 이름
            <input
              value={query}
              disabled={searching || locating}
              onChange={(e) => {
                setQuery(e.target.value);
                setChosenLines([]);
              }}
              maxLength={80}
              autoComplete="off"
              placeholder="예: 수협은행 서현역지점"
            />
          </label>
          <div className="photo-search-origin">
            <p>
              {validOrigin(origin)
                ? "현재 위치 주변 10km · 거리순으로 찾아요"
                : "주변을 찾을 위치 또는 지역명이 필요해요"}
            </p>
            <button
              type="button"
              className="text-button"
              disabled={searching || locating}
              onClick={() => void locate()}
            >
              {locating
                ? "현재 위치 확인 중…"
                : origin
                  ? "현재 위치 다시 확인"
                  : "현재 위치로 주변 검색"}
            </button>
          </div>
          {!validOrigin(origin) && (
            <label>
              지역명
              <input
                value={region}
                disabled={searching || locating}
                onChange={(e) => setRegion(e.target.value)}
                maxLength={40}
                placeholder="예: 성남시 분당구 서현동"
                autoComplete="off"
              />
            </label>
          )}
          <button
            className="primary"
            disabled={searching || locating || !configured}
            type="submit"
          >
            {searching ? "장소를 찾고 있어요…" : "장소 찾기"}
          </button>
          {!configured && (
            <p className="photo-description">
              장소 검색 연결을 확인한 뒤 다시 이용해 주세요.
            </p>
          )}
          {(searching || locating) && (
            <button
              type="button"
              className="secondary"
              onClick={() => {
                cancel();
                setSearching(false);
                setLocating(false);
              }}
            >
              조회 취소
            </button>
          )}
          {photo && (
            <button
              className="text-button"
              type="button"
              disabled={searching || locating}
              onClick={() => {
                setError("");
                setStep("review");
              }}
            >
              사진 다시 보기
            </button>
          )}
        </form>
      )}
      {/* 같은 체인의 지점이 여러 개여도 사용자가 주소를 비교해서 선택합니다. */}
      {step === "results" && (
        <>
          <p className="photo-description">
            {searchCenter
              ? "현재 위치 주변 10km · 거리순"
              : "입력한 지역명으로 검색했어요"}{" "}
            · 사진 속 장소와 주소를 비교해 주세요.
          </p>
          <div className="photo-candidates">
            {places.map((place) => (
              <button
                className="result-card"
                key={place.id}
                onClick={() => {
                  setSelected(place);
                  setStep("selected");
                }}
              >
                <Icon name="pin" />
                <span>
                  <strong>{place.name}</strong>
                  <small>{place.address}</small>
                  {searchCenter && (
                    <small>
                      직선{" "}
                      {formatDistance(distanceBetween(searchCenter, place))}
                    </small>
                  )}
                </span>
                <Icon name="chevron" size={18} />
              </button>
            ))}
          </div>
          {!places.length && (
            <p className="photo-empty">
              맞는 장소가 없어요. 상호·지점명이나 지역명을 바꿔 보세요.
            </p>
          )}
          <button className="secondary" onClick={editText}>
            검색어 수정
          </button>
        </>
      )}
      {/* 확인 완료는 화면만 닫습니다. 선택한 건물을 GPS나 길 안내 출발지로 대입하지 않습니다. */}
      {step === "selected" && selected && (
        <>
          <div className="photo-selected">
            <Icon name="pin" size={30} />
            <h3>{selected.name}</h3>
            <p>{selected.address}</p>
          </div>
          <p className="photo-description">
            사진에서 확인한 주변 장소예요. 현재 GPS 위치나 길 안내는 바뀌지
            않아요.
          </p>
          <button className="primary" onClick={() => onDone(selected)}>
            확인 완료
          </button>
          <button className="secondary" onClick={() => setStep("results")}>
            다른 후보 보기
          </button>
        </>
      )}
    </section>
  );
}

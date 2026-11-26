/** 사진 검증·축소·OCR 작업 수명 관리. 장소나 GPS를 변경하는 책임은 없습니다. */
export interface PreparedPhoto {
  blob: Blob;
  width: number;
  height: number;
}
export interface OcrProgress {
  phase: "preparing" | "recognizing";
  progress: number;
}
const aborted = () => new DOMException("작업 취소", "AbortError");

/** 파일은 사진 선택기에 들어온 값도 다시 검사하고, 긴 변만 줄여 글자 비율을 유지합니다. */
export async function preparePhoto(
  file: File,
  signal: AbortSignal,
): Promise<PreparedPhoto> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("JPG·PNG·WebP 사진을 선택해 주세요.");
  if (!file.size || file.size > 10 * 1024 * 1024)
    throw new Error("10MB 이하의 사진을 선택해 주세요.");
  if (signal.aborted) throw aborted();
  const url = URL.createObjectURL(file),
    image = new Image();
  try {
    await new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        signal.removeEventListener("abort", cancel);
        image.onload = null;
        image.onerror = null;
      };
      const cancel = () => {
        cleanup();
        image.src = "";
        reject(aborted());
      };
      signal.addEventListener("abort", cancel, { once: true });
      image.onload = () => {
        cleanup();
        resolve();
      };
      image.onerror = () => {
        cleanup();
        reject(new Error("사진을 열지 못했어요. 다른 사진을 선택해 주세요."));
      };
      image.src = url;
    });
    if (signal.aborted) throw aborted();
    if (!image.naturalWidth || !image.naturalHeight)
      throw new Error("사진 크기를 확인하지 못했어요.");
    const ratio = Math.min(
      1,
      2048 / Math.max(image.naturalWidth, image.naturalHeight),
    );
    const width = Math.max(1, Math.round(image.naturalWidth * ratio)),
      height = Math.max(1, Math.round(image.naturalHeight * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("이 브라우저에서 사진을 처리하지 못했어요.");
    // 투명 PNG도 흰 바탕에 글자가 남게 하고 브라우저가 해석한 촬영 방향을 사용합니다.
    context.fillStyle = "#fff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (value) =>
          value
            ? resolve(value)
            : reject(new Error("사진을 처리하지 못했어요.")),
        "image/jpeg",
        0.92,
      ),
    );
    canvas.width = canvas.height = 0;
    if (signal.aborted) throw aborted();
    return { blob, width, height };
  } finally {
    image.src = "";
    URL.revokeObjectURL(url);
  }
}

/**
 * 취소 가능한 OCR 한 건. 엔진 초기화가 끝나지 않아도 바깥 작업자를 즉시 종료할 수 있습니다.
 * 90초 제한은 성능 보장이 아니라 멈춘 작업을 정리하기 위한 상한입니다.
 */
export function startPhotoOcr(
  image: Blob,
  onProgress: (value: OcrProgress) => void,
) {
  const worker = new Worker("/photo-ocr-worker.js");
  let finish: (error?: Error, text?: string) => void = () => {};
  const promise = new Promise<string>((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(
      () =>
        finish(
          new Error(
            "인식이 오래 걸리고 있어요. 다시 시도하거나 직접 입력해 주세요.",
          ),
        ),
      90000,
    );
    finish = (error, text) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      error ? reject(error) : resolve(text ?? "");
    };
    worker.onmessage = ({ data }) => {
      if (data.type === "progress") onProgress(data as OcrProgress);
      else if (data.type === "result" && typeof data.text === "string")
        finish(undefined, data.text);
      else
        finish(
          new Error(
            "글자를 읽지 못했어요. 연결을 확인한 뒤 다시 시도하거나 직접 입력해 주세요.",
          ),
        );
    };
    worker.onerror = (event) => {
      event.preventDefault();
      finish(
        new Error(
          "인식 기능을 준비하지 못했어요. 다시 시도하거나 직접 입력해 주세요.",
        ),
      );
    };
    // 드물게 메시지 전달 자체가 실패해도 작업자/시간 제한을 남기지 않습니다.
    try {
      worker.postMessage({ image });
    } catch {
      finish(new Error("사진을 인식 작업에 전달하지 못했어요. 다시 선택해 주세요."));
    }
  });
  return { promise, cancel: () => finish(aborted()) };
}

/** OCR 원문을 외부로 보내지 않고 사용자가 고를 짧은 줄만 만듭니다. 검색은 명시적 선택 뒤에 합니다. */
export function recognizedLines(text: string): string[] {
  return [
    ...new Set(
      text
        .split(/\r?\n/)
        .map((line) =>
          line.normalize("NFKC").replace(/\s+/g, " ").trim().slice(0, 80),
        )
        .filter((line) => line.length >= 2),
    ),
  ].slice(0, 20);
}

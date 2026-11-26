/**
 * 사진 인식 전용 작업자: 화면과 분리해 글자를 읽습니다.
 * 부모 작업자가 종료되면 하위 Tesseract 작업자도 함께 종료되어 준비 중 취소도 처리됩니다.
 * 사진/인식 원문을 로그·서버·저장소에 기록하지 않습니다.
 */
self.onmessage = async ({ data }) => {
  let worker;
  try {
    const base = new URL("/ocr/v1/", self.location.origin).href;
    // 명시적 실행 뒤에만 OCR 엔진과 언어 자료를 같은 서비스에서 읽습니다.
    importScripts(`${base}tesseract.min.js`);
    worker = await self.Tesseract.createWorker(["kor", "eng"], 1, {
      workerPath: `${base}worker.min.js`,
      corePath: `${base}core`,
      langPath: `${base}lang`,
      workerBlobURL: false,
      cachePath: "gilbit-ocr-v1",
      logger: (message) =>
        self.postMessage({
          type: "progress",
          phase:
            message.status === "recognizing text" ? "recognizing" : "preparing",
          progress: Math.max(0, Math.min(1, message.progress || 0)),
        }),
      // 초기화 중 모델/코어 로딩 실패도 부모에게 알려 90초 제한까지 기다리게 하지 않습니다.
      errorHandler: () => self.postMessage({ type: "error" }),
    });
    const result = await worker.recognize(data.image, {}, { text: true });
    self.postMessage({ type: "result", text: result.data.text });
  } catch {
    // 라이브러리 내부 오류에는 사진/경로 정보가 포함될 수 있어 원문을 전송하지 않습니다.
    self.postMessage({ type: "error" });
  } finally {
    if (worker) await worker.terminate().catch(() => {});
    self.close();
  }
};

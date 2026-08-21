"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./style.module.css";

export type QrCameraProps = {
  onClose: () => void;
  onRead: (text: string) => void;
};

/** 解く前に縮める。端末のカメラは大きく、そのまま解くと1枚が重い */
const maxWidth = 640;

/**
 * カメラを開いてQRを読む。読めた時点で1回だけ知らせて閉じる。
 * 読み解きは使うときに取り寄せる。開かない人には配りたくない。
 */
export default function QrCamera({
  onClose,
  onRead,
}: QrCameraProps): React.JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<null | string>(null);

  useEffect(() => {
    const video = videoRef.current;

    if (video === null) {
      return undefined;
    }

    let stream: MediaStream | null = null;
    let frame = 0;
    let stopped = false;

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });

    void (async (): Promise<void> => {
      const jsQR = (await import("jsqr")).default;

      stream = await navigator.mediaDevices
        .getUserMedia({ video: { facingMode: "environment" } })
        .catch(() => null);

      if (stream === null) {
        setError(
          "カメラを使えませんでした。ブラウザの設定を確かめてください。",
        );

        return;
      }

      if (stopped) {
        stream.getTracks().forEach((track) => track.stop());

        return;
      }

      video.srcObject = stream;
      await video.play().catch(() => undefined);

      const tick = (): void => {
        if (stopped || context === null) {
          return;
        }

        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          const scale = Math.min(1, maxWidth / video.videoWidth);

          canvas.width = Math.round(video.videoWidth * scale);
          canvas.height = Math.round(video.videoHeight * scale);
          context.drawImage(video, 0, 0, canvas.width, canvas.height);

          const image = context.getImageData(0, 0, canvas.width, canvas.height);
          const found = jsQR(image.data, image.width, image.height);

          if (found !== null && found.data !== "") {
            onRead(found.data);

            return;
          }
        }

        frame = requestAnimationFrame(tick);
      };

      frame = requestAnimationFrame(tick);
    })();

    return (): void => {
      stopped = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [onRead]);

  return (
    <div className={styles.container}>
      {error === null ? (
        <>
          <video
            className={styles.video}
            muted={true}
            playsInline={true}
            ref={videoRef}
          />
          <p className={styles.note}>渡す端末に出ているQRを写してください。</p>
        </>
      ) : (
        <p className={styles.note}>{error}</p>
      )}
      <button className={styles.close} onClick={onClose} type="button">
        やめる
      </button>
    </div>
  );
}

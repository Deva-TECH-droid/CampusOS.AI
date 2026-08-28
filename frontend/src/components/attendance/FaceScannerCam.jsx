import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { AlertTriangle } from "lucide-react";
import { faceapi } from "../../hooks/useFaceApiModels";

const DETECT_OPTIONS = new faceapi.TinyFaceDetectorOptions({
  inputSize: 224,
  scoreThreshold: 0.5,
});

const STATUS_COPY = {
  loading: "Starting camera…",
  "no-face": "Center your face in the frame",
  multiple: "Only one face at a time, please",
  detected: "Face detected — hold still",
  denied: "Camera access was denied",
};

const BRACKET_COLOR = {
  loading: "border-gray-300",
  "no-face": "border-gray-300",
  multiple: "border-amber-400",
  detected: "border-emerald-500",
  denied: "border-gray-300",
};

/**
 * Live webcam feed with a face-scan reticle overlay. Runs continuous
 * face-api.js detection and exposes `capture()` via ref so parents decide
 * exactly when to grab a descriptor (button press, or an auto-lock timer).
 */
const FaceScannerCam = forwardRef(function FaceScannerCam(
  { active = true, onStatusChange },
  ref
) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const latestDetectionRef = useRef(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 480, height: 360, facingMode: "user" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera error:", err);
        if (!cancelled) {
          setStatus("denied");
          onStatusChange?.("denied");
        }
      }
    };

    start();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [active]);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    const tick = async () => {
      if (cancelled || !videoRef.current || videoRef.current.readyState < 2) {
        return;
      }
      try {
        const detections = await faceapi
          .detectAllFaces(videoRef.current, DETECT_OPTIONS)
          .withFaceLandmarks()
          .withFaceDescriptors();

        if (cancelled) return;

        let next;
        if (detections.length === 0) {
          next = "no-face";
          latestDetectionRef.current = null;
        } else if (detections.length > 1) {
          next = "multiple";
          latestDetectionRef.current = null;
        } else {
          next = "detected";
          latestDetectionRef.current = detections[0];
        }
        setStatus((prev) => (prev === "denied" ? prev : next));
        if (status !== "denied") onStatusChange?.(next);
      } catch (err) {
        // Model not ready yet on the very first ticks — ignore quietly.
      }
    };

    const interval = setInterval(tick, 350);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useImperativeHandle(ref, () => ({
    capture: () => {
      const d = latestDetectionRef.current;
      if (!d) return null;
      return Array.from(d.descriptor);
    },
    hasFace: () => !!latestDetectionRef.current,
  }));

  const bracketColor = BRACKET_COLOR[status];

  return (
    <div className="relative w-full max-w-sm mx-auto">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gray-900">
        {status === "denied" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-300 px-6 text-center">
            <AlertTriangle size={22} className="text-amber-400" />
            <p className="text-xs">
              Camera access was denied. Allow camera permission for this site
              and refresh the page.
            </p>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: "scaleX(-1)" }}
          />
        )}

        {/* Scan reticle — the signature element for this flow */}
        {status !== "denied" && (
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-8">
              {["top-0 left-0 border-t-2 border-l-2 rounded-tl-lg", "top-0 right-0 border-t-2 border-r-2 rounded-tr-lg", "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg", "bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg"].map(
                (cls, i) => (
                  <span
                    key={i}
                    className={`absolute w-7 h-7 transition-colors duration-300 ${bracketColor} ${cls}`}
                  />
                )
              )}
            </div>
            {status === "detected" && (
              <div className="absolute inset-8 rounded-lg border border-emerald-400/40 animate-pulse" />
            )}
          </div>
        )}
      </div>

      {status !== "denied" && (
        <p
          className={`mt-3 text-center text-xs font-medium ${
            status === "detected" ? "text-emerald-600" : "text-gray-500"
          }`}
        >
          {STATUS_COPY[status]}
        </p>
      )}
    </div>
  );
});

export default FaceScannerCam;

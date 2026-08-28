import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ScanFace, CheckCircle2, RotateCcw, Loader2 } from "lucide-react";
import FaceScannerCam from "../../components/attendance/FaceScannerCam";
import useFaceApiModels from "../../hooks/useFaceApiModels";
import {
  enrollFace,
  getFaceEnrollmentStatus,
  resetFaceEnrollment,
} from "../../api/attendance.api";

const SAMPLES_NEEDED = 5;

const FaceEnrollment = () => {
  const navigate = useNavigate();
  const { ready, error: modelError } = useFaceApiModels();
  const scannerRef = useRef(null);

  const [checkingStatus, setCheckingStatus] = useState(true);
  const [alreadyEnrolled, setAlreadyEnrolled] = useState(false);
  const [reEnrolling, setReEnrolling] = useState(false);

  const [scanStatus, setScanStatus] = useState("loading");
  const [samples, setSamples] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    getFaceEnrollmentStatus()
      .then(({ data }) => setAlreadyEnrolled(!!data?.data?.faceEnrolled))
      .catch(() => {})
      .finally(() => setCheckingStatus(false));
  }, []);

  const capturing = ready && (!alreadyEnrolled || reEnrolling) && !done;

  const handleCapture = () => {
    const descriptor = scannerRef.current?.capture();
    if (!descriptor) return;
    setSamples((prev) => {
      const next = [...prev, descriptor];
      return next.slice(0, SAMPLES_NEEDED);
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      await enrollFace(samples);
      setDone(true);
      setAlreadyEnrolled(true);
    } catch (err) {
      setSubmitError(
        err?.response?.data?.message || "Couldn't save your face profile. Try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async () => {
    await resetFaceEnrollment().catch(() => {});
    setSamples([]);
    setDone(false);
    setReEnrolling(true);
  };

  if (checkingStatus) {
    return (
      <div className="max-w-sm mx-auto py-24 flex justify-center">
        <Loader2 className="animate-spin text-gray-300" size={22} />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-8 px-4">
      <div className="text-center mb-6">
        <div className="w-11 h-11 rounded-xl bg-gray-900 flex items-center justify-center mx-auto mb-3">
          <ScanFace size={20} className="text-white" />
        </div>
        <h1 className="text-lg font-semibold text-gray-900">
          Face attendance setup
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          We'll use this to confirm it's really you when you check in to
          class — no one else can mark attendance on your behalf.
        </p>
      </div>

      {alreadyEnrolled && !reEnrolling && !done ? (
        <div className="bg-white border border-gray-100 rounded-xl p-5 text-center">
          <CheckCircle2 size={28} className="text-emerald-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">
            Your face is already enrolled
          </p>
          <p className="text-xs text-gray-500 mt-1 mb-4">
            You're all set to check in with face recognition.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => navigate("/attendance")}
              className="px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Go to check-in
            </button>
            <button
              onClick={() => setReEnrolling(true)}
              className="px-4 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={14} /> Re-scan my face
            </button>
          </div>
        </div>
      ) : done ? (
        <div className="bg-white border border-gray-100 rounded-xl p-5 text-center">
          <CheckCircle2 size={28} className="text-emerald-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">
            Face enrolled successfully
          </p>
          <p className="text-xs text-gray-500 mt-1 mb-4">
            You can now check in to class with your face.
          </p>
          <button
            onClick={() => navigate("/attendance")}
            className="px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Go to check-in
          </button>
        </div>
      ) : modelError ? (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-600 text-center">
          {modelError}
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <FaceScannerCam
            ref={scannerRef}
            active={capturing}
            onStatusChange={setScanStatus}
          />

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 mt-5">
            {Array.from({ length: SAMPLES_NEEDED }).map((_, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i < samples.length ? "bg-gray-900" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mt-2">
            {samples.length}/{SAMPLES_NEEDED} samples captured — turn your
            head very slightly between captures for a stronger match
          </p>

          {submitError && (
            <p className="text-center text-xs text-red-600 mt-3">
              {submitError}
            </p>
          )}

          <div className="mt-5">
            {samples.length < SAMPLES_NEEDED ? (
              <button
                onClick={handleCapture}
                disabled={!ready || scanStatus !== "detected"}
                className="w-full px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {ready ? `Capture sample ${samples.length + 1}` : "Loading models…"}
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                {submitting ? "Saving…" : "Save my face profile"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FaceEnrollment;

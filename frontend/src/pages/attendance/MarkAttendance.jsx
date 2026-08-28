import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarClock,
  CheckCircle2,
  Loader2,
  ScanFace,
  XCircle,
  Clock,
} from "lucide-react";
import FaceScannerCam from "../../components/attendance/FaceScannerCam";
import useFaceApiModels from "../../hooks/useFaceApiModels";
import {
  getActivePeriod,
  getFaceEnrollmentStatus,
  markAttendance,
} from "../../api/attendance.api";

const LOCK_TICKS_NEEDED = 3; // consecutive "detected" ticks before auto-submit

const MarkAttendance = () => {
  const { ready, error: modelError } = useFaceApiModels();
  const scannerRef = useRef(null);
  const lockCounter = useRef(0);
  const submittedRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [faceEnrolled, setFaceEnrolled] = useState(true);
  const [period, setPeriod] = useState(null);
  const [alreadyMarked, setAlreadyMarked] = useState(false);
  const [markedAt, setMarkedAt] = useState(null);

  const [scanStatus, setScanStatus] = useState("loading");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // 'success' | 'error'
  const [resultMessage, setResultMessage] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [statusRes, periodRes] = await Promise.all([
        getFaceEnrollmentStatus(),
        getActivePeriod(),
      ]);
      setFaceEnrolled(!!statusRes?.data?.data?.faceEnrolled);
      const p = periodRes?.data?.data;
      setPeriod(p?.period || null);
      setAlreadyMarked(!!p?.alreadyMarked);
      setMarkedAt(p?.markedAt || null);
    } catch (err) {
      // dashboard-style pages fail open — just show the empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const canScan =
    ready && faceEnrolled && period && !alreadyMarked && !result;

  const handleSubmit = useCallback(async () => {
    if (submittedRef.current) return;
    const descriptor = scannerRef.current?.capture();
    if (!descriptor) return;

    submittedRef.current = true;
    setSubmitting(true);
    try {
      await markAttendance(descriptor);
      setResult("success");
      setResultMessage(`Marked present for ${period?.subject}`);
      setAlreadyMarked(true);
      setMarkedAt(new Date().toISOString());
    } catch (err) {
      setResult("error");
      setResultMessage(
        err?.response?.data?.message ||
          "Couldn't verify your face. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }, [period]);

  const handleStatusChange = useCallback(
    (status) => {
      if (!canScan || submittedRef.current) return;
      if (status === "detected") {
        lockCounter.current += 1;
        if (lockCounter.current >= LOCK_TICKS_NEEDED) {
          handleSubmit();
        }
      } else {
        lockCounter.current = 0;
      }
      setScanStatus(status);
    },
    [canScan, handleSubmit]
  );

  const retry = () => {
    submittedRef.current = false;
    lockCounter.current = 0;
    setResult(null);
    setResultMessage("");
  };

  if (loading) {
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
          Face check-in
        </h1>
        {period && (
          <p className="text-sm text-gray-500 mt-1">
            {period.subject} · {period.startTime}–{period.endTime}
            {period.faculty ? ` · ${period.faculty}` : ""}
          </p>
        )}
      </div>

      {!faceEnrolled ? (
        <div className="bg-white border border-gray-100 rounded-xl p-5 text-center">
          <ScanFace size={26} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">
            You haven't enrolled your face yet
          </p>
          <p className="text-xs text-gray-500 mt-1 mb-4">
            Set it up once — it takes under a minute — then you can check in
            to every class this way.
          </p>
          <Link
            to="/attendance/enroll"
            className="inline-block px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Enroll my face
          </Link>
        </div>
      ) : !period ? (
        <div className="bg-white border border-gray-100 rounded-xl p-5 text-center">
          <CalendarClock size={26} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">
            No class in session right now
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Check-in opens 10 minutes before each scheduled period and stays
            open for 15 minutes after it ends.
          </p>
        </div>
      ) : alreadyMarked && !result ? (
        <div className="bg-white border border-gray-100 rounded-xl p-5 text-center">
          <CheckCircle2 size={28} className="text-emerald-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">
            Already marked present
          </p>
          {markedAt && (
            <p className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
              <Clock size={12} />
              {new Date(markedAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>
      ) : result === "success" ? (
        <div className="bg-white border border-gray-100 rounded-xl p-5 text-center">
          <CheckCircle2 size={28} className="text-emerald-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">{resultMessage}</p>
          <Link
            to="/attendance/history"
            className="inline-block mt-4 text-xs font-medium text-gray-500 hover:text-gray-900 underline underline-offset-2"
          >
            View attendance history
          </Link>
        </div>
      ) : result === "error" ? (
        <div className="bg-white border border-gray-100 rounded-xl p-5 text-center">
          <XCircle size={28} className="text-red-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">Couldn't check you in</p>
          <p className="text-xs text-gray-500 mt-1 mb-4">{resultMessage}</p>
          <button
            onClick={retry}
            className="px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Try again
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
            active={canScan}
            onStatusChange={handleStatusChange}
          />
          <p className="text-center text-xs text-gray-400 mt-4">
            {submitting
              ? "Verifying…"
              : "Look at the camera and hold still — attendance marks automatically"}
          </p>
        </div>
      )}
    </div>
  );
};

export default MarkAttendance;

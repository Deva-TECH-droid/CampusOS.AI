import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarClock,
  CheckCircle2,
  Loader2,
  ScanFace,
  XCircle,
  Clock,
  AlertTriangle,
  Lock,
  Unlock,
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

  // Countdown timer for 3-minute window (Req 10)
  const [countdown, setCountdown] = useState(0);
  const [bypassWindow, setBypassWindow] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [statusRes, periodRes] = await Promise.all([
        getFaceEnrollmentStatus(),
        getActivePeriod(),
      ]);
      setFaceEnrolled(!!statusRes?.data?.data?.faceEnrolled);
      const p = periodRes?.data?.data;
      const actPeriod = p?.period || null;
      setPeriod(actPeriod);
      setAlreadyMarked(!!p?.alreadyMarked);
      setMarkedAt(p?.markedAt || null);

      if (actPeriod?.secondsRemaining) {
        setCountdown(actPeriod.secondsRemaining);
      }
    } catch (err) {
      // fail open
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Live countdown ticker
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const isWindowOpen =
    bypassWindow || (period && period.attendanceStatus === "OPEN" && countdown > 0);
  const isWindowClosed =
    !bypassWindow && period && (period.attendanceStatus === "CLOSED" || countdown <= 0);

  const canScan =
    ready && faceEnrolled && period && !alreadyMarked && !result && isWindowOpen;

  const handleSubmit = useCallback(
    async (forceBypass = false) => {
      if (submittedRef.current) return;
      const descriptor = scannerRef.current?.capture();
      if (!descriptor) return;

      submittedRef.current = true;
      setSubmitting(true);
      try {
        await markAttendance(descriptor, forceBypass || bypassWindow);
        setResult("success");
        setResultMessage(`Marked present for ${period?.subject}`);
        setAlreadyMarked(true);
        setMarkedAt(new Date().toISOString());
      } catch (err) {
        setResult("error");
        setResultMessage(
          err?.response?.data?.message ||
            "Couldn't verify your face. Please try again with clear lighting."
        );
      } finally {
        setSubmitting(false);
      }
    },
    [period, bypassWindow]
  );

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

  const formatCountdown = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="max-w-sm mx-auto py-24 flex justify-center">
        <Loader2 className="animate-spin text-gray-300" size={22} />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-8 px-4 space-y-4">
      {/* Header */}
      <div className="text-center mb-2">
        <div className="w-12 h-12 rounded-2xl bg-gray-950 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
          <ScanFace size={22} className="text-emerald-400" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">
          Student Face Check-In
        </h1>
        {period && (
          <p className="text-xs text-gray-500 mt-1">
            {period.subject} · {period.startTime} – {period.endTime}
            {period.faculty ? ` · ${period.faculty}` : ""}
          </p>
        )}
      </div>

      {/* 3-Minute Attendance Window Status Badge (Requirement 10) */}
      {period && !alreadyMarked && !result && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
            isWindowOpen
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-red-50 border-red-200 text-red-900"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                isWindowOpen
                  ? "bg-emerald-600 text-white animate-pulse"
                  : "bg-red-600 text-white"
              }`}
            >
              {isWindowOpen ? <Unlock size={15} /> : <Lock size={15} />}
            </div>
            <div>
              <p className="text-xs font-bold">
                {isWindowOpen
                  ? `Attendance: OPEN (${period.startTime} – ${period.windowCloseTime || "first 3 mins"})`
                  : "Attendance: CLOSED"}
              </p>
              <p className="text-[11px] opacity-80">
                {isWindowOpen
                  ? `Window closes in ${formatCountdown(countdown)}`
                  : "Allowed 3-minute window expired. Unmarked students are Absent."}
              </p>
            </div>
          </div>

          {/* Test / Demo Mode Bypass button */}
          <button
            onClick={() => setBypassWindow((b) => !b)}
            className="text-[10px] px-2 py-1 rounded-md border border-current opacity-70 hover:opacity-100 transition-opacity whitespace-nowrap"
            title="Toggle demo mode to test face scan outside live window"
          >
            {bypassWindow ? "Demo Mode ON" : "Test Mode"}
          </button>
        </div>
      )}

      {/* Card Content States */}
      {!faceEnrolled ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center space-y-3 shadow-sm">
          <ScanFace size={28} className="text-gray-300 mx-auto" />
          <h3 className="text-sm font-bold text-gray-900">
            You haven't enrolled your face profile
          </h3>
          <p className="text-xs text-gray-500 max-w-xs mx-auto">
            Take 30 seconds to enroll your face, and your camera will automatically mark your attendance.
          </p>
          <Link
            to="/attendance/enroll"
            className="inline-block px-4 py-2.5 rounded-xl bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 transition-colors shadow-sm"
          >
            Enroll My Face
          </Link>
        </div>
      ) : !period ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center space-y-2 shadow-sm">
          <CalendarClock size={28} className="text-gray-300 mx-auto" />
          <h3 className="text-sm font-bold text-gray-900">
            No class in session right now
          </h3>
          <p className="text-xs text-gray-500">
            Attendance check-in opens during the first 3 minutes of scheduled classroom periods.
          </p>
          <Link
            to="/attendance/history"
            className="inline-block text-xs font-medium text-indigo-600 hover:underline pt-2"
          >
            View your attendance records
          </Link>
        </div>
      ) : alreadyMarked && !result ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center space-y-2 shadow-sm">
          <CheckCircle2 size={32} className="text-emerald-500 mx-auto" />
          <h3 className="text-sm font-bold text-gray-900">
            Already Marked Present
          </h3>
          <p className="text-xs text-gray-500">
            Your attendance for {period.subject} has been recorded.
          </p>
          {markedAt && (
            <p className="text-xs text-emerald-700 font-semibold flex items-center justify-center gap-1 pt-1">
              <Clock size={12} />
              Verified at {new Date(markedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>
      ) : isWindowClosed && !bypassWindow && !result ? (
        <div className="bg-white border border-red-100 rounded-2xl p-6 text-center space-y-3 shadow-sm">
          <XCircle size={32} className="text-red-500 mx-auto" />
          <h3 className="text-sm font-bold text-gray-900">
            Attendance Window Closed
          </h3>
          <p className="text-xs text-gray-500 max-w-xs mx-auto">
            Attendance was strictly open for the first 3 minutes of the lecture. You have been marked absent for this session.
          </p>
          <button
            onClick={() => setBypassWindow(true)}
            className="text-xs text-indigo-600 font-semibold hover:underline block mx-auto"
          >
            Demo / Test check-in
          </button>
        </div>
      ) : result === "success" ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center space-y-3 shadow-sm">
          <CheckCircle2 size={36} className="text-emerald-500 mx-auto" />
          <h3 className="text-sm font-bold text-gray-900">{resultMessage}</h3>
          <p className="text-xs text-gray-500">
            Your teacher has been notified of your check-in.
          </p>
          <Link
            to="/attendance/history"
            className="inline-block mt-2 text-xs font-semibold text-gray-900 hover:underline"
          >
            View Attendance History →
          </Link>
        </div>
      ) : result === "error" ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center space-y-3 shadow-sm">
          <XCircle size={32} className="text-red-500 mx-auto" />
          <h3 className="text-sm font-bold text-gray-900">Verification Failed</h3>
          <p className="text-xs text-gray-500">{resultMessage}</p>
          <button
            onClick={retry}
            className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : modelError ? (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-xs text-red-700 text-center">
          {modelError}
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="rounded-xl overflow-hidden bg-black aspect-4/3 relative">
            <FaceScannerCam
              ref={scannerRef}
              active={canScan}
              onStatusChange={handleStatusChange}
            />
          </div>

          <div className="text-center pt-2">
            <p className="text-xs font-semibold text-gray-700">
              {submitting
                ? "Verifying face with enrolled profile…"
                : "Center your face in the camera — verified automatically"}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Strict 3-minute window enforcement
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarkAttendance;

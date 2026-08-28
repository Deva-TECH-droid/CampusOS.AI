import { useCallback, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ScanFace, CheckCircle2, XCircle, History } from "lucide-react";
import FaceScannerCam from "../../components/attendance/FaceScannerCam";
import useFaceApiModels from "../../hooks/useFaceApiModels";
import { kioskRecognize } from "../../api/attendance.api";

const LOCK_TICKS_NEEDED = 3;
const RESULT_DISPLAY_MS = 2500;

/**
 * Shared-device "walk up and scan" mode. Meant to be left open on a
 * classroom PC/tablet — whoever is logged in on this device just acts as
 * the operator; each result is matched and marked against whichever
 * student's face was actually recognized, not the operator's account.
 */
const KioskCheckIn = () => {
  const { ready, error: modelError } = useFaceApiModels();
  const scannerRef = useRef(null);
  const lockCounter = useRef(0);
  const busyRef = useRef(false);

  const [scanStatus, setScanStatus] = useState("loading");
  const [result, setResult] = useState(null); // { kind: 'success'|'already'|'error', ... }

  const resetSoon = () => {
    setTimeout(() => {
      setResult(null);
      lockCounter.current = 0;
      busyRef.current = false;
    }, RESULT_DISPLAY_MS);
  };

  const handleSubmit = useCallback(async () => {
    if (busyRef.current) return;
    const descriptor = scannerRef.current?.capture();
    if (!descriptor) return;

    busyRef.current = true;
    try {
      const { data } = await kioskRecognize(descriptor);
      const payload = data?.data;
      setResult({
        kind: payload?.alreadyMarked ? "already" : "success",
        name: payload?.student?.name,
        rollNumber: payload?.student?.rollNumber,
        subject: payload?.subject,
      });
    } catch (err) {
      setResult({
        kind: "error",
        message:
          err?.response?.data?.message ||
          "Couldn't recognize that face. Try again.",
      });
    } finally {
      resetSoon();
    }
  }, []);

  const handleStatusChange = useCallback(
    (status) => {
      if (busyRef.current) return;
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
    [handleSubmit]
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-10 bg-gray-950 -m-6 rounded-2xl">
      <div className="flex items-center gap-2 text-gray-400 mb-6">
        <ScanFace size={18} />
        <span className="text-sm font-medium tracking-wide uppercase">
          Kiosk check-in
        </span>
      </div>

      <div className="w-full max-w-sm">
        {modelError ? (
          <p className="text-center text-sm text-red-400">{modelError}</p>
        ) : (
          <FaceScannerCam
            ref={scannerRef}
            active={ready && !busyRef.current}
            onStatusChange={handleStatusChange}
          />
        )}
      </div>

      {/* Result overlay */}
      <div className="mt-8 min-h-[92px] w-full max-w-sm text-center">
        {result?.kind === "success" && (
          <div>
            <CheckCircle2 size={30} className="text-emerald-400 mx-auto mb-2" />
            <p className="text-white text-lg font-semibold">{result.name}</p>
            <p className="text-emerald-400 text-sm">
              {result.rollNumber} · marked present for {result.subject}
            </p>
          </div>
        )}
        {result?.kind === "already" && (
          <div>
            <CheckCircle2 size={30} className="text-blue-400 mx-auto mb-2" />
            <p className="text-white text-lg font-semibold">{result.name}</p>
            <p className="text-blue-400 text-sm">
              {result.rollNumber} · already checked in
            </p>
          </div>
        )}
        {result?.kind === "error" && (
          <div>
            <XCircle size={30} className="text-red-400 mx-auto mb-2" />
            <p className="text-red-300 text-sm">{result.message}</p>
          </div>
        )}
        {!result && (
          <p className="text-gray-500 text-sm">
            Next student — step up and look at the camera
          </p>
        )}
      </div>

      <Link
        to="/attendance/history"
        className="mt-6 flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
      >
        <History size={13} /> View attendance history
      </Link>
    </div>
  );
};

export default KioskCheckIn;

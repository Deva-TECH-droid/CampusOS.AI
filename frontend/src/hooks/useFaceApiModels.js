import { useEffect, useState } from "react";
import * as faceapi from "face-api.js";

const MODEL_URL = "/models";

// Models are large (a few MB) — load once per browser session and share
// the promise across every component that needs them.
let loadPromise = null;

const loadModels = () => {
  if (!loadPromise) {
    loadPromise = Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
  }
  return loadPromise;
};

/**
 * Loads the tiny face detector, 68-point landmark, and recognition
 * networks used for enrollment + check-in. Returns { ready, error }.
 */
const useFaceApiModels = () => {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    loadModels()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((err) => {
        console.error("Failed to load face-api models:", err);
        if (!cancelled)
          setError(
            "Couldn't load the face recognition models. Check your connection and refresh."
          );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { ready, error };
};

export default useFaceApiModels;
export { faceapi };

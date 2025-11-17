"use client";

import { useEffect, useState } from "react";
import { DancingCharacter } from "./dancing-character";

export function AgeVerificationModal() {
  const [show, setShow] = useState(false);
  const [error, setError] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined") return;

    // Check sessionStorage for age verification
    const verified = sessionStorage.getItem("age_verified");
    if (!verified) {
      // Small delay to ensure page content loads first
      setTimeout(() => setShow(true), 300);
    }
  }, []);

  const handleYes = () => {
    if (typeof window === "undefined") return;
    
    setIsClosing(true);
    
    // Store verification in sessionStorage
    sessionStorage.setItem("age_verified", "true");
    
    // Smooth fade out before hiding
    setTimeout(() => {
      setShow(false);
      setIsClosing(false);
    }, 300);
  };

  const handleNo = () => {
    setError(true);
    
    // Shake animation trigger
    const buttons = document.querySelectorAll(".age-gate-button");
    buttons.forEach((btn) => {
      btn.classList.add("shake");
      setTimeout(() => btn.classList.remove("shake"), 500);
    });
  };

  // Don't render if not showing
  if (!show) return null;

  return (
    <>
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(50px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          10%, 30%, 50%, 70%, 90% {
            transform: translateX(-5px);
          }
          20%, 40%, 60%, 80% {
            transform: translateX(5px);
          }
        }

        .modal-overlay {
          animation: fadeIn 0.3s ease-out;
        }

        .modal-overlay.closing {
          animation: fadeOut 0.3s ease-out;
        }

        .modal-content {
          animation: slideUp 0.4s ease-out;
        }

        :global(.shake) {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>

      <div
        className={`modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm ${
          isClosing ? "closing" : ""
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="age-gate-title"
        aria-describedby="age-gate-description"
      >
        <div className="modal-content mx-4 w-full max-w-md rounded-3xl border-2 border-emerald-200 bg-white p-8 shadow-2xl">
          {/* Dancing Character */}
          <div className="mb-6 flex justify-center">
            <DancingCharacter />
          </div>

          {/* Title */}
          <h2
            id="age-gate-title"
            className="text-center text-3xl font-bold text-slate-900"
          >
            Age Verification Required
          </h2>

          {/* Description */}
          <p
            id="age-gate-description"
            className="mt-4 text-center text-base text-slate-600"
          >
            You must be of legal drinking age (21+) to access this website.
          </p>

          {/* Buttons */}
          <div className="mt-8 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleYes}
              className="age-gate-button flex items-center justify-center rounded-full bg-emerald-600 px-8 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300"
              aria-label="Confirm you are 21 or older"
            >
              Yes, I&apos;m 21+
            </button>
            <button
              type="button"
              onClick={handleNo}
              className="age-gate-button flex items-center justify-center rounded-full border-2 border-slate-300 bg-white px-8 py-4 text-lg font-bold text-slate-700 transition hover:border-rose-400 hover:text-rose-600 focus:outline-none focus:ring-4 focus:ring-slate-200"
              aria-label="You are under 21"
            >
              No
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="mt-6 rounded-lg border-2 border-rose-200 bg-rose-50 p-4 text-center"
              role="alert"
              aria-live="assertive"
            >
              <p className="text-sm font-semibold text-rose-800">
                You must be of legal drinking age to use this website.
              </p>
              <p className="mt-1 text-xs text-rose-600">
                Press &quot;Yes&quot; if you are of legal drinking age.
              </p>
            </div>
          )}

          {/* Legal Disclaimer */}
          <div className="mt-6 space-y-2 text-center text-xs text-slate-500">
            <p>
              By clicking &quot;Yes&quot;, you confirm that you meet the legal drinking age
              requirement in your jurisdiction.
            </p>
            <p>
              Information on this site is aggregated from multiple sources. Users are responsible
              for their own decisions. Please verify details with venues and drink responsibly.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}


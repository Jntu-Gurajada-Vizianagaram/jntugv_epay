import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

export function AnnouncementBanner({ resetDismissalOnEnter }) {
  const [announcement, setAnnouncement] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [dismissKey, setDismissKey] = useState(null);
  const location = useLocation();

  useEffect(() => {
    async function loadAnnouncement() {
      // Try static announcement first (served from public/announcement.json)
      try {
        const res = await axios.get("/announcement.json");
        if (res?.data) {
          setAnnouncement(res.data);
          return;
        }
      } catch (err) {
        // ignore static fetch errors and do nothing
      }

      // Fallback: no polling to backend by default for static mode
      try {
        const res2 = await axios.get("/api/system/announcement");
        setAnnouncement(res2.data || null);
      } catch {}
    }

    loadAnnouncement();

    return () => {};
  }, []);

  // compute dismiss key and check/clear localStorage when announcement changes
  useEffect(() => {
    if (!announcement) {
      setDismissKey(null);
      setDismissed(false);
      return;
    }

    const key = `announcementDismissed:${encodeURIComponent(announcement.title || announcement.message?.slice(0,40) || 'anon')}`;
    setDismissKey(key);
    try {
      if (resetDismissalOnEnter) {
        localStorage.removeItem(key);
        setDismissed(false);
      } else {
        const v = localStorage.getItem(key);
        setDismissed(v === "1");
      }
    } catch {
      setDismissed(false);
    }
  }, [announcement, resetDismissalOnEnter]);

  if (location.pathname !== "/") return null; // show only on root page
  if (!announcement || (!announcement.message && !announcement.title)) return null;
  if (dismissed) return null;

  const paragraphs = (announcement.message || "").split(/\n\n+/).map(p => p.trim()).filter(Boolean);

  const handleClose = () => {
    try {
      if (dismissKey) localStorage.setItem(dismissKey, "1");
    } catch {}
    setDismissed(true);
  };

  return (
    <div className="relative bg-yellow-50 border-l-4 border-yellow-600 text-yellow-900 py-3 px-4 text-sm" role="status" aria-live="polite">
      <button onClick={handleClose} aria-label="Dismiss announcement" className="absolute right-2 top-1 text-yellow-800 hover:text-yellow-900">
        ×
      </button>

      {announcement.title && (
        <div className="font-semibold text-sm mb-1 text-center">{announcement.title}</div>
      )}

      <div className="max-w-4xl mx-auto text-left text-xs sm:text-sm leading-relaxed">
        {paragraphs.map((p, i) => {
          const isCritical = /DO NOT MAKE/i.test(p) || /DO NOT MAKE ANY OFFICIAL PAYMENT/i.test(p);
          return (
            <p key={i} className={`${isCritical ? 'text-red-700 font-bold uppercase' : (i===0? 'font-medium' : '')} mb-1`}>{p}</p>
          );
        })}
      </div>
    </div>
  );
}

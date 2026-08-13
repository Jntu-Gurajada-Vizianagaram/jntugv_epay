import React from "react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { AnnouncementBanner } from "../components/AnnouncementBanner";

export function PortalLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* --- Sticky Header --- */}
      <Header />

      <AnnouncementBanner resetDismissalOnEnter={true} />

      {/* --- Main Container --- */}
      <main className="flex-1 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex gap-6">

          {/* OPTIONAL SIDEBAR (hidden for now) */}
          {/* <aside className="hidden md:block w-64">
            <Sidebar />
          </aside> */}

          {/* MAIN CONTENT AREA */}
          <section className="flex-1">

            {/* PAGE WRAPPER WITH POLISHED LOOK */}
            <div
              className="
                bg-white 
                shadow-sm 
                rounded-xl 
                border border-gray-200 
                p-6 
                mb-10 
                transition-all 
                duration-200
              "
            >
              {children}
            </div>

            {/* FOOTER ALWAYS AT BOTTOM */}
            <Footer />
          </section>
        </div>
      </main>
    </div>
  );
}

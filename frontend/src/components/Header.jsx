import React, { useState, useEffect } from "react";
import { NavLink, Link } from "react-router-dom";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Add shadow + shrink on scroll
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <>
      <header
        className={`
        fixed top-0 inset-x-0 z-50
        backdrop-blur-xl bg-white/90
        transition-all duration-300
        border-b border-gray-200
        ${scrolled ? "shadow-lg" : "shadow-sm"}
      `}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">

          {/* LEFT — BRANDING */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="
              w-11 h-11 rounded-xl overflow-hidden border border-gray-300
              shadow-md bg-white flex items-center justify-center
              transition-transform duration-300 group-hover:scale-105
            ">
              <img
                src="https://jntugv.edu.in/static/media/jntugvcev.b33bb43b07b2037ab043.jpg"
                alt="JNTU-GV Logo"
                className="w-full h-full object-contain p-1"
              />
            </div>

            <div className="leading-tight">
              <div className="font-semibold text-[17px] text-gray-900 tracking-tight">
                JNTU-GV e-Payment Portal
              </div>
              <div className="text-[11px] text-gray-600">
                Jawaharlal Nehru Technological University, Gurajada Vizianagaram
              </div>
            </div>
          </Link>

          {/* RIGHT — DESKTOP NAVIGATION */}
          <nav className="hidden md:flex items-center gap-6 text-[15px] font-medium">
            <DesktopNav to="/" label="Home" />
            <DesktopNav to="/exam-fee" label="Exams" />
            <DesktopNav to="/certificates" label="Certificates" />
            <DesktopNav to="/phd-fee" label="Ph.D Fees" />
            <DesktopNav to="/admissions" label="Admissions" />
            <DesktopNav to="/history" label="History" />
            <DesktopNav to="/about" label="About" />
            <DesktopNav to="/test-sbi-epay" label="Test SBI ePay" />
            <DesktopNav to="/test-multi-account" label="Test Multi-Account" />
            <DesktopNav to="/faq" label="FAQ" />
            <DesktopNav to="/terms" label="Terms" />
            <DesktopNav to="/privacy" label="Privacy" />
            <DesktopNav to="/contact" label="Contact" />
          </nav>

          {/* MOBILE MENU BUTTON */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden text-gray-700 text-3xl"
          >
            ☰
          </button>

        </div>
      </header>

      {/* MOBILE DRAWER MENU */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm animate-fadeIn"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="absolute top-0 right-0 w-72 h-full bg-white shadow-xl p-6 flex flex-col gap-4 animate-slideIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
               <div className="font-semibold text-lg text-gray-800">Menu</div>
               <button
                 onClick={() => setMobileOpen(false)}
                 className="text-xl text-gray-700"
               >
                 ✕
               </button>
            </div>

            <MobileNav to="/" label="Home" />
            <MobileNav to="/exam-fee" label="Exams" />
            <MobileNav to="/certificates" label="Certificates" />
            <MobileNav to="/phd-fee" label="Ph.D Fees" />
            <MobileNav to="/admissions" label="Admissions" />
            <MobileNav to="/history" label="History" />
            <MobileNav to="/about" label="About" />
            <MobileNav to="/contact" label="Contact" />
          </div>
        </div>
      )}

      {/* SPACER */}
      <div className="h-16" />
    </>
  );
}

/* DESKTOP NAV ITEM */
function DesktopNav({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `
        relative pb-1 transition colors duration-200 
        ${isActive ? "text-blue-700 font-semibold" : "text-gray-700"}
      `
      }
    >
      {label}
      <span
        className="
          absolute left-0 -bottom-0.5 w-0 h-[2px] bg-blue-700 transition-all duration-300
          group-hover:w-full
        "
      ></span>
    </NavLink>
  );
}

/* MOBILE NAV ITEM */
function MobileNav({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `
        block text-[16px] font-medium py-2 border-b
        ${isActive ? "text-blue-700" : "text-gray-900"}
      `
      }
    >
      {label}
    </NavLink>
  );
}

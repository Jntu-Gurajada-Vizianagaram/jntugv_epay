import React from "react";
import { CardTile } from "../components/CardTile";

export function Home() {
  return (
    <div className="w-full">

      {/* ================= TOP HERO SECTION ================= */}
      <div className="
        bg-blue-50 border border-blue-100 rounded-2xl shadow-sm 
        p-4 sm:p-6 lg:p-8 
        mb-10
      ">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-blue-900 mb-3">
          Unified Payments Portal – JNTU-GV
        </h2>

        <div className="space-y-3 text-sm sm:text-[15px] leading-relaxed text-gray-700">
          <p>
            The <strong>Unified Payments Portal of Jawaharlal Nehru Technological University Gurajada, Vizianagaram (JNTU-GV)</strong>
            is an integrated and secure digital platform designed to streamline all student-centric and institutional financial
            services under a single interface.
          </p>

          <p>
            This system is developed in <strong>Joint Collaboration with the State Bank of India (SBI)</strong> to ensure safe,
            seamless, and real-time electronic payments through industry-standard banking protocols. 
          </p>

          <p>
            The platform supports Examination Fees, Certificate Fees (OD / PC / CMM / Migration), Admission Processing, Affiliation Fees,
            Direct Challans, and Ph.D. Scholar Payments. Each transaction is securely recorded and acknowledged instantly.
          </p>

          <p className="text-xs italic text-gray-600">
            *This portal is an official digital initiative of JNTU-GV in collaboration with SBI to enhance efficiency,
            accessibility, and reliability across the University ecosystem.*
          </p>
        </div>
      </div>

      {/* ================= SERVICE TILE SECTION ================= */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Select a Service</h2>
        <p className="text-sm text-gray-600">
          Choose a category to proceed with safe & secure university payments.
        </p>
      </div>

      {/* MOBILE → SINGLE COLUMN | TABLET → 2 COLS | DESKTOP → 3 COLS */}
      <div className="
        grid grid-cols-1 
        sm:grid-cols-2 
        lg:grid-cols-3 
        gap-4 sm:gap-6 lg:gap-8 
        pb-12
      ">
        <CardTile to="/exam-fee" title="Examination Fees" desc="Regular & supplementary fees" icon="🧾" accent="blue" />
        <CardTile to="/certificates" title="Certificates" desc="OD, PC, Migration, CMM" icon="📜" accent="emerald" />
        <CardTile to="/phd-fee" title="Ph.D Scholar Fees" desc="Registration, tuition & semester fees" icon="🎓" accent="purple" />
        <CardTile to="/admissions" title="Admissions" desc="New admissions & special category fees" icon="🎟️" accent="amber" />
        <CardTile to="/affiliation" title="Affiliation Fees" desc="College affiliation & inspections" icon="🏛️" accent="rose" />
        <CardTile to="/challan" title="Direct Challans" desc="Other challans, fines & miscellaneous" icon="💳" accent="teal" />
        <CardTile to="/test-multi-account" title="Test Multi-Account" desc="Test splits (For dev only)" icon="🧪" accent="gray" />
       <CardTile to="/test-sbi-epay" title="Test SBI ePay" desc="Test SBI ePay flow (For dev only)" icon="🧪" accent="gray" />
        <CardTile to="/faq" title="FAQ" desc="Frequently asked questions" icon="❓" accent="indigo" />
        <CardTile to="/terms" title="Terms & Conditions" desc="Legal terms and conditions" icon="📄" accent="green" />
        <CardTile to="/privacy" title="Privacy Policy" desc="Data protection and privacy rights" icon="🔒" accent="yellow" />

      </div>


      {/* ===================================================== */}
      {/* ================= SECURITY SECTION =================== */}
      {/* ===================================================== */}
      <section
        className="
          bg-white border border-gray-200 rounded-2xl shadow-sm 
          p-5 sm:p-6 lg:p-8 
          mb-10
        "
      >
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
          Security & Compliance
        </h3>

        <p className="text-sm sm:text-[15px] text-gray-700 leading-relaxed">
          The JNTU-GV Unified Payments Portal adheres to <strong>bank-grade security standards</strong> and follows compliance
          frameworks mandated by the <strong>Reserve Bank of India (RBI)</strong> and the State Bank of India (SBI).
        </p>

        <ul className="mt-3 space-y-2 text-sm sm:text-[15px] text-gray-700 list-disc ml-6">
          <li>End-to-end encrypted payment flow.</li>
          <li>Fully compliant with RBI Digital Payment Regulations.</li>
          <li>Secure logs and audit trails for every transaction.</li>
          <li>Checksum-based verification for integrity.</li>
          <li>High availability & disaster-recovery support.</li>
        </ul>

        <p className="text-xs text-gray-500 mt-4 italic">
          Your security is our top priority. The University ensures confidentiality, integrity and availability of all transaction data.
        </p>
      </section>


      {/* ===================================================== */}
      {/* ================= PRIVACY SECTION ==================== */}
      {/* ===================================================== */}
      <section
        className="
          bg-gray-50 border border-gray-200 rounded-2xl shadow-sm 
          p-5 sm:p-6 lg:p-8 
          mb-10
        "
      >
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
          Privacy Policy
        </h3>

        <p className="text-sm sm:text-[15px] text-gray-700">
          Your personal data is handled as per the official data governance rules of JNTU-GV.
          The University ensures that:
        </p>

        <ul className="mt-3 space-y-2 text-sm sm:text-[15px] text-gray-700 list-disc ml-6">
          <li>No banking or card details are stored by the University.</li>
          <li>Personal data is used only for validation and receipt generation.</li>
          <li>Data is shared only with SBI for payment processing.</li>
          <li>All sensitive information remains encrypted during transmission.</li>
        </ul>

        <p className="text-xs text-gray-500 mt-4 italic">
          Using this portal confirms your consent to the secure handling of your information.
        </p>
      </section>


      {/* ===================================================== */}
      {/* ================= REFUND SECTION ===================== */}
      {/* ===================================================== */}
      <section
        className="
          bg-white border border-gray-200 rounded-2xl shadow-sm 
          p-5 sm:p-6 lg:p-8 
          mb-10
        "
      >
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
          Refund & Cancellation Policy
        </h3>

        <p className="text-sm sm:text-[15px] text-gray-700">
          Refunds follow the official University regulations and banking settlement rules.
        </p>

        <ul className="mt-3 space-y-2 text-sm sm:text-[15px] text-gray-700 list-disc ml-6">
          <li>Fees once paid are usually non-refundable, unless technical or duplicate transactions occur.</li>
          <li>Refund requests must be submitted to the Finance Section with proof.</li>
          <li>Approved refunds are credited back to the same bank account used for payment.</li>
          <li>Refunds may take 7–14 working days depending on SBI settlement timings.</li>
        </ul>

        <p className="text-xs text-gray-500 mt-4 italic">
          Please verify details before payment. Refunds are strictly governed by University policy.
        </p>
      </section>
    </div>
  );
}

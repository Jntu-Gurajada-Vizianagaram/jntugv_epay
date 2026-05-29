import React, { useState, useRef, useEffect } from "react";
import { Input } from "../../components/Input";
import { initiatePayment } from "../../api/paymentApi";

export function TestSbiEpay() {
  const [form, setForm] = useState({
    merchantId: "1000356",
    encryptionKey: "MBxNMjIUnjl6H6B6XPEuJCppBxt8lwX9F4rH2Jxhglg=",
    operatingMode: "DOM",
    merchantCountry: "IN",
    merchantCurrency: "INR",
    amount: "300",
    student_name: "Test User",
    student_roll: "TEST_ROLL_123",
    email: "test@example.com",
    mobile: "9999999999",
    aggregatorId: "SBIEPAY",
    merchantCustomerId: "5",
    paymode: "NB",
    accessMedium: "ONLINE",
    transactionSource: "ONLINE",
    multiAccountInstructionDtls: "100|INR|GRPT||200|INR|NEFT",
    actionUrl: "https://test.epay.sbiuat.bank.in/secure/AggregatorHostedListener"
  });

  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const formRef = useRef(null);

  // Generate unique order number based on timestamp for each load
  const [merchantOrderNo, setMerchantOrderNo] = useState("");
  useEffect(() => {
    setMerchantOrderNo(Date.now().toString());
  }, []);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // Construct the exact singleRequest string live for developer visibility
  const liveSingleRequest = `${form.merchantId}|${form.operatingMode}|${form.merchantCountry}|${form.merchantCurrency}|${form.amount}|NA|https://test.epay.sbiuat.bank.in/secure/sucess3.jsp|https://test.epay.sbiuat.bank.in/secure/fail3.jsp|${form.aggregatorId}|${merchantOrderNo || "TIMESTAMP"}|${form.merchantCustomerId}|${form.paymode}|${form.accessMedium}|${form.transactionSource}`;

  async function handleGenerate(e) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setPaymentData(null);

    // Validate that the sum of splits matches total amount
    const splits = form.multiAccountInstructionDtls.split('||');
    let sum = 0;
    for (const split of splits) {
      const parts = split.split('|');
      if (parts.length >= 1 && !isNaN(parts[0])) {
        sum += Number(parts[0]);
      }
    }

    if (sum !== Number(form.amount)) {
      setErrorMsg(`Validation Error: The sum of split amounts (${sum}) does not match the Total Amount (${form.amount}). Please adjust the splits.`);
      setLoading(false);
      return;
    }

    try {
      const payload = {
        student_roll: form.student_roll,
        student_name: form.student_name,
        email: form.email,
        mobile: form.mobile,
        amount: Number(form.amount),
        payment_category: "OTHER_FEE",
        payment_type: "SBI_UAT_TEST",
        remarks: "Testing SBI ePay Multi Account",
        merchantId: form.merchantId,
        keyArray: form.encryptionKey,
        operatingMode: form.operatingMode,
        merchantCountry: form.merchantCountry,
        merchantCurrency: form.merchantCurrency,
        aggregatorId: form.aggregatorId,
        merchantCustomerId: form.merchantCustomerId,
        paymode: form.paymode,
        accessMedium: form.accessMedium,
        transactionSource: form.transactionSource,
        multiAccountInstructionDtls: form.multiAccountInstructionDtls,
        successUrl: "https://test.epay.sbiuat.bank.in/secure/sucess3.jsp",
        failUrl: "https://test.epay.sbiuat.bank.in/secure/fail3.jsp",
      };

      const res = await initiatePayment(payload);
      setPaymentData(res);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to initiate payment. Please check your backend connections and keys.");
    } finally {
      setLoading(false);
    }
  }

  function handleRedirect() {
    if (formRef.current) {
      formRef.current.submit();
    }
  }

  return (
    <div className="min-h-screen bg-slate-55/70 py-10 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          {/* nosemgrep: typescript.react.portability.i18next.jsx-not-internationalized.jsx-not-internationalized */}
          <span className="px-3.5 py-1 text-xs font-semibold tracking-wider text-blue-700 bg-blue-50/70 rounded-full border border-blue-200/50 shadow-sm">
            INTEGRATION SANDBOX
          </span>
          <h1 className="mt-4 text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 bg-clip-text text-transparent">
            SBI ePay Multi-Account Gateway Test
          </h1>
          <p className="mt-2.5 text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Configure parameters, construct pipe-delimited payload packets, and securely dispatch transactions to the SBI ePay UAT bank gateway.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Config Form */}
          <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
              Payment Parameters
            </h2>

            <form onSubmit={handleGenerate} className="space-y-6">
              {/* Credentials Group */}
              <div className="bg-slate-50/60 border border-slate-100 p-4.5 rounded-xl space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">1. Merchant Credentials</h3>
                <Input
                  label="Merchant ID"
                  value={form.merchantId}
                  onChange={(e) => updateField("merchantId", e.target.value)}
                  required
                />
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">AES-128 Encryption Key (Base64 / Plain)</label>
                  <input
                    type="text"
                    value={form.encryptionKey}
                    onChange={(e) => updateField("encryptionKey", e.target.value)}
                    required
                    className="w-full bg-white border border-gray-300 rounded-lg text-sm px-3 py-2 text-slate-800 font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Txn Details Group */}
              <div className="bg-slate-50/60 border border-slate-100 p-4.5 rounded-xl space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">2. Transaction Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Amount (INR)"
                    type="number"
                    value={form.amount}
                    onChange={(e) => updateField("amount", e.target.value)}
                    required
                  />
                  <Input
                    label="Merchant Order No (Generated)"
                    value={merchantOrderNo}
                    disabled
                    className="opacity-70 bg-gray-100 cursor-not-allowed text-gray-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Student Name"
                    value={form.student_name}
                    onChange={(e) => updateField("student_name", e.target.value)}
                    required
                  />
                  <Input
                    label="Student Roll Number"
                    value={form.student_roll}
                    onChange={(e) => updateField("student_roll", e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Split Group */}
              <div className="bg-slate-50/60 border border-slate-100 p-4.5 rounded-xl space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">3. Split Settlement Details</h3>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Multi Account Instruction Dtls</label>
                  <input
                    type="text"
                    value={form.multiAccountInstructionDtls}
                    onChange={(e) => updateField("multiAccountInstructionDtls", e.target.value)}
                    required
                    className="w-full bg-white border border-gray-300 rounded-lg text-sm px-3 py-2 text-slate-850 font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                  <span className="text-[10px] text-slate-500 mt-1.5 block">
                    Format: <code>Amt|Curr|AccountHead||Amt|Curr|AccountHead</code> (Sum must equal Total Amount).
                  </span>
                </div>
              </div>

              {/* Action URL Group */}
              <div className="bg-slate-55/60 border border-slate-100 p-4.5 rounded-xl space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">4. Bank Gateway URL</h3>
                <Input
                  label="UAT Hosted Action Endpoint"
                  value={form.actionUrl}
                  onChange={(e) => updateField("actionUrl", e.target.value)}
                  required
                />
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => updateField("actionUrl", "https://test.epay.sbiuat.bank.in/secure/AggregatorHostedListener")}
                    className={`px-3 py-1 text-xs font-medium rounded border transition-colors ${
                      form.actionUrl === "https://test.epay.sbiuat.bank.in/secure/AggregatorHostedListener"
                        ? "bg-blue-50 text-blue-700 border-blue-300"
                        : "bg-white text-slate-650 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Real SBI UAT
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField("actionUrl", "https://localhost:4000/api/mock-bank/payment")}
                    className={`px-3 py-1 text-xs font-medium rounded border transition-colors ${
                      form.actionUrl === "https://localhost:4000/api/mock-bank/payment"
                        ? "bg-blue-50 text-blue-700 border-blue-300"
                        : "bg-white text-slate-650 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Local Mock Bank
                  </button>
                </div>
                {form.actionUrl.includes("sbiuat.bank.in") && (
                  <p className="text-[10.5px] text-amber-700 bg-amber-50 border border-amber-200/50 p-2.5 rounded-lg leading-relaxed mt-2 shadow-sm">
                    ⚠️ <strong>Wrong Source URL Info:</strong> The real SBI UAT Gateway validates the browser's <code>Origin</code>/<code>Referer</code> headers. Dispatching from <code>localhost</code> will cause a <strong>"Wrong Source URL"</strong> failure unless the domain is whitelisted by the bank, or you use a header-spoofing browser extension (e.g. ModHeader) to mock <code>Origin</code> and <code>Referer</code> as the registered merchant URL (e.g., <code>https://pay.jntugv.edu.in</code>). For local testing, use the <strong>Local Mock Bank</strong> preset.
                  </p>
                )}
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs leading-relaxed">
                  ⚠️ {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:to-violet-750 text-white font-semibold rounded-xl transition duration-200 shadow-md shadow-blue-500/10 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? "Encrypting Strings..." : "Generate Encrypted Form Packets"}
              </button>
            </form>
          </div>

          {/* Code Viewer / Form Submission */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Live String Preview */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex-grow flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
                  Live String Builder
                </h2>

                <p className="text-xs font-semibold text-slate-500 mb-1.5">Unencrypted Single Request String:</p>
                <div className="p-3  border border-slate-950 rounded-xl font-mono text-[11px] text-emerald-450 break-all select-all max-h-40 overflow-y-auto mb-4 scrollbar-thin shadow-inner">
                  {liveSingleRequest}
                </div>

                <p className="text-xs font-semibold text-slate-500 mb-1.5">Unencrypted Split Settlement String:</p>
                <div className="p-3  border border-slate-950 rounded-xl font-mono text-[11px] text-emerald-450 break-all select-all shadow-inner">
                  {form.multiAccountInstructionDtls}
                </div>
              </div>

              <div className="text-[11px] text-slate-500 leading-relaxed mt-6 bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
                💡 <strong>How it works:</strong> The backend formats and encrypts these pipe-separated strings using `aes-128-cbc` before packaging the request into a secure form post.
              </div>
            </div>

            {/* Generated Encrypted Packet */}
            {paymentData && (
              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-6 shadow-md animate-fadeIn transition-all duration-350">
                <h2 className="text-lg font-bold text-emerald-800 mb-4 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  Encrypted Packets Generated
                </h2>

                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Encrypted Transaction (EncryptTrans)</span>
                    <div className="p-2.5  border border-slate-950 rounded-lg font-mono text-[10px] text-emerald-400 break-all max-h-24 overflow-y-auto select-all shadow-inner">
                      {paymentData.fields.EncryptTrans}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Encrypted Splits (MultiAccountInstructionDtls)</span>
                    <div className="p-2.5  border border-slate-950 rounded-lg font-mono text-[10px] text-emerald-400 break-all select-all shadow-inner">
                      {paymentData.fields.MultiAccountInstructionDtls}
                    </div>
                  </div>

                  <form
                    ref={formRef}
                    method="POST"
                    action={form.actionUrl}
                    target="_blank"
                    className="mt-6 pt-4 border-t border-emerald-100"
                  >
                    <input type="hidden" name="EncryptTrans" value={paymentData.fields.EncryptTrans} />
                    <input type="hidden" name="merchIdVal" value={form.merchantId} />
                    <input type="hidden" name="MultiAccountInstructionDtls" value={paymentData.fields.MultiAccountInstructionDtls} />

                    <button
                      type="button"
                      onClick={handleRedirect}
                      className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl transition duration-200 shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      🚀 Dispatch to SBI UAT Gateway
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

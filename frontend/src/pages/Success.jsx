import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { decryptPaymentData, getPaymentStatus } from "../api/paymentApi";

function parseGatewayResponse(value) {
  if (!value || typeof value !== "string") return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function formatMoney(value) {
  if (value === undefined || value === null || value === "" || value === "N/A") return "N/A";
  const amount = Number(value);
  if (Number.isNaN(amount)) return `INR ${value}`;
  return `INR ${amount.toFixed(2)}`;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "N/A";
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

export function Success() {
  const [searchParams] = useSearchParams();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDetails() {
      const encryptedData = searchParams.get("data");
      let txId = null;
      let initialData = {
        status: "SUCCESS",
        amount: "N/A"
      };

      if (encryptedData) {
        try {
          const decrypted = await decryptPaymentData(encryptedData);
          txId = decrypted.merchantTxnId || "N/A";
          initialData = { ...initialData, ...decrypted };
        } catch (err) {
          console.error("Failed to decrypt", err);
        }
      } else {
        txId = searchParams.get("merchantTxnId");
        initialData = {
          ...initialData,
          merchantTxnId: txId,
          status: searchParams.get("status") || "SUCCESS",
          amount: searchParams.get("amount") || "N/A"
        };
      }

      if (txId && txId !== "N/A") {
        try {
          const fullData = await getPaymentStatus(txId);
          if (fullData) {
            if ((fullData.status === "INITIATED" || fullData.status === "PENDING") && initialData.status === "SUCCESS") {
              fullData.status = "SUCCESS";
            }
            setDetails({ ...initialData, ...fullData });
          } else {
            setDetails({ ...initialData, merchantTxnId: txId });
          }
        } catch {
          setDetails({ ...initialData, merchantTxnId: txId });
        }
      } else {
        setDetails({ merchantTxnId: "UNKNOWN", status: "UNKNOWN", amount: "-" });
      }

      setLoading(false);
    }

    fetchDetails();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-2xl shadow-lg text-center">
        <p className="text-gray-500">Retrieving full transaction details...</p>
      </div>
    );
  }

  const gatewayResponse = parseGatewayResponse(details?.gateway_response);
  const gatewayDetails = details?.gateway_response_details || {};
  const txId = details?.merchantTxnId || "N/A";
  const amount = details?.amount || "N/A";
  const status = details?.status || "SUCCESS";
  const paymentId = details?.paymentId || gatewayDetails.paymentId || details?.transaction_id || "N/A";
  const transactionNumber = details?.transactionNumber || gatewayDetails.transactionNumber || details?.merchantTxnId || txId;
  const bankTxnId = details?.bankTxnId || details?.bankReferenceNumber || gatewayDetails.bankReferenceNumber || gatewayResponse.bankReferenceNumber || "N/A";
  const atrn = details?.atrn || details?.sbiePayRefId || gatewayDetails.atrn || gatewayResponse.atrn;
  const serviceChargePaid = details?.serviceChargePaid || gatewayDetails.serviceChargePaid || gatewayResponse.serviceChargePaid || "0.00";
  const gstPaid = details?.gstPaid || gatewayDetails.gstPaid || gatewayResponse.gstPaid || "0.00";
  const totalChargesPaid = details?.totalChargesPaid || gatewayDetails.totalChargesPaid || gatewayResponse.totalChargesPaid;

  const studentName = details?.student_name || details?.college_name;
  const rollNumber = details?.student_roll || details?.college_code;
  const paymentCategory = details?.payment_category || "";
  const paymentType = details?.payment_type || "";
  const paymentDate = details?.transactionDate || gatewayResponse.transactionDate || details?.updatedAt || details?.createdAt || new Date().toISOString();

  const extraFields = [
    { label: "Student / College Name", value: studentName },
    { label: "Roll / Reg. No", value: rollNumber },
    { label: "Father's Name", value: details?.father_name },
    { label: "Email Address", value: details?.email },
    { label: "Mobile Number", value: details?.mobile },
    { label: "Course / Program", value: details?.course },
    { label: "Branch / Dept", value: details?.department || details?.branch_name || details?.branch },
    { label: "Study Status", value: details?.study_status },
    { label: "Year & Semester", value: [details?.year, details?.semester].filter(Boolean).join(" - ") },
    { label: "Exam Type", value: details?.exam_type },
    { label: "Certificate Type", value: details?.certificate_type },
    { label: "Approval Ref", value: details?.approval_letter_ref },
    { label: "Specific Category", value: details?.fee_type || details?.affiliation_type || details?.category },
    { label: "Gender", value: details?.gender },
    { label: "Aadhar", value: details?.aadhar },
    { label: "Payment Category", value: paymentCategory?.replace(/_/g, " ") },
    { label: "Fee Sub-Type", value: paymentType?.replace(/_/g, " ") },
    { label: "Pay Mode", value: details?.payMode || details?.payment_mode || gatewayResponse.payMode },
    { label: "SBI ATRN / Payment Ref", value: atrn },
    { label: "Bank Code", value: details?.bankCode || gatewayResponse.bankCode },
    { label: "Status Description", value: details?.statusDescription || gatewayResponse.statusDescription },
    { label: "SBI Response Code", value: details?.responseCode || gatewayResponse.responseCode }
  ].filter((field) => field.value && field.value !== "N/A" && String(field.value).trim() !== "");

  return (
    <div className="receipt-print-root max-w-3xl mx-auto mt-10 p-4 sm:p-8 bg-white rounded-2xl shadow-lg print:shadow-none print:mt-0 print:p-0">
      <div className="text-center print:hidden">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Payment Successful</h2>
        <p className="text-gray-500 mt-2 mb-6">Your transaction details are saved below.</p>
      </div>

      <div className="receipt-print-card border border-gray-200 rounded-xl p-6 print:border-none print:p-0">
        <div className="hidden print:block border-b-2 border-gray-300 pb-4 mb-6">
          <div className="receipt-print-app-name">JNTU-GV e-Payment Portal</div>
          <div className="receipt-print-letterhead">
            <img src="/jntugv-logo.png" alt="JNTU-GV Logo" className="receipt-print-top-logo" />
            <h1 className="text-2xl font-bold uppercase text-gray-900">Jawaharlal Nehru Technological University - Gurajada Vizianagaram</h1>
          </div>
          <h2 className="text-lg font-semibold text-gray-700 mt-1">Official E-Payment Receipt</h2>
        </div>

        <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4 print:hidden">Transaction Receipt</h3>

        <div className="receipt-print-grid grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm sm:text-base">
          <ReceiptField label="Payment ID" value={paymentId} mono />
          <ReceiptField label="Transaction Number" value={transactionNumber} mono />
          <ReceiptField label="Bank Reference No" value={bankTxnId === "N/A" ? "-" : bankTxnId} mono />
          <ReceiptField label="Transaction Date & Time" value={formatDate(paymentDate)} />
          <ReceiptField label="Amount Paid" value={formatMoney(amount)} strong />
          <ReceiptField label="Service Charges Paid" value={formatMoney(serviceChargePaid)} />
          <ReceiptField label="GST Paid" value={formatMoney(gstPaid)} />
          {totalChargesPaid && <ReceiptField label="Total Bank Charges" value={formatMoney(totalChargesPaid)} />}
          <ReceiptField label="Status" value={status} badge="success" />

          <div className="col-span-1 md:col-span-2 my-2 border-t border-gray-100 print:border-gray-300"></div>

          {extraFields.map((field) => (
            <ReceiptField key={field.label} label={field.label} value={field.value} />
          ))}
        </div>

        <div className="hidden print:block mt-12 text-sm text-gray-500">
          <div className="receipt-print-footer-brand">
            <img src="/jntugv-logo.png" alt="JNTU-GV Logo" className="receipt-print-footer-logo" />
            <img src="/sbi-logo.svg" alt="SBI Logo" className="receipt-print-sbi-logo" />
          </div>
          <div className="text-center">
            <p>This is a computer-generated receipt and does not require a physical signature.</p>
            <p>Please keep this receipt for future reference.</p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4 print:hidden">
        <button
          onClick={() => window.print()}
          className="px-6 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
          </svg>
          Print / Save PDF
        </button>
        <Link to="/" className="px-6 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition text-center">
          Return Home
        </Link>
      </div>
    </div>
  );
}

function ReceiptField({ label, value, mono = false, strong = false, badge }) {
  const badgeClass = badge === "success"
    ? "inline-block px-3 py-1 rounded bg-green-100 text-green-800 font-semibold border border-green-200 uppercase"
    : "";

  return (
    <div>
      <span className="block text-gray-500 text-xs uppercase tracking-wider">{label}</span>
      <span className={`${badgeClass || "font-medium text-gray-900"} ${mono ? "font-mono" : ""} ${strong ? "font-bold text-lg" : ""}`}>
        {value || "-"}
      </span>
    </div>
  );
}

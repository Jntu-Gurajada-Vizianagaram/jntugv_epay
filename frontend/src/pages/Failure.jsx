import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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

export function Failure() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDetails() {
      const encryptedData = searchParams.get("data");
      let parsedDetails = {};
      let txId = null;

      if (encryptedData) {
        try {
          const decrypted = await decryptPaymentData(encryptedData);
          txId = decrypted.merchantTxnId || decrypted.OrderNo || decrypted.orderNo || "N/A";
          parsedDetails = {
            txId,
            merchantTxnId: txId,
            amount: decrypted.amount || "N/A",
            status: decrypted.status || "FAILED",
            ...decrypted
          };
        } catch (err) {
          console.error("Failed to decrypt", err);
          parsedDetails = {
            txId: "Error loading details",
            amount: "-",
            status: "UNKNOWN"
          };
        }
      } else {
        txId = searchParams.get("merchantTxnId") || searchParams.get("OrderNo") || searchParams.get("orderNo") || "N/A";
        parsedDetails = {
          txId,
          merchantTxnId: txId,
          amount: searchParams.get("amount") || searchParams.get("TotalAmount") || "N/A",
          status: searchParams.get("status") || "FAILED"
        };
      }

      if (txId && txId !== "N/A" && txId !== "Error loading details") {
        try {
          const fullData = await getPaymentStatus(txId);
          setDetails(fullData ? { ...parsedDetails, ...fullData, txId } : parsedDetails);
        } catch {
          setDetails(parsedDetails);
        }
      } else {
        setDetails(parsedDetails);
      }

      setLoading(false);
    }

    fetchDetails();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-2xl shadow-lg text-center">
        <p className="text-gray-500">Retrieving transaction details...</p>
      </div>
    );
  }

  const gatewayResponse = parseGatewayResponse(details?.gateway_response);
  const gatewayDetails = details?.gateway_response_details || {};
  const txId = details?.txId || details?.merchantTxnId || "N/A";
  const amount = details?.amount || "N/A";
  const status = details?.status || "FAILED";
  const statusUpper = String(status).toUpperCase();
  const paymentId = details?.paymentId || gatewayDetails.paymentId || details?.transaction_id || "N/A";
  const transactionNumber = details?.transactionNumber || gatewayDetails.transactionNumber || details?.merchantTxnId || txId;
  const bankReferenceNumber = details?.bankReferenceNumber || details?.bankTxnId || gatewayDetails.bankReferenceNumber || gatewayResponse.bankReferenceNumber;
  const atrn = details?.atrn || details?.sbiePayRefId || gatewayDetails.atrn || gatewayResponse.atrn;
  const serviceChargePaid = details?.serviceChargePaid || gatewayDetails.serviceChargePaid || gatewayResponse.serviceChargePaid || "0.00";
  const gstPaid = details?.gstPaid || gatewayDetails.gstPaid || gatewayResponse.gstPaid || "0.00";
  const totalChargesPaid = details?.totalChargesPaid || gatewayDetails.totalChargesPaid || gatewayResponse.totalChargesPaid;
  const paymentDate = details?.transactionDate || gatewayResponse.transactionDate || details?.updatedAt || details?.createdAt;

  const transactionRows = [
    ["Payment ID", paymentId],
    ["Transaction Number", transactionNumber],
    ["Bank Reference No", bankReferenceNumber],
    ["SBI ATRN / Payment Ref", atrn],
    ["Status", status],
    ["Status Description", details?.statusDescription || gatewayDetails.statusDescription || gatewayResponse.statusDescription],
    ["Amount", formatMoney(amount)],
    ["Service Charges Paid", formatMoney(serviceChargePaid)],
    ["GST Paid", formatMoney(gstPaid)],
    totalChargesPaid ? ["Total Bank Charges", formatMoney(totalChargesPaid)] : null,
    ["Pay Mode", details?.payMode || details?.payment_mode || gatewayDetails.payMode || gatewayResponse.payMode],
    ["Bank Code", details?.bankCode || gatewayDetails.bankCode || gatewayResponse.bankCode],
    ["Transaction Date", formatDate(paymentDate)],
    ["SBI Response Code", details?.responseCode || gatewayDetails.responseCode || gatewayResponse.responseCode],
    ["Student / College Name", details?.student_name || details?.college_name || details?.customerName],
    ["Roll / Reg. No", details?.student_roll || details?.college_code],
    ["Payment Category", details?.payment_category?.replace(/_/g, " ")],
    ["Fee Sub-Type", details?.payment_type?.replace(/_/g, " ")]
  ].filter((row) => row && row[1] && row[1] !== "N/A" && String(row[1]).trim() !== "");

  return (
    <div className="receipt-print-root max-w-3xl mx-auto mt-10 p-4 sm:p-8 bg-white rounded-2xl shadow-lg border border-red-200 print:shadow-none print:border-none">
      <div className="text-center print:hidden">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Payment Failed</h2>
        <p className="text-gray-500 mt-2">
          {statusUpper === "ABORT" || statusUpper === "ABORTED"
            ? "The transaction was declined or cancelled by the user."
            : "The transaction failed or was declined."}
        </p>
        <p className="text-sm font-medium text-red-700 bg-red-50 p-3 rounded-lg mt-4 border border-red-100">
          If your account was debited, the amount will be refunded to your original payment method as per your bank's rules.
        </p>
      </div>

      <div className="receipt-print-card mt-6 border border-gray-200 rounded-xl p-6 print:border-none print:p-0">
        <div className="hidden print:block border-b-2 border-gray-300 pb-4 mb-6">
          <div className="receipt-print-app-name">JNTU-GV e-Payment Portal</div>
          <div className="receipt-print-letterhead">
            <img src="/jntugv-logo.png" alt="JNTU-GV Logo" className="receipt-print-top-logo" />
            <h1 className="text-2xl font-bold uppercase text-gray-900">Jawaharlal Nehru Technological University - Gurajada Vizianagaram</h1>
          </div>
          <h2 className="text-lg font-semibold text-gray-700 mt-1">Failed E-Payment Response</h2>
        </div>

        <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4 print:hidden">Transaction Response</h3>
        <div className="receipt-print-grid grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm sm:text-base">
          {transactionRows.map(([label, value]) => (
            <div key={label}>
              <span className="block text-gray-500 text-xs uppercase tracking-wider">{label}</span>
              <span className={`font-medium ${label === "Status" ? "text-red-600 uppercase font-bold" : "text-gray-900"} ${label.includes("Number") || label.includes("Reference") || label === "Payment ID" ? "font-mono" : ""}`}>
                {value}
              </span>
            </div>
          ))}
        </div>

        <div className="hidden print:block mt-12 text-sm text-gray-500">
          <div className="receipt-print-footer-brand">
            <img src="/jntugv-logo.png" alt="JNTU-GV Logo" className="receipt-print-footer-logo" />
            <img src="/sbi-logo.svg" alt="SBI Logo" className="receipt-print-sbi-logo" />
          </div>
          <div className="text-center">
            <p>This is a computer-generated response and does not require a physical signature.</p>
            <p>Please keep this response for future reference.</p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3 print:hidden">
        <button
          onClick={() => window.print()}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Print / Save PDF
        </button>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

import React, { useState, useRef, useEffect } from "react";
import { Input } from "../../components/Input";
import { initiatePayment } from "../../api/paymentApi";

export function TestMultiAccountPayment() {
  const [form, setForm] = useState({
    name: "Test User",
    mobile: "9999999999",
    email: "test@example.com",
    amount: "300",
    multiAccountInstructionDtls: "100|INR|GRPT||200|INR|GRPT",
  });



  /*
  const merchantId = "1000356";
const aggregatorId = "SBIEPAY";
const keyArray = "MBxNMjIUnjl6H6B6XPEuJCppBxt8lwX9F4rH2Jxhglg=";
const returnUrl = "Merchant_URL";

const successUrl = returnUrl + "succsesUrl";
const failUrl = returnUrl + "CancelUrl";

const securityAmount = Amt;
const dueAmount = TotalDueAmount.toString();

const operatingMode = "DOM";
const merchantCountry = "IN";
const merchantCurrency = "INR";
const userToken = Tokenid;
const merchantOrderNo = txnno;
const payType = "S";
const account1 = dueAmount;
const merchantCustomerId = "2";
const paymode = "NB";
const accessMedium = "ONLINE";
const transactionSource = "ONLINE";

const ecd = new Date().toISOString().slice(0, 19) + ".000";
const expiryDate = new Date().toISOString().slice(0, 10) + "T23:59";

const singleRequest = `${merchantId}|${operatingMode}|${merchantCountry}|${merchantCurrency}|${TotalDueAmount}|${Otherdetail}|${successUrl}|${failUrl}|${aggregatorId}|${merchantOrderNo}|${merchantCustomerId}|${paymode}|${accessMedium}|${transactionSource}`;

const multiAccountInstructionDetails = "1|INR|AAT||25|INR|NEFT";

const singleParamResponse = aes.encrypt(singleRequest, keyArray);

ObjMulReq._single_Paramresponce = singleParamResponse;

return ObjMulReq;
*/


  const [paymentData, setPaymentData] = useState(null);
  const formRef = useRef(null);

  useEffect(() => {
    if (paymentData) {
      if (paymentData.method === "GET") {
        window.location.href = paymentData.action;
      } else if (formRef.current) {
        formRef.current.submit();
      }
    }
  }, [paymentData]);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(e) {
    e.preventDefault();

    // Validate that the sum of the splits matches the total amount
    const splitString = form.multiAccountInstructionDtls.replace(/{AMOUNT}/g, form.amount);
    const splits = splitString.split('||');
    let sum = 0;
    for (const split of splits) {
      const parts = split.split('|');
      if (parts.length >= 1 && !isNaN(parts[0])) {
        sum += Number(parts[0]);
      }
    }

    if (sum !== Number(form.amount)) {
      alert(`Validation Error: The sum of your split amounts (${sum}) does not match the Total Amount (${form.amount}). The bank will reject this packet.`);
      return;
    }

    const payload = {
      merchantOrderNo: "12345",
      merchantId: "1000356",
      student_roll: "TEST_ROLL_123",
      student_name: form.name,
      mobile: form.mobile,
      email: form.email,
      amount: Number(form.amount),
      payment_category: "OTHER_FEE",
      payment_type: "MULTI_ACCOUNT_TEST",
      remarks: "Testing Multi Account Feature",
      aggregatorId: "SBIEPAY",
      keyArray: "MBxNMjIUnjl6H6B6XPEuJCppBxt8lwX9F4rH2Jxhglg=",
      payMode: "NB",
      operatingMode: "DOM",
      merchantCountry: "IN",
      merchantCurrency: "INR",
      payType: "S",
      accessMedium: "ONLINE",
      transactionSource: "ONLINE",
      multiAccountInstructionDtls: splitString,
    };

    const res = await initiatePayment(payload);
    setPaymentData(res);
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-purple-700">Multi-Account Payment Test Page</h2>
      <p className="text-gray-600 mb-6 text-sm">
        Use this page to test the dynamic multi-account splits. This submits the payload to the official
        SBI ePay Aggregator Hosted Listener format using your real Testkit keys.
      </p>

      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Full Name"
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          required
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Mobile Number"
            value={form.mobile}
            maxLength={10}
            onChange={(e) => updateField("mobile", e.target.value)}
            required
          />
          <Input
            label="Email Address"
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            required
          />
        </div>
        <Input
          label="Total Amount (INR)"
          type="number"
          value={form.amount}
          onChange={(e) => updateField("amount", e.target.value)}
          required
        />
        <div>
          <label className="text-sm font-medium">Multi-Account Split Instructions (DYNAMIC)</label>
          <input
            type="text"
            className="w-full mt-1 p-2 border rounded font-mono text-sm"
            value={form.multiAccountInstructionDtls}
            onChange={(e) => updateField("multiAccountInstructionDtls", e.target.value)}
            placeholder="e.g. 100|INR|GRPT||200|INR|NEFT"
          />
          <p className="text-xs text-gray-500 mt-1">
            Format: <code>Amount|Currency|AccountHead||Amount|Currency|AccountHead</code>
          </p>
        </div>

        <button type="submit" className="primary w-full py-2 rounded bg-purple-600 text-white font-semibold hover:bg-purple-700">
          Initiate Split Payment
        </button>
      </form>

      {paymentData && (
        <form
          ref={formRef}
          method={paymentData.method || "POST"}
          action={paymentData.action}
          style={{ display: "none" }}
        >
          {Object.entries(paymentData.fields).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
        </form>
      )}
    </div>
  );
}

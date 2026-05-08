require("dotenv").config();
const paymentService = require("./src/services/paymentService");

async function test() {
  const data = {
    student_roll: "TEST01",
    student_name: "Test Student",
    amount: 100,
    payment_category: "OTHER",
    multiAccountInstructionDtls: "100|INR|NEFT"
  };
  try {
    const res = await paymentService.initiate(data);
    console.log(JSON.stringify(res, null, 2));
  } catch (err) {
    console.error(err);
  }
}
test();

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:4000/api/payment';

async function testInitiate(amount, multiAccountInstructionDtls, name) {
    const params = {
        student_roll: "TEST001",
        student_name: name,
        amount: amount,   
        payment_category: "OTHER_FEE",
        payment_type: "TEST_MULTI",
        email: "test@example.com",
        mobile: "9999999999",
        multiAccountInstructionDtls: multiAccountInstructionDtls
    };

    try {
        console.log("------------------------------------------");
        console.log(`Testing with amount ${amount} and split ${multiAccountInstructionDtls}`);
        
        const response = await axios.post(`${BASE_URL}/initiate`, params);

        console.log("✅ Success! Response Received:");
        console.log(response.data);
    } catch (error) {
        console.error("❌ Error:");
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("Connection Error:", error.message);
        }
    }
}

async function run() {
    // 1. Correct sums
    await testInitiate(300, "100|INR|GRPT||200|INR|NEFT", "Correct Sum");
    
    // 2. Incorrect sums
    await testInitiate(300, "150|INR|GRPT||200|INR|NEFT", "Incorrect Sum");

    // 3. With {AMOUNT} macro (sum correct)
    await testInitiate(500, "{AMOUNT}|INR|GRPT", "Correct Sum Macro");
}

run();

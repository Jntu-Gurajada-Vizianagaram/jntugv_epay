require('dotenv').config({ path: 'e:/jntugv-pay/backend/.env' });
const { SBIEPayClient } = require("epay_nodejs_sdk");

const encryptedFinalResponse = "zUOw20k4Opdm4zfbhsaFTZMypCgMp9xu2oJWrJyhgqXN32Lhf6J97OCtfC+dt7gDyDiuAtrtyTiRVp5YWVfAOcd1V4RH89asVrRY3k49WPALqPwnEHY3853iVL2XeYZCxQcDeqkIsyp7UzNLiGFHgs3ammUjMoQVpnB3jNURswrFrfwXYMZSiY8qek83/vMPLWabflQq6rbdwk9Ny+xvAg==";

async function testSDKDecode() {
    try {
        const sbiePayClient = new SBIEPayClient({
            apiKey: process.env.SBI_MERCHANT_ID,
            apiSecret: process.env.SBI_MERCHANT_KEY,
            encryptionKey: process.env.SBI_ENCRYPTION_KEY_BASE64
        }, 'SANDBOX', true);

        const decoded = await sbiePayClient.crypto.decodeCallback(encryptedFinalResponse);
        console.log("Decoded via decodeCallback:", decoded);
    } catch (e) {
        console.error("Failed to decode final response via SDK:", e);
    }
}

testSDKDecode();

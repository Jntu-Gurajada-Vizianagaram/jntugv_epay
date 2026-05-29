'use strict';
const crypto = require('crypto');

// Configuration parameters with updated Merchant ID and Key
var MerchantId = '1000356';
var Array_key = "MBxNMjIUnjl6H6B6XPEuJCppBxt8lwX9F4rH2Jxhglg=";
var OperatingMode = 'DOM';
var MerchantCountry = 'IN';
var MerchantCurrency = 'INR';
var TotalDueAmount = '300';
var OtherDetails = 'NA';
var SuccessURL = 'https://test.sbiepay.sbi/secure/sucess3.jsp';
var FailURL = 'https://test.sbiepay.sbi/secure/fail3.jsp';
var AggregatorId = 'SBIEPAY';
var MerchantCustomerID = '5';
var Paymode = 'NB';
var Accesmedium = 'ONLINE';
var TransactionSource = 'ONLINE';
var MerchantOrderNo = Date.now().toString(); // Generate unique order number based on timestamp

// Multi Account Details
var MultiAccountInstructionDtls = "100|INR|GRPT||200|INR|NEFT";

// Encryption and decryption functions
function encrypt(input, key) {
  const iv = key.slice(0, 16);
  const cipher = crypto.createCipheriv("aes-128-cbc", key.slice(0, 16), iv);
  let encrypted = cipher.update(input, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
}

function decrypt(cipherText, key) {
  const iv = key.slice(0, 16);
  const decipher = crypto.createDecipheriv("aes-128-cbc", key.slice(0, 16), iv);
  let decryptedData = decipher.update(cipherText, 'base64', 'utf8');
  decryptedData += decipher.final('utf8');
  return decryptedData;
}

// Create the SBI ePay request with Multi Account Details
function generateSbiEpayRequest() {
  try {
    // Creating the request string with Multi Account Details
    var Single_Request = MerchantId + "|" + OperatingMode + "|" + MerchantCountry + "|" + MerchantCurrency + "|" +
                        TotalDueAmount + "|" + OtherDetails + "|" + SuccessURL + "|" + FailURL + "|" +
                        AggregatorId + "|" + MerchantOrderNo + "|" + MerchantCustomerID + "|" +
                        Paymode + "|" + Accesmedium + "|" + TransactionSource;
   
    console.log('Main Request String:--------------\n' + Single_Request);
   
    // Encrypt the main request
    var value = encrypt(Single_Request, Array_key);
    var Single_Paramresponce = value;
    console.log('ENCRYPTED MAIN REQUEST VALUE: \n' + Single_Paramresponce);
   
    // Encrypt the Multi Account Instructions
    console.log('Multi Account Instruction Details:--------------\n' + MultiAccountInstructionDtls);
    var encryptedMultiAccount = encrypt(MultiAccountInstructionDtls, Array_key);
    console.log('ENCRYPTED MULTI ACCOUNT VALUE: \n' + encryptedMultiAccount);

    // Use the simple form and add the Multi Account field with encrypted value
    console.log('\nHTML Form that would be sent to the browser:\n');
    const htmlForm = `<form name="ecom" method="post" action="https://test.sbiepay.sbi/secure/AggregatorHostedListener">
<input type="text" name="EncryptTrans" value="${Single_Paramresponce}">
<input type="text" name="merchIdVal" value="${MerchantId}"/>
<input type="text" name="MultiAccountInstructionDtls" value="${encryptedMultiAccount}">
<input type="submit" name="submit" value="Submit">
</form>`;
    console.log(htmlForm);
   
   
    // Verify decryption works
    console.log('\nDEMONSTRATING DECRYPTION (verification):\n');
    var decrypted = decrypt(Single_Paramresponce, Array_key);
    console.log('DECRYPTED MAIN REQUEST VALUE: \n' + decrypted);
    console.log('Main Request verification result: ' + (decrypted === Single_Request ? 'SUCCESS ✓' : 'FAILURE ✗'));
   
    var decryptedMultiAccount = decrypt(encryptedMultiAccount, Array_key);
    console.log('\nDECRYPTED MULTI ACCOUNT VALUE: \n' + decryptedMultiAccount);
    console.log('Multi Account verification result: ' + (decryptedMultiAccount === MultiAccountInstructionDtls ? 'SUCCESS ✓' : 'FAILURE ✗'));
   
    // Generate a file save command for the HTML form
    console.log('\nTo save this HTML form to a file, run:');
    console.log('node -e "require(\'fs\').writeFileSync(\'sbi-epay-form.html\', `' + htmlForm.replace(/`/g, '\\`') + '`);"');
   
  } catch (error) {
    console.error('ERROR: ', error.message);
  }
}

// Run the demo
generateSbiEpayRequest();

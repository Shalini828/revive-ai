import crypto from "crypto";

const secret = "test_webhook_secret";

const body = JSON.stringify({
  event: "payment.captured",
  payload: {
    payment: {
      entity: {
        id: "pay_test_003",
        amount: 300000,
        currency: "INR",
        notes: {
          userId: "14"
        }
      }
    }
  }
});

const signature = crypto
  .createHmac("sha256", secret)
  .update(body)
  .digest("hex");

console.log("Generated signature:");
console.log(signature);

const response = await fetch(
  "http://localhost:5000/api/razorpay/webhook",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-razorpay-signature": signature
    },
    body
  }
);

console.log("\nResponse:");
console.log(await response.text());
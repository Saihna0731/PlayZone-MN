import requests

url = "https://my-map-app-production.up.railway.app/api/payment/monpay-verify"

headers = {
    "Content-Type": "application/json",
    "X-API-Key": "c2a876593df9390ee9dc772a40b8f490c8d6aa25e2d74d8ef64aec385cec440d"
}

body = {
    "paymentCode": "PZ-ABC123",
    "notificationText": "Таны 99107463441 дансанд 1990 төгрөгийн орлого хийгдлээ.",
    "amount": 1990
}

response = requests.post(url, json=body, headers=headers)

print("Status:", response.status_code)
print("Response:", response.json())
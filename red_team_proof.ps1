$baseUrl = "http://localhost:3000"

Write-Output "--- Test 1: Unauthenticated Admin List ---"
$resp1 = curl.exe -s -o /dev/null -w "%{http_code}" "$baseUrl/api/admin/list"
Write-Output "Endpoint: /api/admin/list (Incognito)"
Write-Output "Status: $resp1"

Write-Output "`n--- Test 2: Payload Size Guard ---"
$largeData = "A" * 6000
$resp2 = curl.exe -s -o /dev/null -w "%{http_code}" -X POST "$baseUrl/api/submit" -H "Content-Type: application/json" -H "Content-Length: 6000" -d "$largeData"
Write-Output "Endpoint: /api/submit (Large Payload)"
Write-Output "Status: $resp2"

Write-Output "`n--- Test 3: Rate Limiting (Attempt 1-6) ---"
for ($i=1; $i -le 6; $i++) {
    $r = curl.exe -s -o /dev/null -w "%{http_code}" -X POST "$baseUrl/api/auth/login" -H "Content-Type: application/json" -d "{`"email`":`"test@example.com`",`"password`":`"wrong`"}"
    Write-Output "Attempt $i: $r"
}

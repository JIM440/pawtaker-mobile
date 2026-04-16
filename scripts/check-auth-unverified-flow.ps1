$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot

function Assert-Contains {
  param(
    [string]$Path,
    [string]$Pattern,
    [string]$Message
  )

  $content = Get-Content -Raw -LiteralPath $Path
  if ($content -notmatch $Pattern) {
    throw "FAILED: $Message`nPath: $Path`nPattern: $Pattern"
  }
}

$loginPath = Join-Path $root "app\(auth)\login.tsx"
$verifyPath = Join-Path $root "app\(auth)\signup\verify.tsx"
$storePath = Join-Path $root "src\lib\store\signup.store.ts"
$enPath = Join-Path $root "src\lib\i18n\locales\en.json"
$frPath = Join-Path $root "src\lib\i18n\locales\fr.json"

Assert-Contains -Path $storePath -Pattern "setSignupEmail" -Message "Signup store should expose setSignupEmail."
Assert-Contains -Path $loginPath -Pattern "isUnverifiedEmailError" -Message "Login screen should detect unverified-email auth errors."
Assert-Contains -Path $loginPath -Pattern 'pathname:\s*"/\(auth\)/signup/verify"' -Message "Login screen should route users back to signup verification."
Assert-Contains -Path $loginPath -Pattern 'params:\s*\{\s*email:\s*nextEmail\s*\}' -Message "Login screen should pass the email into the verification route."
Assert-Contains -Path $loginPath -Pattern 'auth\.login\.emailNotVerified' -Message "Login screen should show a dedicated unverified-email message."
Assert-Contains -Path $loginPath -Pattern 'auth\.login\.resumeVerification' -Message "Login screen should render a resume verification CTA."
Assert-Contains -Path $verifyPath -Pattern "useLocalSearchParams" -Message "Signup verify screen should accept route params."
Assert-Contains -Path $verifyPath -Pattern "const activeEmail = routeEmail \|\| email" -Message "Signup verify screen should resolve email from route or store."
Assert-Contains -Path $verifyPath -Pattern "email:\s*activeEmail" -Message "Signup verify screen should use the resolved email for verify/resend."
Assert-Contains -Path $verifyPath -Pattern "auth\.signup\.verify\.missingEmail" -Message "Signup verify screen should guard against missing email context."
Assert-Contains -Path $enPath -Pattern '"emailNotVerified"' -Message "English locale should include the unverified-email copy."
Assert-Contains -Path $enPath -Pattern '"resumeVerification"' -Message "English locale should include the resume verification CTA."
Assert-Contains -Path $enPath -Pattern '"missingEmail"' -Message "English locale should include the missing-email fallback copy."
Assert-Contains -Path $frPath -Pattern '"emailNotVerified"' -Message "French locale should include the unverified-email copy."
Assert-Contains -Path $frPath -Pattern '"resumeVerification"' -Message "French locale should include the resume verification CTA."
Assert-Contains -Path $frPath -Pattern '"missingEmail"' -Message "French locale should include the missing-email fallback copy."

Write-Host "Auth unverified-email flow smoke test passed."

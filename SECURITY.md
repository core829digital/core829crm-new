# Security Posture — Core829 CRM

## Implemented Controls

### Authentication
- Password-based auth with SHA-256 + per-user random salt (16 bytes)
- 3-hour session expiry with 30-second interval check
- Rate limiting: max 5 failed login attempts per 15-minute window per userId
- Failed login attempts logged to `loginAttempts` table for audit

### Transport Security
- All traffic via HTTPS (Convex-managed)
- Security headers configured in `next.config.ts`:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`

### Data Protection
- Passwords: SHA-256 + salt (see Known Gaps)
- Convex storage provides encrypted-at-rest storage
- Signed URLs with expiration for file access (Convex-managed)

### Audit Logging
- `activityLogs` table records user actions (create, update, delete)
- `loginAttempts` table records every login attempt (success/failure)
- All logs timestamped with ISO 8601

### Input Validation
- All Convex mutations use typed validators (`v.string()`, `v.number()`, etc.)
- No raw SQL — Convex uses parameterized queries internally

### Vulnerability Management
- 0 known CVEs across 490 dependencies (last scan: 2026-07-23)
- Automated SAST scan: 0 findings (no hardcoded secrets, SQLi, XSS in app code)

## Known Gaps (Not Yet Implemented)

### HIGH Priority
| Gap | Risk | Mitigation Plan |
|-----|------|----------------|
| No MFA / 2FA | Credential theft | Implement TOTP via authenticator app |
| SHA-256 for passwords (not bcrypt/argon2) | Fast-hash brute force | Migrate to hash-wasm bcrypt on next password change |
| No server-verified session tokens | Client can spoof `_userId` | Add sessions table + random token validation |
| No CSP header | XSS defense missing | Add Content-Security-Policy to next.config |

### MEDIUM Priority
| Gap | Risk | Mitigation Plan |
|-----|------|----------------|
| No CI/CD security scanning | Vulnerabilities may ship | Add Snyk / CodeQL to pipeline |
| No dependency update automation | Known CVEs may appear | Configure Dependabot |
| No formal incident response plan | Delayed breach response | Create IR runbook |
| No data classification policy | Over-retention of PII | Define retention schedule |

### LOW Priority
| Gap | Risk | Mitigation Plan |
|-----|------|----------------|
| No automated pentesting | Blind to edge-case flaws | Schedule quarterly automated pentest |
| No key rotation policy | Stale keys increase blast radius | Implement 90-day rotation |
| No formal RBAC model | Over-permissioned accounts | Define role hierarchy |

## Last Audit
- Date: 2026-07-23
- Tools: SAST scanner, vulnerability assessor, secret scanner, GDPR checker,
  compliance checker (SOC2/HIPAA/GDPR/PCI-DSS), ISO 27001 gap analysis, STRIDE threat modeler
- Compliance score (SOC2/HIPAA/GDPR/PCI-DSS): 44.1% — See `THREAT_MODEL.md` for details
- ISO 27001 compliance: 61.1% — See `ISO27001_GAPS.md` for details

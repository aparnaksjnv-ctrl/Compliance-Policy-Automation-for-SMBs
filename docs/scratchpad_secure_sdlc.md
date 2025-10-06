# Secure SDLC Scratchpad

Purpose: Working document for a secure software development approach tailored to this project. Use this to drive decisions, track risks, and define security gates throughout the lifecycle.

Note: Fill the placeholders with project-specific details during Week 1 wrap-up and Week 2 design sessions.

---

## 1) Project Context (to fill)
- Problem statement:
- Objectives and success metrics:
- Non-goals:
- Stakeholders & roles (RACI):
- Constraints (timeline, budget, tech stack, infra):
- Compliance/regulatory scope (e.g., GDPR, HIPAA, PCI, SOC 2):

## 2) Assets, Data Classification, and Privacy
- Assets to protect (apps, services, data stores, secrets, pipelines):
- Data categories (PII/PHI/PCI/credentials/source code/telemetry):
- Data flows (high-level):
- Retention & minimization strategy:
- Data residency requirements:

## 3) Security Objectives and Baselines
- Baseline control set: OWASP ASVS Level L2 (adjust if needed)
- Privacy principles: data minimization, purpose limitation, transparency
- Security objectives: confidentiality, integrity, availability, auditability
- Threat modeling methodology: STRIDE on DFDs + misuse/abuse cases

## 4) Architecture & Design Security
- Identity & Access
  - Authentication: OIDC/SAML, MFA, session management, secure cookies
  - Authorization: RBAC/ABAC, least privilege, service-to-service auth
- Data Protection
  - In transit: TLS 1.2+; mutual TLS where applicable
  - At rest: KMS-managed keys, envelope encryption for sensitive fields
  - Key management: rotation policy, separation of duties
- Secrets Management
  - Centralized secret store (e.g., Vault/KMS), no secrets in code/CI logs
  - Scoped access, short-lived credentials, rotation cadence
- Input Validation & Output Encoding
  - Centralized validation library, strict schema validation
  - Prevent injection (SQL/NoSQL/LDAP/OS), encode on output
- Logging & Auditing
  - Structured logging, correlation IDs, PII redaction strategy
  - Audit trail for auth events, data access, privilege changes, configs
- Rate Limiting & Abuse Protection
  - Endpoint quotas, adaptive throttling, CAPTCHA for abuse vectors
- Supply Chain Security
  - SBOM, pin dependencies, SCA policy, license compliance
  - Verify source provenance, signed artifacts
- Infrastructure & Network
  - Network segmentation, private subnets, security groups, WAF
  - Hardened images, CIS baselines, patching policy

## 5) Implementation Guidelines
- Coding Standards
  - Language-specific secure coding checklist (injection, authz, crypto, error handling)
  - Avoid unsafe functions/APIs; use parameterized queries
- Error Handling
  - No sensitive data in errors, consistent error taxonomy, user-safe messages
- Cryptography
  - Approved algorithms, centralized crypto utilities, RNG requirements
- Files & Serialization
  - Safe parsers only, size/time limits, deny-list dangerous types
- Secure Defaults
  - Deny-by-default access, minimal scopes/permissions, secure feature flags

## 6) Testing Strategy and Security Gates
- Automated Testing
  - Unit, integration, E2E; target ≥80% coverage for critical modules
- Security Testing
  - SAST (e.g., CodeQL/Semgrep)
  - SCA with SBOM generation and policy gates
  - DAST in staging (e.g., ZAP) with authenticated scans
  - IaC scanning (e.g., Checkov/tfsec) and container scanning (e.g., Trivy)
  - Secret scanning (e.g., gitleaks)
  - Fuzz testing for parsers and input-heavy endpoints
- Performance & Reliability
  - Load tests tied to SLOs; chaos or fault injection where feasible
- Gating Criteria (Sample)
  - No Critical/High in SAST/SCA/IaC/Container scans (or approved exceptions)
  - All security tests pass; E2E auth/abuse cases pass
  - SBOM produced for each release; artifacts signed

## 7) CI/CD and Release Security
- CI
  - PR checks: lint → unit → SAST/SCA → integration
  - Secrets: OIDC to cloud, masked secrets, least-privilege runners
- Build
  - Reproducible builds, SBOM, sign images/artifacts
- CD
  - Staging verification: E2E + DAST + manual approval
  - Progressive delivery (canary/blue-green) with automated rollback
- Change Management
  - Changelogs, release notes, approvals, audit logs

## 8) Observability, Operations, and IR
- Telemetry
  - Logs, metrics, traces; dashboards for auth errors, 4xx/5xx, latency, saturation
- Alerts & SLOs
  - On-call rotations, alert thresholds aligned to SLIs/SLOs
- Backups & DR
  - Regular backups, restore drills, RPO/RTO targets
- Incident Response
  - Runbooks, playbooks, comms templates, post-incident reviews
- Vulnerability Management
  - Intake triage, risk scoring, SLAs, patch cadence

## 9) Access Control and Governance
- Roles & Permissions
  - Admin, Security Analyst, Developer, Viewer (least privilege by default)
- Periodic Access Reviews
  - Quarterly access recertification, break-glass procedures
- Policy & Exceptions
  - Documented exceptions with owner, expiry, and compensating controls

## 10) Risk Register and Mitigation Backlog (to fill)
- Risk ID | Description | Likelihood | Impact | Owner | Mitigation | Target Date

## 11) Security Acceptance Criteria Templates
- For each user story:
  - Authentication: user is authenticated (incl. MFA if applicable)
  - Authorization: permitted roles only; enforced server-side
  - Input validation: schema-validated; no unsafe inputs
  - Logging: security-relevant events captured; no PII in logs
  - Error handling: generic messages to users; detailed logs internally
  - Secrets: retrieved from vault; no secrets in code/config
  - Data protection: PII encrypted at rest; TLS enforced in transit
  - Tests: unit/integration/E2E cover happy/edge/negative paths

## 12) Week-by-Week Outline (high level)
- Week 1: Requirements, data classification, DFD v1, STRIDE, mitigation backlog, security ACs
- Week 2: Architecture deep dives, API contracts, data model, control mapping, CI gate design
- Week 3–6: Incremental features with tests + security tooling; scans and triage
- Week 7–8: Hardening, performance, staging DAST, release prep
- Post-launch: Hypercare, monitoring, IR drills, continuous improvement

## 13) Open Questions (to fill)
- Regulatory and data residency constraints?
- MVP scope and roles at launch?
- Third-party integrations and data sharing?
- SLO/SLI targets (latency, availability, error budgets)?

## 14) References
- OWASP ASVS: https://owasp.org/ASVS/
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Microsoft SDL Threat Modeling: https://www.microsoft.com/en-us/securityengineering/sdl/threatmodeling
- OWASP ZAP: https://www.zaproxy.org/

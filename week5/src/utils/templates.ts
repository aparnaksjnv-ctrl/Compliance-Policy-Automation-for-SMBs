export type TemplateKey = 'GDPR_BASIC' | 'HIPAA_BASIC' | 'CCPA_BASIC' | 'GENERIC'

export const TEMPLATES: Record<TemplateKey, { label: string; content: string }> = {
  GDPR_BASIC: {
    label: 'GDPR Basic',
    content: `
# {{company}} — GDPR Data Protection Policy

## Purpose
This policy establishes how {{company}} processes personal data in compliance with the EU General Data Protection Regulation (GDPR).

## Scope
Applies to all processing activities performed by {{company}} and approved vendors.

## Roles and Responsibilities
- Data Protection Lead: {{owner}}
- Contact: {{contactEmail}}

## Lawful Basis
All processing activities must have a documented lawful basis.

## Data Retention
Data will be retained for {{dataRetentionMonths}} months unless a longer period is legally required or justified.

## Data Subject Rights
Requests will be handled within legal timeframes and documented.

## Vendor Management
Vendors are evaluated, approved, and monitored by {{dataProcessor}}.

## Security
Appropriate technical and organizational measures are implemented and reviewed periodically.

## Incident Response
Suspected incidents must be reported immediately to {{owner}} and handled per our incident process.
`.
      trim(),
  },
  HIPAA_BASIC: {
    label: 'HIPAA Basic',
    content: `
# {{company}} — HIPAA Privacy & Security Policy

## Purpose
Protect the confidentiality, integrity, and availability of Protected Health Information (PHI).

## Roles
- HIPAA Privacy Officer: {{owner}}
- Contact: {{contactEmail}}

## Administrative Safeguards
- Risk assessments conducted annually.
- Workforce training and sanctions policy in place.

## Physical Safeguards
- Facility access controls, workstation security.

## Technical Safeguards
- Access controls, audit controls, integrity, transmission security.

## Business Associates
Business Associate Agreements required with all vendors handling PHI. Managed by {{dataProcessor}}.
`.
      trim(),
  },
  CCPA_BASIC: {
    label: 'CCPA Basic',
    content: `
# {{company}} — CCPA Consumer Privacy Policy

## Notice at Collection
Consumers are informed of categories of personal information collected and purposes.

## Consumer Rights
Right to know, delete, and opt-out of sale/share. Requests handled within statutory timelines.

## Verification
Verification procedures are documented and followed.

## Service Providers
Contracts restrict use of personal information to business purpose. Managed by {{dataProcessor}}.

## Contact
Questions can be directed to {{contactEmail}}.
`.
      trim(),
  },
  GENERIC: {
    label: 'Generic Policy',
    content: `
# {{company}} — Policy

## Owner
{{owner}}

## Purpose
Describe the purpose of this policy here.

## Responsibilities
Outline roles and responsibilities.

## Process
Provide process steps, controls, and references.
`.
      trim(),
  },
}

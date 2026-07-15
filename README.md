# Compliance & Policy Automation for SMBs

A full-stack web application that helps small and medium businesses 
automate their compliance workflows across GDPR, HIPAA, and CCPA 
frameworks — reducing the manual overhead of staying audit-ready.

## What it does

- **Policy Generation** — AI-assisted generation of compliance 
  policies tailored to the business profile
- **Risk Assessment** — NIST-based risk scoring with prioritized 
  remediation recommendations  
- **Vendor Compliance Tracker** — Track third-party vendor compliance 
  status with CSV import/export
- **Audit Logging** — Tamper-aware activity log tracking who changed 
  what and when (SOC 2 aligned)
- **Role-Based Access Control** — Admin and standard user roles with 
  enforced permission boundaries
- **Compliance Dashboard** — Visual risk scoring charts across 
  compliance domains

## Tech Stack

**Frontend:** React, Vite, TypeScript  
**Backend:** Node.js, Express, TypeScript  
**Database:** MongoDB  
**Auth:** JWT with HttpOnly cookies, bcrypt password hashing  
**Security:** Helmet.js (CSP, XSS protection), Zod validation, 
rate limiting  

## Compliance Frameworks Covered

- GDPR (General Data Protection Regulation)
- HIPAA (Health Insurance Portability and Accountability Act)
- CCPA (California Consumer Privacy Act)
- NIST CSF (Cybersecurity Framework) for risk assessment

## Security Controls

- AES-256-GCM encryption for sensitive data
- JWT authentication with HttpOnly cookies (XSS-resistant)
- Bcrypt password hashing
- Input validation with Zod
- Rate limiting on all API endpoints
- Content Security Policy headers via Helmet.js

## Project Structure

# Research Table (Angular + Express)

A simple Angular frontend and a minimal Express backend that proxies Crossref API to fetch research articles (including DOI). Everything (code, UI, README) is in English.

## What this repo provides
- A ready-to-run **Express backend** (TypeScript) that performs safe searches to Crossref and returns normalized results (title, authors, journal, year, DOI, abstract, url).
- A **patch set** for an Angular app (files to copy into an Angular CLI app) that implements a polished UI using Angular Material to display the results in a responsive table.

## Quick Setup
1. Install global prerequisites: Node.js (16+), npm.

2. Create frontend Angular app (one-time):
   npx @angular/cli@16 new frontend --routing=false --style=css --skip-git --skip-install

3. Install frontend deps:
   cd frontend
   npm install
   npm install @angular/material @angular/cdk @angular/animations

4. Apply frontend patches: copy files from `patches/frontend/` into the generated `frontend/src/app/` (see files and instructions in `patches/README.md`).

5. Backend setup:
   cd backend
   npm install
   cp .env.example .env   # set CROSSREF_MAILTO to your contact email
   npm run dev

6. Run both (in separate terminals):
   # Terminal 1 (backend)
   cd backend && npm run dev

   # Terminal 2 (frontend)
   cd frontend && npx ng serve

Frontend will run on http://localhost:4200, backend on http://localhost:3000 by default.

## Design and Features
- Clean Material Design theme and responsive table.
- Search box with remote querying (Crossref) and results show DOI prominently with direct link to DOI.org.
- Sorting, pagination, and abstract preview.

## Notes
- Crossref API requires gentle usage. Set your email in `.env` (CROSSREF_MAILTO) so Crossref can identify contact.
- This repository contains the backend and all files required to patch a generated Angular project.

---
If you want, I can finish applying the patches into a generated Angular app here (I can run the generator if you allow me to run commands). Otherwise, follow the quick setup and let me know when you'd like me to continue.
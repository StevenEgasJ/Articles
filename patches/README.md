# Frontend Patches (for generated Angular app)

After you run:

  npx @angular/cli@16 new frontend --routing=false --style=css --skip-git --skip-install

Copy the files from this `patches/frontend/` folder into `frontend/src/app/` (overwrite the default files where noted).

Files included:
- `app.component.ts` (main component)
- `app.component.html` (UI with Material table)
- `app.module.ts` (imports Material and HttpClient)
- `research.service.ts` (calls the backend `/api/search`)
- `models.ts` (simple interfaces)
- `styles.css` (global styles to make it look nice)

Then run `cd frontend && npm install` and `npx ng serve`.

If you want, I can also run the Angular generator and apply these patches automatically—tell me to continue and I'll do it.
# HAC grades reader (version 2)

Home Access Center has no public API, and a GitHub Pages site cannot sign in to it from the
browser. This small Cloudflare Worker does the sign-in instead: the site sends it your HAC
username and password, it signs in to `hac.csisd.org` and returns your grade pages (class work
for any grading period, report card, transcript). The site reads those pages in your browser.
The worker stores and logs nothing, only talks to CSISD's HAC, and only answers the site's pages.

## Set up (about five minutes, free)

1. Make an account at https://dash.cloudflare.com/sign-up
2. Workers & Pages -> Create -> Worker (Hello World template) -> name it `hac-grades` -> Deploy.
3. Edit code -> delete what is there -> paste all of `worker.js` -> Deploy.
4. Copy the address it shows (`https://hac-grades.<you>.workers.dev`). Opening it should show
   `{"ok":true,"about":"HAC grades reader, version 2..."}`.
5. On the site: Grades -> Connect HAC -> paste the address and your HAC login.

Updating from version 1: repeat step 3 with the new `worker.js`.

`node test.mjs --live` makes one wrong-password attempt against the real HAC.

# HAC grades reader

Home Access Center has no public API, and a GitHub Pages site cannot sign in to it from the
browser. This tiny Cloudflare Worker does the sign-in instead: the site sends it your HAC
username and password, it signs in to `hac.csisd.org`, reads the class averages and returns
them. It stores and logs nothing, only talks to CSISD's HAC, and only answers the site's own pages.

## Set up (about five minutes, free)

1. Make an account at https://dash.cloudflare.com/sign-up
2. Workers & Pages -> Create -> Worker -> give it a name (for example `hac-grades`) -> Deploy.
3. Edit code -> delete what is there -> paste all of `worker.js` -> Deploy.
4. Copy the address it shows (`https://hac-grades.<you>.workers.dev`).
5. On the site: Home -> Grades -> Sync from HAC -> paste the address, type your HAC login.

`node test.mjs` checks the parser; `node test.mjs --live` also makes one wrong-password attempt against HAC.

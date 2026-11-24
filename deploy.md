# Deploy the calculator

The existing Cloudflare Pages deployment is static and cannot run the history API. The complete app is configured to run on Render with a persistent disk for `history.txt`.

## Deploy on Render

1. Push the app files and `render.yaml` to the GitHub repository's `main` branch.
2. In the [Render Dashboard](https://dashboard.render.com), choose **New** > **Blueprint** and connect `tannguyen2907/calculator-homework`.
3. Review the web service and persistent disk plan, then create the Blueprint. Render persistent disks require a paid web-service plan.
4. Wait for the service to deploy and open its `onrender.com` URL.
5. Test a calculation, reload the page, and confirm the history is still displayed.

After the Blueprint is created, pushes to `main` redeploy the Render service. Cloudflare Pages may also redeploy from `main`, but its static URL will not provide the history API.

## Local development

From the project folder, run:

```powershell
node server.js
```

Then open <http://localhost:3000>. History is saved to the local `history.txt`; on Render, `HISTORY_FILE` points to the persistent disk instead.

# Deploy the calculator on Cloudflare Pages

The GitHub repository is connected to the Cloudflare Pages project, which deploys the `main` branch. The history API is a Pages Function at `functions/api/history.js`. It stores the history JSON as text in a Workers KV value named `history.txt`.

## Configure free Workers KV storage

The production Pages project uses the `HISTORY_KV` binding with the `calculator-homework-history` namespace.

1. In the Cloudflare Dashboard, open **Workers & Pages** > **KV** and create a namespace named `calculator-homework-history`.
2. Open **Workers & Pages** > **calculator-homework** > **Settings** > **Bindings** > **Add** > **KV namespace**.
3. Set the variable name to `HISTORY_KV`, select the namespace, and save.
4. Redeploy the Pages project so the Function can use the binding.

The Workers Free plan includes 1 GB of KV storage, 100,000 reads per day, and 1,000 writes per day. Requests over the Free plan limits fail until the daily limit resets; they do not incur overage charges on the Free plan.

## Deploy changes

Push changes to the repository's `main` branch. Cloudflare Pages builds the static site and deploys the Pages Function from the root `functions` directory. After deployment, open the Pages URL, submit a calculation, then reload to verify history persists.

## Local development

Run the Node mock API from the project folder:

```powershell
node server.js
```

Then open <http://localhost:3000>. Locally, history is saved to `history.txt`; on Cloudflare, it is stored as the text value `history.txt` in the KV namespace.

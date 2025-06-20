# Forum Generic

This repository contains a simple front-end application for viewing and creating forum posts. The project is entirely client-side and must be served from a local web server.

This project is licensed under the [MIT License](LICENSE).

## Prerequisites

- Node.js for running tests, linting, and optionally the `http-server` package.
- A local web server. You can use `http-server` from Node.js or Python's built in `http.server` module.

## Running locally

1. Run `npm install` to install development dependencies.

2. Copy `src/credentials.example.js` to `src/credentials.js` and add your actual credentials.

3. Start a local web server in the project directory. Examples:

   ```bash
   # Using Node.js (http-server)
   npm install -g http-server
   http-server .

   # Using Python
   python3 -m http.server
   ```

   By default the server runs on port 8080. Adjust the command if you want a different port.
   Static files such as `index.html` and styles are located in the `public/` folder. Application source code resides in `src/`.
   The UI uses [Font Awesome Free](https://fontawesome.com/) icons via a CDN link included in `public/index.html`.

4. Open your browser at `http://localhost:8080/public/index.html` (or the port you chose) to use the application.

## External dependencies loaded via CDN

The application relies on several third-party libraries that are loaded directly
from various CDNs in `public/index.html`:

- `https://cdn.tailwindcss.com` – Tailwind CSS framework.
- `https://cdn.jsdelivr.net/npm/plyr@3.7.8/dist/plyr.css` – Plyr styles.
- `https://cdn.jsdelivr.net/npm/plyr@3.7.8/dist/plyr.polyfilled.min.js` – Plyr
  JavaScript.
- `https://unpkg.com/filepond-plugin-file-validate-type/dist/filepond-plugin-file-validate-type.js` – FilePond file type validation plugin.
- `https://unpkg.com/filepond-plugin-image-preview/dist/filepond-plugin-image-preview.js` – FilePond image preview plugin.
- `https://unpkg.com/filepond-plugin-media-preview/dist/filepond-plugin-media-preview.js` – FilePond media preview plugin.
- `https://unpkg.com/filepond-plugin-file-poster/dist/filepond-plugin-file-poster.js` – FilePond file poster plugin.
- `https://unpkg.com/filepond/dist/filepond.js` – FilePond core library.
- `https://cdn.jsdelivr.net/npm/tributejs@5.1.3/dist/tribute.css` – Tribute.js styles.
- `https://unpkg.com/filepond/dist/filepond.css` – FilePond base styles.
- `https://unpkg.com/filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css` – Styles for the image preview plugin.
- `https://unpkg.com/filepond-plugin-media-preview/dist/filepond-plugin-media-preview.css` – Styles for the media preview plugin.
- `https://unpkg.com/filepond-plugin-file-poster/dist/filepond-plugin-file-poster.css` – Styles for the file poster plugin.
- `https://code.jquery.com/jquery-3.6.4.min.js` – jQuery library.
- `https://cdn.jsdelivr.net/npm/jsrender/jsrender.min.js` – JsRender templating library.
- `https://cdn.jsdelivr.net/npm/tributejs@5.1.3/dist/tribute.min.js` – Tribute.js library.
- `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css` – Font Awesome icons.
- `https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js` – Alpine.js framework.
- `https://unpkg.com/mic-recorder-to-mp3@2.2.1/dist/index.min.js` – Audio recording utility.

### Regenerating SRI hashes

When upgrading any of the CDN links above, update the corresponding
`integrity` attributes in `public/index.html`.

Use `curl` and `openssl` to generate a new SHA-384 hash for each URL:

```bash
curl -L <url> | openssl dgst -sha384 -binary | openssl base64 -A
```

Copy the resulting string and set it as the value of the `integrity`
attribute. Each tag should also include `crossorigin="anonymous"` so
the browser can verify the SRI hash correctly.

## Configuration

Configuration values are read in `src/config.js` from `src/credentials.js` or from `window.APP_CONFIG` at runtime. Copy `src/credentials.example.js` to `src/credentials.js` and add your own values.

### Fields

- **API_KEY** – GraphQL API key used for both HTTP and WebSocket requests. Obtain this from your Ontraport account or whichever backend you use.
- **AWS_PARAM** – Base64 encoded `awsParam` string required to request a pre-signed S3 upload URL. On an Ontraport page you can read this value from `window.awsParam`. The helper functions `decodeAwsParam()` and `encodeAwsParam()` in `src/utils/handleFile.js` illustrate how to work with it.
- **AWS_PARAM_URL** – Endpoint that receives the `awsParam` and returns S3 upload parameters. This is usually `https://<your-domain>/s/aws` when using Ontraport.
- **HTTP_ENDPOINT** – URL of the GraphQL HTTP endpoint.
- **WS_ENDPOINT** – GraphQL WebSocket endpoint for real-time updates. Typically the same host as `HTTP_ENDPOINT` using `wss://` and appending `?apiKey=YOUR_API_KEY`.

Copy `src/credentials.example.js` to `src/credentials.js` and fill in your actual values. The repository's `.gitignore` already excludes this file so your secrets stay out of version control.

## Tests

Run the unit tests with:

```bash
npm test
```

## Linting

Run ESLint across the project with:

```bash
npm run lint
```

## Project structure

- `public/` – Static assets and entry HTML.
- `src/` – Application source code.
- `test/` – Unit tests.


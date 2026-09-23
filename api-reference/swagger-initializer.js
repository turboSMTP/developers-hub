// Loader: shown on page load, dismissed when Swagger UI finishes rendering.
//
// The served spec is a single PRE-BUNDLED file (upstream/turbo-smtp.yaml) with
// only internal $refs — there are no per-domain network fetches anymore, so the
// previous fetch-tracking loader is unnecessary. We dismiss the loader on
// Swagger UI's own `onComplete` callback (deterministic), with a short safety
// fallback in case it never fires.
//
// The URL below is the ONLY spec-path reference in the served bundle, and it is
// resolved by the browser at runtime: if it is wrong the live site 404s while CI
// stays green. Nothing validates the uploaded directory. Verify any change to it
// by serving api-reference/ locally and loading the page.

// Show loader initially
document.addEventListener('DOMContentLoaded', function () {
  const loader = document.getElementById('loader');
  if (loader) {
    loader.style.display = 'flex';
    loader.dataset.phase = 'loading';
  }
});

// Hide loader function
function hideLoader() {
  const loader = document.getElementById('loader');
  if (!loader) return;
  loader.classList.add('hidden');
  setTimeout(() => {
    loader.style.display = 'none';
  }, 300); // Wait for fade transition
}

window.onload = function () {
  //<editor-fold desc="Changeable Configuration Block">

  window.ui = SwaggerUIBundle({
    url: "./upstream/turbo-smtp.yaml", // single pre-bundled spec, served verbatim (no overlays)
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset
    ],
    plugins: [
      SwaggerUIBundle.plugins.DownloadUrl
    ],
    //layout: "StandaloneLayout",
    persistAuthorization: true,
    requestSnippetsEnabled: true,
    showExtensions: true,
    showCommonExtensions: true,
    // Render-speed: start with operations collapsed and hide the large
    // Models section by default (both are major initial-render costs).
    docExpansion: "none",
    defaultModelsExpandDepth: -1,
    // Deterministic loader dismissal once the initial render completes.
    onComplete: function () {
      hideLoader();
    },
    syntaxHighlight: {
      activated: true,
    },
    requestSnippets: {
      generators: {
        curl_bash: {
          title: "cURL (bash)",
          syntax: "bash"
        },
        curl_powershell: {
          title: "cURL (PowerShell)",
          syntax: "powershell"
        },
        curl_cmd: {
          title: "cURL (CMD)",
          syntax: "bash"
        },
        javascript_fetch: {
          title: "JavaScript (Fetch)",
          syntax: "javascript"
        },
        python_requests: {
          title: "Python (Requests)",
          syntax: "python"
        },
        java_httpclient: {
          title: "Java (HttpClient)",
          syntax: "java"
        },
        csharp_httpclient: {
          title: "C# (HttpClient)",
          syntax: "csharp"
        }
      },
      defaultExpanded: true
    }
  });

  // Safety fallback: hide loader if onComplete does not fire.
  setTimeout(hideLoader, 8000);

  //</editor-fold>
};

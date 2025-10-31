$(document).ready(function () {
  const $tbody = $("#log-body");
  const $clearBtn = $("#clear-btn");

  $clearBtn.on("click", () => {
    $tbody.html(
      `<tr><td colspan="5" class="text-center text-muted py-4"><em>Hit a request to see a log</em></td></tr>`
    );
  });

  const es = new EventSource("/express-visual-logger/stream");

  es.onopen = () => console.log("SSE connected");
  es.onerror = (e) => {
    console.error("SSE Error:", e);
    es.close();
    alert("SSE connection failed. Check server logs.");
  };

  es.onmessage = (e) => {
    const log = JSON.parse(e.data);
    const methodColor =
      {
        GET: "success",
        POST: "primary",
        PUT: "warning",
        DELETE: "danger",
      }[log.method] || "secondary";

    const row = `
          <tr>
            <td><small>${new Date(
              log.timestamp
            ).toLocaleTimeString()}</small></td>
            <td><span class="badge bg-${methodColor}">${log.method}</span></td>
            <td><code>${log.url}</code></td>
            <td>
              <pre class="mb-0 small">${JSON.stringify(
                { ...log.query, ...log.body },
                null,
                2
              )}</pre>
            </td>
            <td><strong>${log.duration}</strong></td>
          </tr>
        `;

    $tbody.prepend(row);
    if ($tbody.children().length > 100) $tbody.find("tr:last").remove();
  };
});

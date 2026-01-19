// frontend/assets/js/form-renderer.js
import { fetchFormXML } from "./api.js";
import { toast } from "./app.js";

function parseXML(xmlText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "text/xml");
  const err = doc.querySelector("parsererror");
  if (err) throw new Error("Invalid XML syntax in form file.");
  return doc;
}

function buildModel(doc) {
  const formNode = doc.querySelector("form");
  const title = formNode?.getAttribute("title") || "Form";

  const fields = [...doc.querySelectorAll("field")].map((f) => ({
    name: f.getAttribute("name") || "",
    label: f.getAttribute("label") || f.getAttribute("name") || "Field",
    type: (f.getAttribute("type") || "text").toLowerCase(),
    required: (f.getAttribute("required") || "false").toLowerCase() === "true",
    placeholder: f.getAttribute("placeholder") || "",
    options: [...f.querySelectorAll("option")].map((o) => ({
      value: o.getAttribute("value") ?? (o.textContent ?? ""),
      label: (o.textContent ?? "").trim() || (o.getAttribute("value") ?? "")
    }))
  }));

  return { title, fields };
}

export async function renderForm({ code, mountId, onSubmit }) {
  const mount = document.getElementById(mountId);
  if (!mount) throw new Error(`Mount not found: #${mountId}`);

  mount.innerHTML = `
    <div class="empty">
      <strong>Loading form…</strong>
      <div class="small">Reading XML: ${code}.xml</div>
    </div>
  `;

  try {
    const xmlText = await fetchFormXML(code);
    const doc = parseXML(xmlText);
    const model = buildModel(doc);

    // ---- UI ----
    mount.innerHTML = "";

    const wrap = document.createElement("div");
    wrap.className = "card";
    wrap.style.marginTop = "14px";

    const head = document.createElement("div");
    head.className = "head";
    head.innerHTML = `<h2>${model.title}</h2><div class="meta">Fill and submit</div>`;

    const body = document.createElement("div");
    body.className = "body";

    const form = document.createElement("form");
    form.className = "form";

    model.fields.forEach((f) => {
      const field = document.createElement("div");
      field.className = "field";

      const label = document.createElement("label");
      label.textContent = f.label + (f.required ? " *" : "");
      label.setAttribute("for", f.name);

      let input;
      if (f.type === "select") {
        input = document.createElement("select");
        f.options.forEach((opt) => {
          const o = document.createElement("option");
          o.value = opt.value;
          o.textContent = opt.label;
          input.appendChild(o);
        });
      } else if (f.type === "textarea") {
        input = document.createElement("textarea");
        input.rows = 4;
      } else {
        input = document.createElement("input");
        input.type = f.type; // text/email/date/number/etc
      }

      input.id = f.name;
      input.name = f.name;
      if (f.placeholder) input.placeholder = f.placeholder;
      if (f.required) input.required = true;

      field.appendChild(label);
      field.appendChild(input);
      form.appendChild(field);
    });

    // Submit row
    const row = document.createElement("div");
    row.className = "row";
    row.style.marginTop = "12px";

    const spacer = document.createElement("div");
    spacer.style.flex = "1";

    const btn = document.createElement("button");
    btn.className = "btn primary";
    btn.type = "submit";
    btn.textContent = "Submit";

    row.appendChild(spacer);
    row.appendChild(btn);
    form.appendChild(row);

    // ---- IMPORTANT: submit handler ----
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      console.log("[RCMS] submit fired for:", code);

      const fd = new FormData(form);
      const data = {};
      for (const [k, v] of fd.entries()) data[k] = v;

      console.log("[RCMS] submit payload:", data);

      try {
        await onSubmit?.(data);
      } catch (err) {
        console.error("[RCMS] onSubmit error:", err);
        toast("Not submitted", err?.message || "Submit failed");
      }
    });

    body.appendChild(form);
    wrap.appendChild(head);
    wrap.appendChild(body);
    mount.appendChild(wrap);

    console.log("[RCMS] form rendered:", code);
  } catch (e) {
    console.error("[RCMS] renderForm failed:", e);
    mount.innerHTML = `
      <div class="empty">
        <strong>Form not available</strong>
        <div class="small">${e?.message || "Unknown error"}</div>
      </div>
    `;
    toast("Form error", e?.message || "Could not load form XML.");
  }
}

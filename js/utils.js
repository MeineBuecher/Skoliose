const Utils = {
  escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },

  isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
  },

  toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  },

  clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  },

  safeDateString(value, locale = "de-DE") {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString(locale);
  },

  safeDateOnly(value, locale = "de-DE") {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString(locale);
  },

  fileLooksLikeImage(file) {
    if (!file) return false;
    if (file.type && file.type.startsWith("image/")) return true;

    const name = String(file.name || "").toLowerCase();
    return [".jpg", ".jpeg", ".png", ".webp", ".bmp"].some((ending) =>
      name.endsWith(ending)
    );
  },

  safeArray(value) {
    return Array.isArray(value) ? value : [];
  },

  safeObject(value) {
    return value && typeof value === "object" ? value : {};
  },

  makeErrorCard(title, text, buttonId, buttonLabel) {
    return `
      <section class="screen">
        <div class="card">
          <h2>${this.escapeHtml(title)}</h2>
          <p>${this.escapeHtml(text)}</p>
          ${
            buttonId && buttonLabel
              ? `
            <div class="form-actions">
              <button id="${this.escapeHtml(buttonId)}" class="primary-button" type="button">
                ${this.escapeHtml(buttonLabel)}
              </button>
            </div>
          `
              : ""
          }
        </div>
      </section>
    `;
  },
};
// StatsPanel.js
import { StructureCatalog } from "../core/StructureCatalog.js";

export class StatsPanel {
    constructor(viewer, structureService = null) {
        this.viewer = viewer;
        this.structureService = structureService; // optional, for future syncing
        this.root = document.getElementById("stats-root");
        if (!this.root) {
            console.warn("[StatsPanel] #stats-root not found");
            return;
        }

        // Render once initially
        this.render();

        // Keep it live: re-render when entities change
        // (Cesium EntityCollection has collectionChanged)
        viewer.entities.collectionChanged.addEventListener(() => {
            this.render();
        });

        // Also re-render periodically to catch property changes without entity add/remove
        // (lightweight, can be optimized later)
        this.tick = setInterval(() => this.render(), 500);
    }

    dispose() {
        if (this.tick) clearInterval(this.tick);
    }

    render() {
        const { totals, perType, count } = this.computeStats();

        // Build HTML (functionality-first)
        const rows = Object.entries(perType)
            .sort((a, b) => b[1].count - a[1].count)
            .map(([type, info]) => {
                const label = StructureCatalog[type]?.label ?? type;
                return `
          <tr>
            <td>${label}</td>
            <td style="text-align:right">${info.count}</td>
            <td style="text-align:right">${formatCurrency(info.costs)}</td>
            <td style="text-align:right">${info.residents}</td>
            <td style="text-align:right">${info.workplaces}</td>
          </tr>
        `;
            })
            .join("");

        this.root.innerHTML = `
      <div style="display:flex; gap:12px; flex-wrap:wrap; margin: 10px 0;">
        ${statCard("Structuren", count)}
        ${statCard("Totale kosten", formatCurrency(totals.costs))}
        ${statCard("Inwoners", totals.residents)}
        ${statCard("Werkplekken", totals.workplaces)}
      </div>

      <h3 style="margin-top:16px; font-size:14px; color:#ddd;">Verdeling per type</h3>
      <table style="width:100%; text-align:left; color:#ccc; font-size:14px; border-collapse:collapse;">
        <thead>
          <tr style="color:#999; border-bottom:1px solid #333;">
            <th style="padding:6px 0;">Type</th>
            <th style="padding:6px 0; text-align:right;">Aantal</th>
            <th style="padding:6px 0; text-align:right;">Kosten</th>
            <th style="padding:6px 0; text-align:right;">Inwoners</th>
            <th style="padding:6px 0; text-align:right;">Werkplekken</th>
          </tr>
        </thead>
        <tbody>
          ${rows || `<tr><td colspan="5" style="padding:10px 0; color:#888;">Nog geen structuren geplaatst.</td></tr>`}
        </tbody>
      </table>
    `;
    }

    computeStats() {
        const entities = this.viewer.entities.values;

        const totals = { costs: 0, residents: 0, workplaces: 0 };
        const perType = {};
        let count = 0;

        for (const e of entities) {
            if (!isStructureEntity(e)) continue;

            const type = getProp(e, "type") ?? "building";
            const def = StructureCatalog[type] ?? null;

            count++;

            const costs = def?.costs ?? 0;
            const residents = def?.residents ?? 0;
            const workplaces = def?.workplaces ?? 0;

            totals.costs += costs;
            totals.residents += residents;
            totals.workplaces += workplaces;

            if (!perType[type]) {
                perType[type] = { count: 0, costs: 0, residents: 0, workplaces: 0 };
            }
            perType[type].count += 1;
            perType[type].costs += costs;
            perType[type].residents += residents;
            perType[type].workplaces += workplaces;
        }

        return { totals, perType, count };
    }
}

function isStructureEntity(entity) {
    const kind = getProp(entity, "kind");
    return kind === "structure";
}

function getProp(entity, key) {
    if (!entity?.properties?.[key]) return null;
    const prop = entity.properties[key];
    if (typeof prop.getValue === "function") {
        return prop.getValue(Cesium.JulianDate.now());
    }
    return prop;
}

function statCard(title, value) {
    return `
    <div style="min-width:160px; padding:10px 12px; border:1px solid #333; border-radius:8px; background:#121212;">
      <div style="font-size:12px; color:#888;">${title}</div>
      <div style="font-size:18px; color:#fff; margin-top:4px;">${value}</div>
    </div>
  `;
}

function formatCurrency(n) {
    // Simple € formatting (no intl dependency)
    const num = Number(n) || 0;
    if (num >= 1_000_000) return `€ ${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `€ ${(num / 1_000).toFixed(1)}k`;
    return `€ ${num.toFixed(0)}`;
}

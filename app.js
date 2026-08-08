onst CAPS = {
  insurance: 622,
  tax: 600,
  spending: 1600,
  rent: 1600,
  ira: 200
};

let tips = JSON.parse(localStorage.getItem("tips") || "[]").map(t => ({
  amount: Number(t.amount) || 0,
  insurance: Number(t.insurance) || 0,
  tax: Number(t.tax) || 0,
  spending: Number(t.spending) || 0,
  rent: Number(t.rent) || 0,
  ira: Number(t.ira) || 0,
  spain: Number(t.spain) || 0,
  time: t.time || new Date().toISOString()
}));

function getMonthTotals() {
  const now = new Date();
  const m = now.getMonth();
  const y = now.getFullYear();

  const totals = {
    insurance: 0,
    tax: 0,
    spending: 0,
    rent: 0,
    ira: 0,
    spain: 0
  };

  tips.forEach(t => {
    const d = new Date(t.time);

    if (d.getMonth() === m && d.getFullYear() === y) {
      totals.insurance += Number(t.insurance) || 0;
      totals.tax += Number(t.tax) || 0;
      totals.spending += Number(t.spending) || 0;
      totals.rent += Number(t.rent) || 0;
      totals.ira += Number(t.ira) || 0;
      totals.spain += Number(t.spain) || 0;
    }
  });

  return totals;
}

function addTip() {
  const input = document.getElementById("amount");

  if (!input) return;

  const val = parseFloat(input.value);

  if (!Number.isFinite(val) || val <= 0) return;

  const totals = getMonthTotals();

  const entry = {
    amount: Math.round(val * 100) / 100,
    insurance: 0,
    tax: 0,
    spending: 0,
    rent: 0,
    ira: 0,
    spain: 0,
    time: new Date().toISOString()
  };

  const tipCents = Math.round(val * 100);

  const available = {};

  Object.keys(CAPS).forEach(key => {
    const capCents = Math.round(CAPS[key] * 100);
    const usedCents = Math.round((totals[key] || 0) * 100);

    available[key] = Math.max(0, capCents - usedCents);
  });

  const totalNeeded = Object.values(available)
    .reduce((sum, cents) => sum + cents, 0);

  const amountForBuckets = Math.min(
    tipCents,
    totalNeeded
  );

  if (amountForBuckets > 0 && totalNeeded > 0) {
    const raw = {};
    const allocated = {};

    let used = 0;

    Object.keys(CAPS).forEach(key => {
      if (available[key] <= 0) {
        raw[key] = 0;
        allocated[key] = 0;
        return;
      }

      raw[key] =
        amountForBuckets *
        available[key] /
        totalNeeded;

      allocated[key] = Math.floor(raw[key]);

      if (allocated[key] > available[key]) {
        allocated[key] = available[key];
      }

      used += allocated[key];
    });

    let penniesLeft = amountForBuckets - used;

    const order = Object.keys(CAPS).sort((a, b) => {
      const remainderA =
        raw[a] - Math.floor(raw[a]);

      const remainderB =
        raw[b] - Math.floor(raw[b]);

      return remainderB - remainderA;
    });

    while (penniesLeft > 0) {
      let added = false;

      for (const key of order) {
        if (allocated[key] < available[key]) {
          allocated[key]++;
          penniesLeft--;
          added = true;

          if (penniesLeft === 0) {
            break;
          }
        }
      }

      if (!added) break;
    }

    Object.keys(CAPS).forEach(key => {
      entry[key] = allocated[key] / 100;
    });
  }

  const bucketCents =
    Math.round(entry.insurance * 100) +
    Math.round(entry.tax * 100) +
    Math.round(entry.spending * 100) +
    Math.round(entry.rent * 100) +
    Math.round(entry.ira * 100);

  const spainCents = Math.max(
    0,
    tipCents - bucketCents
  );

  entry.spain = spainCents / 100;

  tips.push(entry);

  localStorage.setItem(
    "tips",
    JSON.stringify(tips)
  );

  input.value = "";

  update();
}

function deleteLast() {
  if (tips.length === 0) return;

  tips.pop();

  localStorage.setItem(
    "tips",
    JSON.stringify(tips)
  );

  update();
}

function update() {
  const total = tips.reduce(
    (sum, t) => sum + (Number(t.amount) || 0),
    0
  );

  let html = "";

  tips.slice().reverse().forEach(t => {
    html += `
      <div style="padding:10px;border-bottom:1px solid #eee;">
        <b>$${(Number(t.amount) || 0).toFixed(2)}</b><br>
        <small>
          Insurance: $${(Number(t.insurance) || 0).toFixed(2)} |
          Taxes: $${(Number(t.tax) || 0).toFixed(2)} |
          Spending: $${(Number(t.spending) || 0).toFixed(2)} |
          Rent: $${(Number(t.rent) || 0).toFixed(2)} |
          IRA: $${(Number(t.ira) || 0).toFixed(2)} |
          Spain: $${(Number(t.spain) || 0).toFixed(2)}
        </small>
      </div>
    `;
  });

  const result = document.getElementById("result");

  if (result) {
    result.innerHTML = `
      <h2>Total: $${total.toFixed(2)}</h2>
      <hr>
      ${html || "No entries yet"}
    `;
  }

  renderProgress();
  renderSpainFlow();
}

function renderProgress() {
  const totals = getMonthTotals();

  let html = "";

  Object.keys(CAPS).forEach(key => {
    const used = Number(totals[key]) || 0;

    const pct = Math.min(
      100,
      (used / CAPS[key]) * 100
    );

    let color = "#4caf50";

    if (pct > 95) {
      color = "#e53935";
    } else if (pct > 80) {
      color = "#ff9800";
    }

    html += `
      <div style="margin-bottom:12px;">
        <strong>${key}</strong>
        $${used.toFixed(2)} / $${CAPS[key].toFixed(2)}

        <div style="
          background:#eee;
          height:10px;
          border-radius:5px;
          overflow:hidden;
        ">
          <div style="
            width:${pct}%;
            height:10px;
            background:${color};
            border-radius:5px;
          "></div>
        </div>
      </div>
    `;
  });

  html += `
    <div style="margin-top:16px;">
      <strong>Spain Fund</strong>
      $${totals.spain.toFixed(2)}
    </div>
  `;

  const progress = document.getElementById("progress");

  if (progress) {
    progress.innerHTML = html;
  }
}

function renderSpainFlow() {
  const el = document.getElementById("spainFlow");

  if (!el) return;

  const totals = getMonthTotals();
  const spain = Math.max(0, totals.spain || 0);

  el.innerHTML = `
    <h3 style="margin:0 0 8px 0;">
      Spain Overflow
    </h3>

    <div style="
      font-size:14px;
      margin-bottom:6px;
      color:#aaa;
    ">
      Unallocated: $${spain.toFixed(2)}
    </div>

    <div style="
      background:#222838;
      height:10px;
      border-radius:999px;
      overflow:hidden;
    ">
      <div
        class="spain-flow-bar"
        style="
          width:${Math.min(100, spain)}%;
          height:10px;
        "
      ></div>
    </div>
  `;
}

function bindReset() {
  const monthBtn =
    document.getElementById("resetMonth");

  const allBtn =
    document.getElementById("resetAll");

  if (monthBtn) {
    monthBtn.onclick = () => {
      const now = new Date();

      tips = tips.filter(t => {
        const d = new Date(t.time);

        return !(
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      });

      localStorage.setItem(
        "tips",
        JSON.stringify(tips)
      );

      update();
    };
  }

  if (allBtn) {
    allBtn.onclick = () => {
      tips = [];

      localStorage.removeItem("tips");

      update();
    };
  }
}

function init() {
  const save =
    document.getElementById("saveBtn");

  const sticky =
    document.getElementById("stickySaveBtn");

  const del =
    document.getElementById("deleteLast");

  if (save) {
    save.onclick = addTip;
  }

  if (sticky) {
    sticky.onclick = addTip;
  }

  if (del) {
    del.onclick = deleteLast;
  }

  bindReset();
  update();
}

document.addEventListener(
  "DOMContentLoaded",
  init
);

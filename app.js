const CAPS = {
  insurance: 622,
  tax: 600,
  spending: 2000,
  rent: 1500,
  ira: 200
};

const ORDER = ["insurance", "tax", "spending", "rent", "ira"];

document.getElementById("stickySaveBtn")

let tips = JSON.parse(localStorage.getItem("tips") || "[]");

/* ---------------- MONTH TOTALS ---------------- */

function getMonthTotals() {
  const now = new Date();
  const m = now.getMonth();
  const y = now.getFullYear();

  let totals = {
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
      totals.insurance += t.insurance;
      totals.tax += t.tax;
      totals.spending += t.spending;
      totals.rent += t.rent;
      totals.ira += t.ira;
      totals.spain += t.spain || 0;
    }
  });

  return totals;
}

/* ---------------- ADD TIP (CORE ENGINE) ---------------- */

function addTip() {
  const input = document.getElementById("amount");
  const val = parseFloat(input.value);
  if (isNaN(val)) return;

  const totals = getMonthTotals();

  let entry = {
    amount: val,
    insurance: 0,
    tax: 0,
    spending: 0,
    rent: 0,
    ira: 0,
    spain: 0,
    time: new Date().toISOString()
  };

  let remaining = val;

  // STEP 1: cascade the deposit through each bucket in order,
  // filling each cap fully before spilling into the next
  for (let key of ORDER) {
    if (remaining <= 0) break;
    const capRemaining = Math.max(0, CAPS[key] - (totals[key] || 0));
    const take = Math.min(remaining, capRemaining);
    entry[key] = +take.toFixed(2);
    remaining -= take;
  }

  // STEP 2: anything left after every bucket is full goes to Spain
  entry.spain = +remaining.toFixed(2);

  tips.push(entry);
  localStorage.setItem("tips", JSON.stringify(tips));

  input.value = "";
  update();
}

/* ---------------- DELETE LAST ---------------- */

function deleteLast() {
  if (tips.length === 0) return;

  tips.pop();
  localStorage.setItem("tips", JSON.stringify(tips));
  update();
}

/* ---------------- UI ---------------- */

function update() {
  const total = tips.reduce((s, t) => s + t.amount, 0);

  let html = "";

  tips.slice().reverse().forEach(t => {
    html += `
      <div style="padding:10px;border-bottom:1px solid #eee;">
        <b>$${t.amount.toFixed(2)}</b><br/>
        <small>
          Insurance: $${t.insurance.toFixed(2)} |
          Taxes: $${t.tax.toFixed(2)} |
          Spending: $${t.spending.toFixed(2)} |
          Rent: $${t.rent.toFixed(2)} |
          IRA: $${t.ira.toFixed(2)} |
          Spain: $${t.spain.toFixed(2)}
        </small>
      </div>
    `;
  });

  document.getElementById("result").innerHTML = `
    <h2>Total: $${total.toFixed(2)}</h2>
    <hr/>
    ${html || "No entries yet"}
  `;

  renderProgress();
  renderSpainFlow();
}

/* ---------------- PROGRESS ---------------- */

function renderProgress() {
  const totals = getMonthTotals();

  let html = "";

  for (let key in CAPS) {
    const used = totals[key] || 0;
    const pct = Math.min(100, (used / CAPS[key]) * 100);

    let color = "black";
    if (pct > 80) color = "orange";
    if (pct > 95) color = "red";

    html += `
      <div style="margin-bottom:12px;">
        <strong>${key}</strong> $${used.toFixed(2)} / $${CAPS[key]}
        <div style="background:#eee;height:10px;border-radius:5px;">
          <div style="width:${pct}%;height:10px;background:${color};"></div>
        </div>
      </div>
    `;
  }

  html += `
    <div style="margin-top:16px;">
      <strong>Spain Fund</strong> $${(totals.spain || 0).toFixed(2)}
    </div>
  `;

  document.getElementById("progress").innerHTML = html;
}

/* ---------------- RESET ---------------- */

function bindReset() {
  const monthBtn = document.getElementById("resetMonth");
  const allBtn = document.getElementById("resetAll");

  if (monthBtn) {
    monthBtn.onclick = () => {
      const now = new Date();
      const m = now.getMonth();
      const y = now.getFullYear();

      tips = tips.filter(t => {
        const d = new Date(t.time);
        return !(d.getMonth() === m && d.getFullYear() === y);
      });

      localStorage.setItem("tips", JSON.stringify(tips));
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

/* ---------------- INIT ---------------- */

function init() {
  document.getElementById("saveBtn").onclick = addTip;
  document.getElementById("deleteLast").onclick = deleteLast;

  bindReset();
  update();
}

document.addEventListener("DOMContentLoaded", init);

function renderSpainFlow() {
  const el = document.getElementById("spainFlow");
  if (!el) return;

  const totals = getMonthTotals();

  const spain = totals.spain || 0;

  const html = `
    <div class="spain-glow"></div>

    <h3 style="margin:0 0 8px 0;">Spain Overflow</h3>

    <div style="font-size:14px; margin-bottom:6px; color:#aaa;">
      Unallocated: $${spain.toFixed(2)}
    </div>

    <div style="background:#222838; height:10px; border-radius:999px; overflow:hidden;">
      <div class="spain-flow-bar" style="width:${Math.min(100, spain)}%"></div>
    </div>
  `;

  el.innerHTML = html;
}

document.querySelectorAll(".category-chip").forEach(chip => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".category-chip")
      .forEach(c => c.classList.remove("active"));

    chip.classList.add("active");
  });
});

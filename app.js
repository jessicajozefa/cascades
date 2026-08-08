const CAPS = {
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
      totals.spain += t.spain;
    }
  });

  return totals;
}


/* ---------------- ADD TIP ---------------- */

```javascript
function addTip() {
  const input = document.getElementById("amount");
  const val = parseFloat(input.value);

  if (isNaN(val) || val <= 0) return;

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

  // How much each bucket still needs
  const available = {};

  for (let key in CAPS) {
    available[key] = Math.max(
      0,
      CAPS[key] - (totals[key] || 0)
    );
  }

  // Total still needed to fill all five buckets
  const totalNeeded = Object.values(available)
    .reduce((sum, amount) => sum + amount, 0);

  // Split this tip proportionally across all unfinished buckets
  if (totalNeeded > 0) {
    for (let key in available) {
      const share = available[key] / totalNeeded;

      entry[key] = Math.min(
        available[key],
        +(val * share).toFixed(2)
      );
    }
  }

  // Add up the five bucket amounts
  let allocated =
    entry.insurance +
    entry.tax +
    entry.spending +
    entry.rent +
    entry.ira;

  // Find any rounding difference
  let difference = +(val - allocated).toFixed(2);

  // Put a rounding penny into IRA instead of Spain
  if (difference !== 0 && totalNeeded > 0) {
    const newIra = +(entry.ira + difference).toFixed(2);

    if (
      newIra >= 0 &&
      newIra <= available.ira
    ) {
      entry.ira = newIra;
    }
  }

  // Recalculate after the rounding adjustment
  allocated =
    entry.insurance +
    entry.tax +
    entry.spending +
    entry.rent +
    entry.ira;

  // Spain only gets genuine money left over
  entry.spain = Math.max(
    0,
    +(val - allocated).toFixed(2)
  );

  tips.push(entry);

  localStorage.setItem(
    "tips",
    JSON.stringify(tips)
  );

  input.value = "";

  update();
}
```



  let remainingGoals = {};

  for (let key in CAPS) {
    remainingGoals[key] = Math.max(
      0,
      CAPS[key] - totals[key]
    );
  }


  let totalNeeded = Object.values(remainingGoals)
    .reduce((a, b) => a + b, 0);


  let allocated = 0;


  if (totalNeeded > 0) {

    for (let key in remainingGoals) {

      let amount = val *
        (remainingGoals[key] / totalNeeded);


      amount = Math.min(
        amount,
        remainingGoals[key]
      );


      entry[key] = +amount.toFixed(2);
      allocated += entry[key];
    }
  }


  entry.spain = +(val - allocated).toFixed(2);


  tips.push(entry);

  localStorage.setItem(
    "tips",
    JSON.stringify(tips)
  );


  input.value = "";

  update();
}


/* ---------------- DELETE LAST ---------------- */

function deleteLast() {

  if (tips.length === 0) return;

  tips.pop();

  localStorage.setItem(
    "tips",
    JSON.stringify(tips)
  );

  update();
}


/* ---------------- DISPLAY ---------------- */

function update() {

  const total = tips.reduce(
    (sum, t) => sum + t.amount,
    0
  );


  let html = "";


  tips.slice().reverse().forEach(t => {

    html += `
      <div style="padding:10px;border-bottom:1px solid #eee;">
        <b>$${t.amount.toFixed(2)}</b><br>

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


/* ---------------- PROGRESS ---------------- */

function renderProgress() {

  const totals = getMonthTotals();

  let html = "";


  for (let key in CAPS) {

    const used = totals[key];

    const pct = Math.min(
      100,
      (used / CAPS[key]) * 100
    );


    html += `
      <div style="margin-bottom:12px;">

        <strong>${key}</strong>
        $${used.toFixed(2)}
        /
        $${CAPS[key]}

        <div style="
          background:#eee;
          height:10px;
          border-radius:5px;
        ">

          <div style="
            width:${pct}%;
            height:10px;
            background:#4caf50;
            border-radius:5px;
          ">
          </div>

        </div>

      </div>
    `;
  }


  html += `
    <div>
      <strong>Spain Fund</strong>
      $${totals.spain.toFixed(2)}
    </div>
  `;


  const progress = document.getElementById("progress");

  if (progress) {
    progress.innerHTML = html;
  }
}


/* ---------------- SPAIN FLOW ---------------- */

function renderSpainFlow() {

  const el = document.getElementById("spainFlow");

  if (!el) return;


  const totals = getMonthTotals();


  el.innerHTML = `

    <h3>Spain Overflow</h3>

    <div>
      Unallocated:
      $${totals.spain.toFixed(2)}
    </div>

    <div style="
      background:#222;
      height:10px;
      border-radius:10px;
      margin-top:8px;
    ">

      <div style="
        width:${Math.min(totals.spain,100)}%;
        height:10px;
        background:#4caf50;
        border-radius:10px;
      "></div>

    </div>
  `;
}


/* ---------------- RESET ---------------- */

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


/* ---------------- START ---------------- */

function init() {

  const save =
    document.getElementById("saveBtn");

  const sticky =
    document.getElementById("stickySaveBtn");


  if (save) save.onclick = addTip;

  if (sticky) sticky.onclick = addTip;


  const del =
    document.getElementById("deleteLast");

  if (del) del.onclick = deleteLast;


  bindReset();

  update();
}


document.addEventListener(
  "DOMContentLoaded",
  init
);

```javascript
const CAPS = {
  insurance: 622,
  tax: 600,
  spending: 1600,
  rent: 1600,
  ira: 200
};


/* ---------------- LOAD SAVED TIPS ---------------- */

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

    if (
      d.getMonth() === m &&
      d.getFullYear() === y
    ) {
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


/* ---------------- ADD TIP ---------------- */

function addTip() {
  const input = document.getElementById("amount");
  const val = parseFloat(input.value);

  if (isNaN(val) || val <= 0) return;

  const totals = getMonthTotals();

  const entry = {
    amount: +val.toFixed(2),
    insurance: 0,
    tax: 0,
    spending: 0,
    rent: 0,
    ira: 0,
    spain: 0,
    time: new Date().toISOString()
  };


  /*
    Work in cents.

    This prevents rounding problems such as:
    $224.00 becoming $223.99 and sending $0.01
    to Spain.
  */

  const tipCents = Math.round(val * 100);

  const available = {};

  for (const key in CAPS) {
    const capCents = Math.round(CAPS[key] * 100);
    const usedCents = Math.round((totals[key] || 0) * 100);

    available[key] = Math.max(
      0,
      capCents - usedCents
    );
  }


  const totalNeededCents = Object.values(available)
    .reduce((sum, amount) => sum + amount, 0);


  /*
    We can only allocate as much as the five buckets
    still need. Anything beyond that goes to Spain.
  */

  const amountToBuckets = Math.min(
    tipCents,
    totalNeededCents
  );


  if (amountToBuckets > 0) {

    const rawShares = {};
    const allocatedCents = {};

    let allocated = 0;


    /*
      First give each bucket its proportional whole cents.
    */

    for (const key in available) {

      if (available[key] <= 0) {
        rawShares[key] = 0;
        allocatedCents[key] = 0;
        continue;
      }

      const raw =
        amountToBuckets *
        (available[key] / totalNeededCents);

      rawShares[key] = raw;

      const base = Math.min(
        available[key],
        Math.floor(raw)
      );

      allocatedCents[key] = base;
      allocated += base;
    }


    /*
      There may be a few leftover pennies because of rounding.
      Give those pennies to the buckets with the largest
      fractional remainder.
    */

    let penniesLeft =
      amountToBuckets - allocated;


    const keysByRemainder = Object.keys(available)
      .sort((a, b) => {

        const remainderA =
          rawShares[a] -
          Math.floor(rawShares[a] || 0);

        const remainderB =
          rawShares[b] -
          Math.floor(rawShares[b] || 0);

        return remainderB - remainderA;
      });


    while (penniesLeft > 0) {

      let gavePenny = false;

      for (const key of keysByRemainder) {

        if (
          allocatedCents[key] <
          available[key]
        ) {
          allocatedCents[key]++;
          penniesLeft--;
          gavePenny = true;

          if (penniesLeft <= 0) break;
        }
      }

      if (!gavePenny) break;
    }


    /*
      Convert cents back into dollars.
    */

    for (const key in allocatedCents) {
      entry[key] =
        allocatedCents[key] / 100;
    }
  }


  /*
    Anything genuinely beyond the remaining
    five bucket goals goes to Spain.
  */

  const allocatedToBuckets =
    entry.insurance +
    entry.tax +
    entry.spending +
    entry.rent +
    entry.ira;


  entry.spain = Math.max(
    0,
    +(val - allocatedToBuckets).toFixed(2)
  );


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


  const result =
    document.getElementById("result");

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


  for (const key in CAPS) {

    const used =
      Number(totals[key]) || 0;

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
        $${used.toFixed(2)}
        /
        $${CAPS[key].toFixed(2)}

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
  }


  html += `
    <div style="margin-top:16px;">
      <strong>Spain Fund</strong>
      $${totals.spain.toFixed(2)}
    </div>
  `;


  const progress =
    document.getElementById("progress");

  if (progress) {
    progress.innerHTML = html;
  }
}


/* ---------------- SPAIN FLOW ---------------- */

function renderSpainFlow() {

  const el =
    document.getElementById("spainFlow");

  if (!el) return;


  const totals = getMonthTotals();

  const spain =
    Math.max(0, totals.spain || 0);


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


/* ---------------- RESET ---------------- */

function bindReset() {

  const monthBtn =
    document.getElementById("resetMonth");

  const allBtn =
    document.getElementById("resetAll");


  if (monthBtn) {

    monthBtn.onclick = () => {

      const now = new Date();

      const m = now.getMonth();
      const y = now.getFullYear();


      tips = tips.filter(t => {

        const d = new Date(t.time);

        return !(
          d.getMonth() === m &&
          d.getFullYear() === y
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


/* ---------------- START APP ---------------- */

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
```

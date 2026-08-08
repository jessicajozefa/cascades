const CAPS = {
  insurance: 622,
  tax: 600,
  spending: 1600,
  rent: 1600,
  ira: 200
};

let tips = JSON.parse(localStorage.getItem("tips") || "[]").map(function(t) {
  return {
    amount: Number(t.amount) || 0,
    insurance: Number(t.insurance) || 0,
    tax: Number(t.tax) || 0,
    spending: Number(t.spending) || 0,
    rent: Number(t.rent) || 0,
    ira: Number(t.ira) || 0,
    spain: Number(t.spain) || 0,
    time: t.time || new Date().toISOString()
  };
});


/* ---------------- MONTH TOTALS ---------------- */

function getMonthTotals() {
  var now = new Date();
  var m = now.getMonth();
  var y = now.getFullYear();

  var totals = {
    insurance: 0,
    tax: 0,
    spending: 0,
    rent: 0,
    ira: 0,
    spain: 0
  };

  tips.forEach(function(t) {
    var d = new Date(t.time);

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


/* ---------------- ADD TIP ---------------- */

function addTip() {
  var input = document.getElementById("amount");

  if (!input) return;

  var val = parseFloat(input.value);

  if (!Number.isFinite(val) || val <= 0) {
    return;
  }

  var totals = getMonthTotals();

  var entry = {
    amount: Math.round(val * 100) / 100,
    insurance: 0,
    tax: 0,
    spending: 0,
    rent: 0,
    ira: 0,
    spain: 0,
    time: new Date().toISOString()
  };

  /* Work entirely in cents */
  var tipCents = Math.round(val * 100);

  var available = {};

  Object.keys(CAPS).forEach(function(key) {
    var capCents = Math.round(CAPS[key] * 100);
    var usedCents = Math.round((totals[key] || 0) * 100);

    available[key] = Math.max(
      0,
      capCents - usedCents
    );
  });

  var totalNeeded = Object.keys(available).reduce(
    function(sum, key) {
      return sum + available[key];
    },
    0
  );

  /* Amount that belongs in the five buckets */
  var bucketCents = Math.min(
    tipCents,
    totalNeeded
  );

  if (bucketCents > 0 && totalNeeded > 0) {

    var raw = {};
    var allocated = {};
    var used = 0;

    Object.keys(CAPS).forEach(function(key) {

      if (available[key] <= 0) {
        raw[key] = 0;
        allocated[key] = 0;
        return;
      }

      raw[key] =
        bucketCents *
        available[key] /
        totalNeeded;

      allocated[key] = Math.floor(raw[key]);

      allocated[key] = Math.min(
        allocated[key],
        available[key]
      );

      used += allocated[key];
    });

    /* Distribute leftover pennies */
    var penniesLeft = bucketCents - used;

    var order = Object.keys(CAPS).sort(
      function(a, b) {

        var remainderA =
          raw[a] - Math.floor(raw[a]);

        var remainderB =
          raw[b] - Math.floor(raw[b]);

        return remainderB - remainderA;
      }
    );

    while (penniesLeft > 0) {

      var gavePenny = false;

      for (var i = 0; i < order.length; i++) {

        var key = order[i];

        if (allocated[key] < available[key]) {
          allocated[key]++;
          penniesLeft--;
          gavePenny = true;

          if (penniesLeft === 0) {
            break;
          }
        }
      }

      if (!gavePenny) {
        break;
      }
    }

    Object.keys(CAPS).forEach(function(key) {
      entry[key] = allocated[key] / 100;
    });
  }

  /* Calculate Spain from actual cents */
  var usedByBuckets =
    Math.round(entry.insurance * 100) +
    Math.round(entry.tax * 100) +
    Math.round(entry.spending * 100) +
    Math.round(entry.rent * 100) +
    Math.round(entry.ira * 100);

  var spainCents = Math.max(
    0,
    tipCents - usedByBuckets
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


/* ---------------- DELETE LAST ---------------- */

function deleteLast() {

  if (tips.length === 0) {
    return;
  }

  tips.pop();

  localStorage.setItem(
    "tips",
    JSON.stringify(tips)
  );

  update();
}


/* ---------------- DISPLAY ---------------- */

function update() {

  var total = tips.reduce(
    function(sum, t) {
      return sum + (Number(t.amount) || 0);
    },
    0
  );

  var html = "";

  tips.slice().reverse().forEach(function(t) {

    html +=
      '<div style="padding:10px;border-bottom:1px solid #eee;">' +
      '<b>$' + (Number(t.amount) || 0).toFixed(2) + '</b><br>' +
      '<small>' +
      'Insurance: $' + (Number(t.insurance) || 0).toFixed(2) + ' | ' +
      'Taxes: $' + (Number(t.tax) || 0).toFixed(2) + ' | ' +
      'Spending: $' + (Number(t.spending) || 0).toFixed(2) + ' | ' +
      'Rent: $' + (Number(t.rent) || 0).toFixed(2) + ' | ' +
      'IRA: $' + (Number(t.ira) || 0).toFixed(2) + ' | ' +
      'Spain: $' + (Number(t.spain) || 0).toFixed(2) +
      '</small>' +
      '</div>';
  });

  var result = document.getElementById("result");

  if (result) {

    result.innerHTML =
      '<h2>Total: $' + total.toFixed(2) + '</h2>' +
      '<hr>' +
      (html || "No entries yet");
  }

  renderProgress();
  renderSpainFlow();
}


/* ---------------- PROGRESS ---------------- */

function renderProgress() {

  var totals = getMonthTotals();

  var html = "";

  Object.keys(CAPS).forEach(function(key) {

    var used = Number(totals[key]) || 0;

    var pct = Math.min(
      100,
      (used / CAPS[key]) * 100
    );

    var color = "#4caf50";

    if (pct > 95) {
      color = "#e53935";
    } else if (pct > 80) {
      color = "#ff9800";
    }

    html +=
      '<div style="margin-bottom:12px;">' +

      '<strong>' +
      key +
      '</strong> $' +
      used.toFixed(2) +
      ' / $' +
      CAPS[key].toFixed(2) +

      '<div style="background:#eee;height:10px;border-radius:5px;overflow:hidden;">' +

      '<div style="width:' +
      pct +
      '%;height:10px;background:' +
      color +
      ';border-radius:5px;"></div>' +

      '</div>' +

      '</div>';
  });

  html +=
    '<div style="margin-top:16px;">' +
    '<strong>Spain Fund</strong> $' +
    totals.spain.toFixed(2) +
    '</div>';

  var progress =
    document.getElementById("progress");

  if (progress) {
    progress.innerHTML = html;
  }
}


/* ---------------- SPAIN FLOW ---------------- */

function renderSpainFlow() {

  var el =
    document.getElementById("spainFlow");

  if (!el) {
    return;
  }

  var totals = getMonthTotals();

  var spain =
    Math.max(0, totals.spain || 0);

  el.innerHTML =
    '<h3 style="margin:0 0 8px 0;">Spain Overflow</h3>' +

    '<div style="font-size:14px;margin-bottom:6px;color:#aaa;">' +
    'Unallocated: $' +
    spain.toFixed(2) +
    '</div>' +

    '<div style="background:#222838;height:10px;border-radius:999px;overflow:hidden;">' +

    '<div class="spain-flow-bar" style="width:' +
    Math.min(100, spain) +
    '%;height:10px;"></div>' +

    '</div>';
}


/* ---------------- RESET ---------------- */

function bindReset() {

  var monthBtn =
    document.getElementById("resetMonth");

  var allBtn =
    document.getElementById("resetAll");


  if (monthBtn) {

    monthBtn.onclick = function() {

      var now = new Date();

      tips = tips.filter(function(t) {

        var d = new Date(t.time);

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

    allBtn.onclick = function() {

      tips = [];

      localStorage.removeItem("tips");

      update();
    };
  }
}


/* ---------------- START ---------------- */

function init() {

  var save =
    document.getElementById("saveBtn");

  var sticky =
    document.getElementById("stickySaveBtn");

  var del =
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

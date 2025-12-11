function generateCalendar(){
    const wrapper = document.getElementById("calWrapper");
    wrapper.innerHTML = "";

    const dateValue = document.getElementById("myDate").value;
    const today = dateValue ? new Date(dateValue) : new Date();

    let month = today.getMonth();
    let day = today.getDate() - 1;
    let year = today.getFullYear();
    let firstDay = new Date(year, month, 1);

    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

    function displayDate(){
        const holder = document.getElementById("dateHolder");
        holder.innerText = `${months[month]} ${year}`;
    }

    function createDayHeaders(){
        const row = document.createElement("tr");
        for (let i = 0; i < days.length; i++) {
            const el = document.createElement("th");
            el.className = "dayHeader";
            el.innerText = days[i];
            row.appendChild(el);
        }
        wrapper.appendChild(row);
    }

    function createDayCells() {
        const dayOne = firstDay.getDay();
        const lastDay = new Date(year, month + 1, 0).getDate();
        let iDay = 0;

        while (iDay < lastDay) {
            const row = document.createElement("tr");
            for (let i = 0; i < days.length; i++) {
                const el = document.createElement("td");

                if (dayOne === i || iDay > 0){
                    el.className = (day === iDay) ? "dayCell today" : "dayCell";
                    if (iDay < lastDay) iDay++;
                    else break;
                    el.innerText = iDay;

                    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(iDay).padStart(2, '0')}`;
                    if (localStorage.getItem(dateKey)) {
                        el.classList.add("filled-day"); // mark as filled
                    }
                }
                row.appendChild(el);
            }
            wrapper.appendChild(row);
        }
    }

    displayDate();
    createDayHeaders();
    createDayCells();
}

window.addEventListener("load", generateCalendar);

document.getElementById("myDate").addEventListener("change", generateCalendar);

document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("transaksiContainer");
    const form = document.getElementById("transaksiForm");
    const dateInput = document.getElementById("myDate");

    function buildTable(data) {
        container.innerHTML = "";
        const title = document.createElement("p");

        const table = document.createElement("table");
        table.className = "transaksi-table";
        const headers = ["Jenis", "Kategori", "Jumlah", "Status"];
        const headerRow = document.createElement("tr");

        headers.forEach(h => {
            const th = document.createElement("th");
            th.textContent = h;
            headerRow.appendChild(th);
        });
        table.appendChild(headerRow);

        data.forEach((row, rowIndex) => {
            const tr = document.createElement("tr");
            headers.forEach(key => {
                const td = document.createElement("td");
                td.classList.add("editable");
                td.textContent = row[key.toLowerCase()];
                td.addEventListener("click", () => editCell(td, key.toLowerCase(), rowIndex));
                tr.appendChild(td);
            });

            const deleteTd = document.createElement("td");
            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "delete";
            deleteBtn.className = "delete-btn";
            deleteBtn.addEventListener("click", () => deleteRow(rowIndex));
            deleteTd.appendChild(deleteBtn);
            tr.appendChild(deleteTd);

            table.appendChild(tr);
        });

        container.appendChild(table);
    }

    function editCell(td, key, rowIndex){
        const input = document.createElement("input");
        input.value = td.textContent;
        td.textContent = "";
        td.appendChild(input);
        input.focus();
        input.addEventListener("blur", () => {
            const newValue = input.value.trim();
            td.textContent = newValue;
            updateJSON(rowIndex, key, newValue);
            });
    }

    function deleteRow(index) {
        const date = dateInput.value;
        const data = loadJSON(date);

        if (confirm("Yakin ingin menghapus transaksi ini?")) {
            data.splice(index, 1);
            saveJSON(date, data);
            buildTable(data);
            }
    }

    function loadJSON(date){
        const stored = localStorage.getItem(date);
        return stored ? JSON.parse(stored) : [];
    }

    function saveJSON(date, data){
      localStorage.setItem(date, JSON.stringify(data));
    }

    form.addEventListener("submit", e => {
        e.preventDefault();
        const date = dateInput.value;
        if (!date){
            alert("Pilih tanggal dulu!");
            return;
        }

        const data = loadJSON(date);
        const newTransaksi = {
            jenis: form.jenis.value,
            kategori: form.kategori.value,
            jumlah: form.jumlah.value,
            status: form.status.value
        };

        data.push(newTransaksi);
        saveJSON(date, data);
        buildTable(data);
        form.reset();
    });

    function updateJSON(rowIndex, key, value){
        const date = dateInput.value;
        const data = loadJSON(date);
        if (data[rowIndex]){
            data[rowIndex][key] = value;
            saveJSON(date, data);
        }
    }

    dateInput.addEventListener("change", () => {
        const date = dateInput.value;
        const data = loadJSON(date);
        buildTable(data);
    });


    const today = new Date().toISOString().split("T")[0];
    dateInput.value = today;
    buildTable(loadJSON(today));
});

function formatRupiah(angka) {
  return "Rp. " + angka.toLocaleString("id-ID", { minimumFractionDigits: 2 });
}

function updateUniversalTotal() {
  const totalDisplay = document.getElementById("jumlahTotal");
  if (!totalDisplay) return;

  let total = 0;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);

    if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
      const data = JSON.parse(localStorage.getItem(key)) || [];

      data.forEach(trx => {
        const jumlah = parseFloat(trx.jumlah) || 0;
        const jenis = trx.jenis?.toLowerCase() || "";
        const status = trx.status?.toLowerCase() || "";

        // hanya hitung kalau status lunas
        if (status === "lunas") {
          if (jenis === "pemasukan") total += jumlah;
          else if (jenis === "pengeluaran") total -= jumlah;
        }
      });
    }
  }

  totalDisplay.textContent = formatRupiah(total);
}

document.addEventListener("DOMContentLoaded", updateUniversalTotal);

window.addEventListener("storage", updateUniversalTotal);

setInterval(updateUniversalTotal, 2000);

let pengeluaranChart;

function updatePengeluaranChart() {
  const kategoriTotal = {};

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);

    if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
      const data = JSON.parse(localStorage.getItem(key)) || [];

      data.forEach(trx => {
        const jumlah = parseFloat(trx.jumlah) || 0;
        const jenis = trx.jenis?.toLowerCase() || "";
        const kategori = trx.kategori || "Lainnya";
        const status = trx.status?.toLowerCase() || "";

        if (jenis === "pengeluaran" && status === "lunas") {
          if (!kategoriTotal[kategori]) kategoriTotal[kategori] = 0;
          kategoriTotal[kategori] += jumlah;
        }
      });
    }
  }

  const labels = Object.keys(kategoriTotal);
  const values = Object.values(kategoriTotal);

  const ctx = document.getElementById("pengeluaranChart").getContext("2d");

  if (pengeluaranChart) pengeluaranChart.destroy();

  pengeluaranChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: [
          "#ff6384", "#36a2eb", "#ffce56", "#4bc0c0", "#9966ff", "#ff9f40"
        ],
        borderWidth: 1,
      }]
    },
    options: {
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: "#333", font: { size: 14 } }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || '';
              const value = context.parsed || 0;
              return `${label}: Rp ${value.toLocaleString("id-ID")}`;
            }
          }
        }
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", updatePengeluaranChart);
window.addEventListener("storage", updatePengeluaranChart);


const btn1 = document.getElementById("subscriptionBtn");
const btn2 = document.getElementById("profileBtn");
const subDis1 = document.getElementById("subBlurs");
const subDis2 = document.getElementById("subCons");
const subClos = document.getElementById("subClos");

btn1.addEventListener("mouseover", () => {
    btn1.style.backgroundColor = "rgb(159, 0, 0)";
});

btn1.addEventListener("mouseout", () => {
    btn1.style.backgroundColor = "";
});

btn1.addEventListener("click", () =>{
    subDis1.style.display = "flex";
    subDis2.style.display = "flex";
});

subClos.addEventListener("click", () =>{
    subDis1.style.display = "none";
    subDis2.style.display = "none";
});

btn2.addEventListener("mouseover", () => {
    btn2.style.backgroundColor = "rgb(0, 0, 159)";
});

btn2.addEventListener("mouseout", () => {
    btn2.style.backgroundColor = "";
});

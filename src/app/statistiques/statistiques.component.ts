import { Component, OnInit } from '@angular/core';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-statistiques',
  templateUrl: './statistiques.component.html',
  styleUrls: ['./statistiques.component.css']
})
export class StatistiquesComponent implements OnInit {
  apiBase = 'http://localhost:8080/api';

  selectedPays: string | null = null;
  selectedMaladie: string | null = null;
  selectedType: string = 'nouveau_mort';

  chart: any;
  topChart: any;
  compareChart: any;

  currentLabels: string[] = [];
  currentValues: number[] = [];

  async ngOnInit() {
    await this.loadPays();
    await this.loadMaladies();
    await this.loadData();

    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.exportToCSV(this.currentLabels, this.currentValues);
      });
    }

    const typeSelect = document.getElementById('type-select') as HTMLSelectElement;
    if (typeSelect) {
      typeSelect.addEventListener('change', (e) => {
        this.selectedType = (e.target as HTMLSelectElement).value;
        this.loadData();
      });
    }
  }

  async loadPays() {
    const res = await fetch(`${this.apiBase}/pays`);
    const paysList = await res.json();

    const select = document.getElementById('pays-select') as HTMLSelectElement;
    select.innerHTML = '';
    paysList.forEach((p: any) => {
      const option = document.createElement('option');
      option.value = p.id_pays;
      option.textContent = p.nom_pays;
      select.appendChild(option);
    });

    this.selectedPays = paysList[0].id_pays;

    select.addEventListener('change', (e) => {
      this.selectedPays = (e.target as HTMLSelectElement).value;
      this.loadData();
    });
  }

  async loadMaladies() {
    const res = await fetch(`${this.apiBase}/maladies`);
    const maladieList = await res.json();

    const select = document.getElementById('maladie-select') as HTMLSelectElement;
    select.innerHTML = '';
    maladieList.forEach((m: any) => {
      const option = document.createElement('option');
      option.value = m.id_maladie;
      option.textContent = m.nom_maladie;
      select.appendChild(option);
    });

    this.selectedMaladie = maladieList[0].id_maladie;

    select.addEventListener('change', (e) => {
      this.selectedMaladie = (e.target as HTMLSelectElement).value;
      this.loadData();
    });

    if (this.selectedMaladie) {
      await this.loadTopPaysChart(this.selectedMaladie);
    }
  }

  truncateTrailingZeros(data: any[]): any[] {
    let lastNonZero = data.length - 1;
    while (lastNonZero >= 0 && data[lastNonZero].valeur === 0) {
      lastNonZero--;
    }
    return data.slice(0, lastNonZero + 1);
  }

  async loadData() {
    if (!this.selectedPays || !this.selectedMaladie || !this.selectedType) return;

    const res = await fetch(`${this.apiBase}/statistiques/donnees-par-jour?paysId=${this.selectedPays}&maladieId=${this.selectedMaladie}&type=${this.selectedType}`);
    const rawData = await res.json();
    const data = this.truncateTrailingZeros(rawData);

    this.currentLabels = data.map(d => d.date);
    this.currentValues = data.map(d => d.valeur);

    if (this.chart) this.chart.destroy();

    this.chart = new Chart(document.getElementById('mortChart') as HTMLCanvasElement, {
      type: 'line',
      data: {
        labels: this.currentLabels,
        datasets: [{
          label: `Données : ${this.selectedType.replaceAll('_', ' ')}`,
          data: this.currentValues,
          borderWidth: 2,
          borderColor: 'blue',
          backgroundColor: 'rgba(0,0,255,0.2)',
          fill: true,
          pointRadius: 2
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: { title: { display: true, text: 'Date' } },
          y: { title: { display: true, text: this.selectedType } }
        }
      }
    });

    await this.loadComparisonChart();
    await this.loadTopPaysChart(this.selectedMaladie);
  }

  async loadComparisonChart() {
    if (!this.selectedPays || !this.selectedMaladie) return;

    const res = await fetch(`${this.apiBase}/statistiques/donnees-par-jour?paysId=${this.selectedPays}&maladieId=${this.selectedMaladie}&type=total_mort`);
    const mortsData = await res.json();

    const res2 = await fetch(`${this.apiBase}/statistiques/donnees-par-jour?paysId=${this.selectedPays}&maladieId=${this.selectedMaladie}&type=total_cas`);
    const casData = await res2.json();

    const mortsClean = this.truncateTrailingZeros(mortsData);
    const casClean = this.truncateTrailingZeros(casData);

    const labels = mortsClean.map(d => d.date);
    const valeursMorts = mortsClean.map(d => d.valeur);
    const valeursCas = casClean.map(d => d.valeur);

    const pourcentages = valeursMorts.map((mort: number, i: number) => {
      const cas = valeursCas[i];
      return (cas && cas > 0) ? ((mort / cas) * 100).toFixed(2) : 0;
    });

    if (this.compareChart) this.compareChart.destroy();

    this.compareChart = new Chart(document.getElementById('compareChart') as HTMLCanvasElement, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Total morts',
            data: valeursMorts,
            borderColor: 'red',
            backgroundColor: 'rgba(255,0,0,0.1)',
            fill: false,
            tension: 0.1,
            pointStyle: 'rect',
            yAxisID: 'y'
          },
          {
            label: 'Total cas',
            data: valeursCas,
            borderColor: 'green',
            backgroundColor: 'rgba(0,255,0,0.1)',
            fill: false,
            tension: 0.1,
            pointStyle: 'circle',
            yAxisID: 'y'
          },
          {
            label: 'Taux de létalité (%)',
            data: pourcentages,
            borderColor: 'black',
            borderDash: [5, 5],
            backgroundColor: 'rgba(0,0,0,0.05)',
            fill: false,
            tension: 0.1,
            pointStyle: 'cross',
            yAxisID: 'y2'
          }
        ]
      },
      options: {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          tooltip: {
            usePointStyle: true,
            callbacks: {
              labelPointStyle: function(this: any, context: any) {
                return {
                  pointStyle: 'circle', // ✅ une valeur définie (et autorisée)
                  rotation: 0
                };
              }
            }
          }
        },
        scales: {
          x: { title: { display: true, text: 'Date' }},
          y: {
            type: 'linear',
            position: 'left',
            title: { display: true, text: 'Valeurs cumulées' }
          },
          y2: {
            type: 'linear',
            position: 'right',
            title: { display: true, text: 'Taux de létalité (%)' },
            grid: { drawOnChartArea: false },
            min: 0,
            max: 100
          }
        }
      }
    });
  }

  async loadTopPaysChart(maladieId: string) {
    const res = await fetch(`${this.apiBase}/statistiques/top-pays-morts?maladieId=${maladieId}`);
    const data = await res.json();

    const labels = data.map((d: any) => d.pays);
    const valeurs = data.map((d: any) => d.total);

    if (this.topChart) this.topChart.destroy();

    this.topChart = new Chart(document.getElementById('topPaysChart') as HTMLCanvasElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Total des morts',
          data: valeurs,
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgb(255, 99, 132)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        indexAxis: 'y',
        scales: {
          x: { title: { display: true, text: 'Nombre de morts' }},
          y: { title: { display: true, text: 'Pays' }}
        }
      }
    });
  }

  exportToCSV(labels: string[], values: number[]) {
    let csv = 'Date,Valeur\n';
    for (let i = 0; i < labels.length; i++) {
      csv += `${labels[i]},${values[i]}\n`;
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `statistiques_${this.selectedType}_${this.selectedPays}_${this.selectedMaladie}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

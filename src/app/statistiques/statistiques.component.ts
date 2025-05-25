import { Component, OnInit } from '@angular/core';
import Chart from 'chart.js/auto';

interface DonneesPredictives {
  id_maladie: string;
  id_region: string;
  date: string;
  nouveau_cas: number;
  total_cas: number;
  nouveau_mort: number;
  total_mort: number;
  source: string;
  nom_region: string;
  nom_maladie: string;
}

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
  importMessage: string = '';

  predictiveData: DonneesPredictives[] = [];
  selectedRegion: string = '';
  selectedPredictiveMaladie: string = '';
  availableRegions: string[] = [];
  availableMaladies: string[] = [];

  chart: any;
  compareChart: any;
  chartCas: any;
  chartMorts: any;
  predictiveChart: any;

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

    const filteredPays = paysList.filter((p: any) => p.nom_pays !== 'Inconnue');

    filteredPays.forEach((p: any) => {
      const option = document.createElement('option');
      option.value = p.id_pays;
      option.textContent = p.nom_pays;
      select.appendChild(option);
    });

    if (filteredPays.length > 0) {
      this.selectedPays = filteredPays[0].id_pays;
    }

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

    const filteredMaladies = maladieList.filter((m: any) => m.nom_maladie !== 'Inconnue');

    filteredMaladies.forEach((m: any) => {
      const option = document.createElement('option');
      option.value = m.id_maladie;
      option.textContent = m.nom_maladie;
      select.appendChild(option);
    });

    if (filteredMaladies.length > 0) {
      this.selectedMaladie = filteredMaladies[0].id_maladie;
    }

    select.addEventListener('change', (e) => {
      this.selectedMaladie = (e.target as HTMLSelectElement).value;
      this.loadData();
    });
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
          x: { title: { display: true, text: 'Date' }},
          y: { title: { display: true, text: this.selectedType }}
        }
      }
    });

    await this.loadComparisonChart();
    await this.loadCasCharts();
    await this.loadMortsCharts();
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
              labelPointStyle: function (this: any, context: any) {
                return {
                  pointStyle: 'circle',
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

  async loadCasCharts() {
    if (!this.selectedPays || !this.selectedMaladie) return;

    const resTotal = await fetch(`${this.apiBase}/statistiques/donnees-par-jour?paysId=${this.selectedPays}&maladieId=${this.selectedMaladie}&type=total_cas`);
    const totalCasData = await resTotal.json();

    const resNouveau = await fetch(`${this.apiBase}/statistiques/donnees-par-jour?paysId=${this.selectedPays}&maladieId=${this.selectedMaladie}&type=nouveau_cas`);
    const nouveauCasData = await resNouveau.json();

    const labels = totalCasData.map((d: any) => d.date);
    const totalCas = totalCasData.map((d: any) => d.valeur);
    const nouveauCas = nouveauCasData.map((d: any) => d.valeur);

    const { labels: cleanLabels, cleanedDatasets } = this.cleanMultipleDatasets(labels, [totalCas, nouveauCas]);
    const [cleanTotalCas, cleanNouveauCas] = cleanedDatasets;

    if (this.chartCas) this.chartCas.destroy();

    this.chartCas = new Chart(document.getElementById('casChart') as HTMLCanvasElement, {
      type: 'line',
      data: {
        labels: cleanLabels,
        datasets: [
          {
            label: 'Total cas',
            data: cleanTotalCas,
            borderColor: 'blue',
            backgroundColor: 'rgba(0,0,255,0.1)',
            fill: true,
            tension: 0.3
          },
          {
            label: 'Nouveaux cas',
            data: cleanNouveauCas,
            borderColor: 'green',
            backgroundColor: 'rgba(0,255,0,0.1)',
            fill: true,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          x: { title: { display: true, text: 'Date' }},
          y: { title: { display: true, text: 'Nombre de cas' }}
        }
      }
    });
  }


  async loadMortsCharts() {
    if (!this.selectedPays || !this.selectedMaladie) return;

    const resTotal = await fetch(`${this.apiBase}/statistiques/donnees-par-jour?paysId=${this.selectedPays}&maladieId=${this.selectedMaladie}&type=total_mort`);
    const totalMortsData = await resTotal.json();

    const resNouveau = await fetch(`${this.apiBase}/statistiques/donnees-par-jour?paysId=${this.selectedPays}&maladieId=${this.selectedMaladie}&type=nouveau_mort`);
    const nouveauMortsData = await resNouveau.json();

    const labels = totalMortsData.map((d: any) => d.date);
    const totalMorts = totalMortsData.map((d: any) => d.valeur);
    const nouveauMorts = nouveauMortsData.map((d: any) => d.valeur);

    const { labels: cleanLabels, cleanedDatasets } = this.cleanMultipleDatasets(labels, [totalMorts, nouveauMorts]);
    const [cleanTotalMorts, cleanNouveauMorts] = cleanedDatasets;

    if (this.chartMorts) this.chartMorts.destroy();

    this.chartMorts = new Chart(document.getElementById('mortsChart') as HTMLCanvasElement, {
      type: 'line',
      data: {
        labels: cleanLabels,
        datasets: [
          {
            label: 'Total morts',
            data: cleanTotalMorts,
            borderColor: 'red',
            backgroundColor: 'rgba(255,0,0,0.1)',
            fill: true,
            tension: 0.3
          },
          {
            label: 'Nouveaux morts',
            data: cleanNouveauMorts,
            borderColor: 'black',
            backgroundColor: 'rgba(0,0,0,0.1)',
            fill: true,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          x: { title: { display: true, text: 'Date' }},
          y: { title: { display: true, text: 'Nombre de morts' }}
        }
      }
    });
  }

  cleanMultipleDatasets(labels: string[], datasets: number[][]): { labels: string[], cleanedDatasets: number[][] } {
    const cleanedLabels: string[] = [];
    const cleanedData: number[][] = datasets.map(() => []);

    for (let i = 0; i < labels.length; i++) {
      const hasNonZero = datasets.some(ds => ds[i] !== 0);
      if (hasNonZero) {
        cleanedLabels.push(labels[i]);
        datasets.forEach((ds, idx) => {
          cleanedData[idx].push(ds[i]);
        });
      }
    }
    return { labels: cleanedLabels, cleanedDatasets: cleanedData };
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

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        this.processCSV(text);
      };
      reader.readAsText(file);
    }
  }

  processCSV(csvText: string) {
    const lines = csvText.split('\n');
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());

    const requiredHeaders = [
      'id_maladie', 'id_region', 'date', 'nouveau_cas', 'total_cas',
      'nouveau_mort', 'total_mort', 'source', 'nom_region', 'nom_maladie'
    ];

    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      this.importMessage = `Erreur : Colonnes manquantes : ${missingHeaders.join(', ')}`;
      return;
    }

    try {
      this.predictiveData = lines.slice(1)
        .filter(line => line.trim() !== '')
        .map(line => {
          const values = line.split(',').map(v => v.trim());
          const entry: any = {};

          headers.forEach((header, index) => {
            if (['nouveau_cas', 'total_cas', 'nouveau_mort', 'total_mort'].includes(header)) {
              entry[header] = parseFloat(values[index]);
              if (isNaN(entry[header])) {
                throw new Error(`Valeur invalide pour ${header}: ${values[index]}`);
              }
            } else {
              entry[header] = values[index];
            }
          });

          return entry as DonneesPredictives;
        });

      this.availableRegions = [...new Set(this.predictiveData.map(d => d.nom_region))];
      this.availableMaladies = [...new Set(this.predictiveData.map(d => d.nom_maladie))];

      this.updateSelectors();

      this.importMessage = `${this.predictiveData.length} lignes de données importées avec succès.`;
    } catch (error) {
      this.importMessage = `Erreur lors du traitement du fichier : ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
    }
  }

  updateSelectors() {
    const regionSelect = document.getElementById('region-select') as HTMLSelectElement;
    const maladieSelect = document.getElementById('predictive-maladie-select') as HTMLSelectElement;

    regionSelect.innerHTML = '<option value="">Sélectionnez une région</option>';
    this.availableRegions.forEach(region => {
      const option = document.createElement('option');
      option.value = region;
      option.textContent = region;
      regionSelect.appendChild(option);
    });

    maladieSelect.innerHTML = '<option value="">Sélectionnez une maladie</option>';
    this.availableMaladies.forEach(maladie => {
      const option = document.createElement('option');
      option.value = maladie;
      option.textContent = maladie;
      maladieSelect.appendChild(option);
    });
  }

  onRegionChange(event: Event) {
    this.selectedRegion = (event.target as HTMLSelectElement).value;
    this.updatePredictiveChart();
  }

  onMaladieChange(event: Event) {
    this.selectedPredictiveMaladie = (event.target as HTMLSelectElement).value;
    this.updatePredictiveChart();
  }

  updatePredictiveChart() {
    if (!this.selectedRegion || !this.selectedPredictiveMaladie) return;

    const filteredData = this.predictiveData.filter(d =>
      d.nom_region === this.selectedRegion &&
      d.nom_maladie === this.selectedPredictiveMaladie
    );

    if (this.predictiveChart) {
      this.predictiveChart.destroy();
    }

    if (filteredData.length === 0) {
      this.importMessage = "Aucune donnée disponible pour cette sélection";
      return;
    }

    this.predictiveChart = new Chart(document.getElementById('predictiveChart') as HTMLCanvasElement, {
      type: 'line',
      data: {
        labels: filteredData.map(d => d.date),
        datasets: [{
          label: 'Total des cas',
          data: filteredData.map(d => d.total_cas),
          borderColor: 'blue',
          backgroundColor: 'rgba(0,0,255,0.1)',
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: {
            title: { display: true, text: 'Date' }
          },
          y: {
            title: { display: true, text: 'Total des cas' },
            beginAtZero: true
          }
        },
        plugins: {
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function(context: any) {
                const value = context.parsed.y;
                return `Total des cas: ${value.toLocaleString()}`;
              }
            }
          },
          title: {
            display: true,
            text: `Évolution des cas - ${this.selectedRegion} - ${this.selectedPredictiveMaladie}`
          }
        }
      }
    });
  }
}

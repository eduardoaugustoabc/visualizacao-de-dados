let rawData = [];
let currentType = 'EXP';
let currentYear = 2025; // Fixado por enquanto. Podemos adicionar slider depois.

const chart = echarts.init(document.getElementById('map'));
function getTotalsByYear() {
  // Retorna arrays de totais por ano para cada tipo
  const years = Object.keys(rawData.EXP).sort();
  const exp = years.map(y => rawData.EXP[y].reduce((acc, cur) => acc + cur.us_value, 0) / 1e9);
  const imp = years.map(y => rawData.IMP[y].reduce((acc, cur) => acc + cur.us_value, 0) / 1e9);
  const bal = years.map((y, i) => exp[i] - imp[i]);
  return { years, exp, imp, bal };
}

function renderTotalsLineChart() {
  const { years, exp, imp, bal } = getTotalsByYear();

  const option = {
    title: {
      text: 'Totais por ano',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['Exportações', 'Importações', 'Balança Comercial'],
      top: 30
    },
    xAxis: {
      type: 'category',
      data: years,
      name: 'Ano'
    },
    yAxis: {
      type: 'value',
      name: 'Bilhões de US$'
    },
    series: [
      {
        name: 'Exportações',
        data: exp,
        type: 'line',
        smooth: true,
        lineStyle: { color: '#388e3c', width: 2 }
      },
      {
        name: 'Importações',
        data: imp,
        type: 'line',
        smooth: true,
        lineStyle: { color: '#d32f2f', width: 2 }
      },
      {
        name: 'Balança Comercial',
        data: bal,
        type: 'line',
        smooth: true,
        lineStyle: { color: '#1976d2', width: 2 },
        areaStyle: {}
      }
    ]
  };

  lineChart.setOption(option);
}

const lineChart = echarts.init(document.getElementById('lineChart'));

fetch('data.json')
  .then(response => response.json())
  .then(data => {
    rawData = data;
    renderMap(); // Primeiro render
    renderTotalsLineChart(); // Renderiza o gráfico de totais
  });

document.getElementById('tipo').addEventListener('change', (e) => {
  currentType = e.target.value;
  renderMap();
});

function renderMap() {
  const mapData = getMapDataByYearAndType(currentYear, currentType);

  const maxValue = Math.max(...mapData.map(item => parseFloat(item.value)));

  chart.setOption({
    title: {
      text: `Volume de ${getLabel(currentType)} do Brasil (Ano ${currentYear})`,
      subtext: 'Fonte: Monitor do Comércio Exterior Brasileiro',
      left: 'center',
      top: '10px'
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: US$ {c} bi'
    },
    visualMap: {
      min: currentType === 'BAL' ? -maxValue : 0,
      max: maxValue,
      left: 'left',
      bottom: 'bottom',
      text: ['Mais', 'Menos'],
      calculable: true,
      inRange: {
        color: currentType === 'BAL'
            ? ['#d73027', '#ffffbf', '#1a9850'] 
            : currentType === 'EXP'
            ? ['#d4f4dd', '#1b5e20']             
            : ['#fcdada', '#b71c1c']             
        }
    },
    geo: {
      map: 'world',
      roam: true,
      label: {
        show: false
      },
      emphasis: {
        label: {
          show: true
        }
      }
    },
    series: [
      {
        name: getLabel(currentType),
        type: 'map',
        map: 'world',
        geoIndex: 0,
        data: mapData
      }
    ]
  });
}

function getMapDataByYearAndType(year, type) {
  if (!rawData[type] || !rawData[type][year]) {
    console.warn(`Dados não encontrados para tipo ${type} no ano ${year}`);
    return [];
  }

  // rawData[type][year] já é um array de objetos
  return rawData[type][year].map(({ name, us_value }) => ({
    name: name,
    value: parseFloat((us_value / 1e9).toFixed(2)) // valor em bilhões
  }));
}

function getLabel(code) {
  switch (code) {
    case 'EXP': return 'Exportações';
    case 'IMP': return 'Importações';
    case 'BAL': return 'Balança Comercial';
    default: return '';
  }
}

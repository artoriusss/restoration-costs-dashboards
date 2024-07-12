import { dictionary } from '../dict.js'

import { updateLocalizedText } from '../updateLocalizedText.js';
import { initializeDropdownOptions, initializeNestedDropdownOptions } from '../dropdowns.js';

import { formatBarData, updateBarChart } from '../barChart.js';
import { formatTsData, updateLineChart } from '../lineChart.js';
import { getValuesByObjCategory, updateTreeMap } from '../treeMap.js';

import { addMappointSeries } from '../addMappointSeries.js';
import { mapTooltipFormatter, legendFormatter, monthFormatter } from '../formatters.js';

import { updateMetrics } from '../updateMetrics.js';

import { getFilteredMappoints } from '../filter.js';

const {log} = console;
let breadcrumbNames = ['Ukraine']; 

const urlParams = new URLSearchParams(window.location.search);
const isEnglish = window.location.pathname.startsWith('/en');

let lang;
let fname;

if (isEnglish) {
    //console.log('English version of the site');
    lang = 'en';
    fname = '././data/ukraine/points_en.json';
  } else {
      //console.log('Ukrainian version of the site');
      lang = 'uk';
      fname = '././data/ukraine/points.json';
  }
const t = dictionary[lang];

var data;
var drilldownLevel = 0;
var levelData = {};
var pcode = {};

const pointsFull = await fetch(fname).then(response => response.json());
const response = await fetch('adm-levels/adm1.json');
const topology = await response.json();
const dataa = Highcharts.geojson(topology);
const dataInit = dataa.map(item => ({ ...item }));

updateLocalizedText(t);


const initializeAllDropdowns = async function (pts, update = false) {
    initializeDropdownOptions('obj-category', pts, 'object_type', 'object_type', update, t);
    initializeNestedDropdownOptions('payer-edrpou', pts, 'payer_edrpou', update, t);
    initializeNestedDropdownOptions('receipt-edrpou', pts, 'receipt_edrpou', update, t);
    initializeNestedDropdownOptions('program-type', pts, 'programme_name', update, t);
    initializeNestedDropdownOptions('budget-type', pts, 'budget_type', update, t);
};

function getFilterKey(selectElementId) {
    switch (selectElementId) {
        case 'program-type':
            return ['kpk', 'programme_name'];
        case 'obj-category':
            return ['object_type', 'object_type'];
        case 'payer-edrpou':
            return ['payer_edrpou', 'payer_edrpou'];
        case 'receipt-edrpou':
            return ['receipt_edrpou', 'receipt_edrpou'];
        case 'budget-type':
            return ['budget_type', 'budget_type'];
        default:
            return null;
    }
}
  
function resetFilter(selectElementId) {
    const { 0: valueKey, 1: labelKey } = getFilterKey(selectElementId);
    initializeDropdownOptions(selectElementId, pointsFull, valueKey, labelKey, false, t);
    updateCharts(pcode[`${drilldownLevel}`]);
}

function resetAllFilters() {
    const selectElementIds = [
        'obj-category',
        'program-type',
        'payer-edrpou',
        'receipt-edrpou'
    ];
    selectElementIds.forEach(selectElementId => resetFilter(selectElementId));
}

await initializeAllDropdowns(pointsFull, false);

// TABLES  
const updateTable = async function (pts) {
    const aggregateData = pts.reduce((acc, point) => {
        const countedPrograms = new Set();

        point.payments.forEach(payment => {
            if (!acc[payment.programme_name]) {
                acc[payment.programme_name] = {
                    numberOfObjects: 0,
                    totalAmount: 0,
                    totalDecisionAmount: 0 
                };
            }

            if (!countedPrograms.has(payment.programme_name)) {
                acc[payment.programme_name].numberOfObjects += 1;
                countedPrograms.add(payment.programme_name); 
            }

            acc[payment.programme_name].totalAmount += payment.amount;
        });

        return acc;
    }, {});

    const sortedData = Object.entries(aggregateData).sort(([, a], [, b]) => b.totalAmount - a.totalAmount);

    const tableBody = document.getElementById('programs-table').getElementsByTagName('tbody')[0];
    tableBody.innerHTML = ""; 

    for (const [programme, data] of sortedData) {
        const row = tableBody.insertRow();
        const programCell = row.insertCell();
        const numberCell = row.insertCell();
        const amountCell = row.insertCell();

        programCell.textContent = programme;
        numberCell.textContent = data.numberOfObjects;
        amountCell.textContent = data.totalAmount.toLocaleString().replaceAll(',', ' ');

        programCell.style.textAlign = 'left';
        numberCell.style.textAlign = 'center';
        amountCell.style.textAlign = 'right';
    }
};

function hideObjectsTable() {
    const table = document.getElementById('objects-table');
    table.style.display = 'none';
};

function displayObjectsTable(pts) {
    const table = document.getElementById('objects-table');
    table.style.display = ''; 

    const tableBody = table.getElementsByTagName('tbody')[0];
    tableBody.innerHTML = '';
    pts.forEach(item => {
        const row = tableBody.insertRow();
        
        const addressCell = row.insertCell();
        addressCell.textContent = `${item.street}, ${item.building}` 

        const objectTypeCell = row.insertCell();
        objectTypeCell.textContent = item.object_type;
        objectTypeCell.style.textAlign = 'center';

        const decisionCell = row.insertCell();
        decisionCell.textContent = item.amount_decision.toLocaleString().replaceAll(',', ' '); 
        decisionCell.style.textAlign = 'right';

        const amountCell = row.insertCell();
        amountCell.textContent = item.amount.toLocaleString().replaceAll(',', ' ');
        amountCell.style.textAlign = 'right';

        const percentageCell = row.insertCell();
        const percentage = item.amount_decision ? (item.amount / item.amount_decision * 100).toFixed(1) : 0;
        percentageCell.textContent = `${percentage}%`;
        percentageCell.style.textAlign = 'right';
    });
};

// UPDATE CHARTS 
const updateCharts = async function (pcode) {
    const pts = await filterByCategories(pcode)
    updateTreeMap(pts);
    updateLineChart(pts);
    updateBarChart(pts);
    updateTable(pts);
    updateMetrics(pts, t);
    initializeAllDropdowns(pts, true);
    if (drilldownLevel === 4) {
        displayObjectsTable(pts);
    } else if (drilldownLevel === 2) {
        hideObjectsTable();
    }
};

// MAP LOGIC
const getDrilldownLevel = function (length) {
    return length > 9 ? 4 : length > 6 ? 3 : length > 4 ? 2 : 1;
};

// FILTERING
const aggregateByPcode = async function (data) {
    const points = await filterByCategories(); 
    data.forEach((d) => {
        d.value = 0; 
        d.drilldown = d.properties[`ADM${drilldownLevel+1}_PCODE`];
        points.forEach(p => {
            if (d.properties[`ADM${drilldownLevel+1}_PCODE`] === p[`adm${drilldownLevel+1}_pcode`]) {
                d.value += p.amount;
            }
        });
        d.value = d.value === 0 ? 0 : d.value;
    });
    return data;
};

const filterByCategories = async function (pcode=null) {
    let points = await fetch(fname).then(response => response.json());

    const objectCategory = document.getElementById('obj-category').value;
    const programType = document.getElementById('program-type').value;
    const payerEdrpou = document.getElementById('payer-edrpou').value;
    const receiptEdrpou = document.getElementById('receipt-edrpou').value;
    const budgetType = document.getElementById('budget-type').value;

    if (pcode) {
        points = points.filter(point => point[`adm${drilldownLevel}_pcode`] === pcode);
    }

    const filteredPoints = points.reduce((acc, point) => {
        const matchesObjectCategory = objectCategory === 'all' || point.object_type === objectCategory;

        let filteredPayments = [];
        let amount = 0;

        filteredPayments = point.payments.filter(payment => {
            const matchesProgramType = programType === 'all' || payment.programme_name === programType;
            const matchesBudgetType = budgetType === 'all' || payment.budget_type === budgetType;
            const matchesPayerEdrpou = payerEdrpou === 'all' || payment.payer_edrpou == payerEdrpou;
            const matchesReceiptEdrpou = receiptEdrpou === 'all' || payment.receipt_edrpou == receiptEdrpou;
            if (matchesPayerEdrpou && matchesReceiptEdrpou && matchesProgramType && matchesBudgetType) {
                amount += payment.amount;
                return true;
            }
            return false;
        });

        if (matchesObjectCategory && amount > 0) {
            const filteredPoint = {...point, payments: filteredPayments, amount: amount};
            acc.push(filteredPoint);
        }

        return acc;
    }, []);
    return filteredPoints;
};

const drilldown = async function (e) {
    if (!e.seriesOptions) {
        const chart = this;
        const level = getDrilldownLevel(e.point.drilldown.length);
        drilldownLevel = level;
        chart.tooltip.options.enabled = false;
        pcode[`${level}`] =  e.point.properties[`ADM${drilldownLevel}_PCODE`];
        updateCharts(pcode[`${level}`]);

        if (level === 4) {
            chart.tooltip.options.enabled = true;
            chart.update({
                legend: {
                    enabled: false
                }
            }, false);
            const seriesName = e.point.properties[`ADM${drilldownLevel}_${t.code}`];
            breadcrumbNames.push(seriesName);
            chart.update({
                mapView: {
                    projection: {
                        name: 'WebMercator'
                    }
                },
                mapNavigation: {
                    enabled: true,
                    enableMouseWheelZoom: true,
                }
            }, false);
        
            let pointsConverted = await getFilteredMappoints(fname, drilldownLevel);
        
            while (chart.series.length > 0) {
                chart.series[0].remove(false);
            }
        
            chart.addSeries({
                type: 'tiledwebmap',
                name: 'TWM Tiles',
                provider: {
                    type: 'OpenStreetMap',
                    theme: 'Standard'
                },
                legend: {
                    enabled: false
                },
                color: 'rgba(128,128,128,0.3)'
            }, false);
            addMappointSeries(chart, seriesName, pointsConverted, t);
            chart.update({ tooltip: { enabled: true } }, false);
            return;
        }

        let mapKey = `adm-levels/ADM${level+1}/${e.point.drilldown}.geojson`

        chart.showLoading('<i class="icon-spinner icon-spin icon-3x"></i>'); 
        const topology = await fetch(mapKey).then(response => response.json());
        const topoData = Highcharts.geojson(topology);

        levelData[drilldownLevel] = topoData.map(item => ({ ...item }));

        chart.hideLoading(); 

        const seriesName = e.point.properties[`ADM${drilldownLevel}_${t.code}`];
        breadcrumbNames = [seriesName];
        data = await aggregateByPcode(topoData);
        chart.addSeriesAsDrilldown(e.point, {
            name: seriesName,
            data: data,
            dataLabels: {
                enabled: true,
                format: `{point.properties.ADM${drilldownLevel+1}_${t.code}}`
            }
        });
        setTimeout(() => {
            chart.tooltip.options.enabled = true;
        }, 750);
    }
};

let afterDrillUp = function(e) {console.log('drillup event: ', e)};

(async () => {
    // MAP INITIALIZATION
    const response = await fetch('adm-levels/adm1.json');
    const topology = await response.json();
    data = Highcharts.geojson(topology);
    data = await aggregateByPcode(data);
    Highcharts.mapChart('map-container', {
        custom: {
            customData: data
        },
        chart: {
            events: {
                drilldown,
                redraw: function() {
                    //console.log('redraw')
            },
                drillupall: async function(e) {
                    //this.tooltip.options.enabled = false;
                    updateCharts(pcode[`${drilldownLevel === 4 ? 2 : drilldownLevel - 1}`]);
                    drilldownLevel -= 1;
                    breadcrumbNames.pop(); 

                    if (drilldownLevel === 0) {
                        data = await aggregateByPcode(dataInit);
                        this.series[0].remove();
                        this.addSeries(e.point, {
                            name: 'seriesName',
                            data: data,
                            dataLabels: {
                                enabled: true,
                                format: `{point.properties.ADM${drilldownLevel+1}_${t.code}`
                            }
                        });
                        this.series[0].setData(data, true);
                    }

                    else if (drilldownLevel === 1 || drilldownLevel === 2) {
                        data = await aggregateByPcode(levelData[drilldownLevel]);
                        this.series[0].remove();
                        this.addSeries(e.point, {
                            name: 'seriesName',
                            data: data,
                            dataLabels: {
                                enabled: true,
                                format: `{point.properties.ADM${drilldownLevel+1}_${t.code}`
                            }
                        });
                        this.series[0].setData(data, true);
                    }

                    else {
                        drilldownLevel -= 1;
                        const chart = this;
                        const seriesTypesToRemove = ['tiledwebmap', 'mappoint'];
                            seriesTypesToRemove.forEach(seriesType => {
                                const series = chart.series.find(s => s.type === seriesType);
                                if (series) {
                                    series.remove(false); 
                                }
                            });
                        chart.redraw();
                        data = await aggregateByPcode(levelData[drilldownLevel]);
                        this.addSeries(e.point, {
                            name: 'seriesName',
                            data: data,
                            dataLabels: {
                                enabled: true,
                                format: `{point.properties.ADM${drilldownLevel}_${t.code}`
                            }
                        });
                        this.series[0].setData(data, true);
                        chart.update({tooltip: {
                            useHTML: true,
                            formatter: function() {
                                return [0, 1, 2, 3].includes(drilldownLevel) ? mapTooltipFormatter(this.point.options, drilldownLevel, t) : '';
                            }
                        }});
                        chart.tooltip.options.enabled = true;
                        chart.update({mapNavigation: {enableMouseWheelZoom: false}}, false);
                        chart.update({legend: {enabled: true}}, false);
                    }
                }
            },
            style: {
                fontFamily: 'Montserrat, sans-serif'  
            }
        },

        title: {
            text: ''
        },

        colorAxis: {
            minColor: '#FFFFFF', 
            maxColor: '#00467E', 
            nullColor: '#FFFFFF',
            stops: [
                [0, '#FFFFFF'], 
                [0.0001, '#fff5cc'],
                [0.001, '#ffea99'],
                [0.01, '#ffe580'], 
                [0.1, '#4d7ea5'],
                [0.65, '#6690b2'],
                [0.7, '#336b98'],
                [1, '#003158']
            ],
            labels: {
                formatter: function () {
                    const absValue = Math.abs(this.value);
                    let label;
                    if (absValue >= 1e9) {
                        label = (this.value / 1e9).toFixed() +`${t.bln} `;
                    } else if (absValue >= 1e6) {
                        label = (this.value / 1e6).toFixed() + `${t.mln} `;
                    } else if (absValue >= 1e3) {
                        label = (this.value / 1e3).toFixed() + `${t.k} `;
                    } else {
                        label = this.value.toString();
                    }
                    return label;
                }
            }
        },
        mapView: {
            projection: {
                name: 'LambertConformalConic'
            },
            padding: 0
        },

        mapNavigation: {
            enabled: true,
            buttonOptions: {
                verticalAlign: 'bottom'
            },
            enableMouseWheelZoom: false,
        },

        tooltip: {
            useHTML: true,
            formatter: function() {
                return [0, 1, 2, 3].includes(drilldownLevel) ? mapTooltipFormatter(this.point.options, drilldownLevel, t) : '';
            }
        },

        plotOptions: {
            map: {
                states: {
                    hover: {
                        color: '#EEDD66'
                    }
                }
            }
        },

        legend: {
            enabled: true
        },

        series: [{
            data: data,
            name: 'Ukraine',
            dataLabels: {
                enabled: true,
                formatter: function() {
                    return this.point.properties[`ADM1_${t.code}`];
                }
            },
            custom: {
                mapView: {
                    projection: {
                        name: 'LambertConformalConic'
                    },
                    padding: 0
                }
            }
        }],

        drilldown: {
            activeDataLabelStyle: {
                color: '#FFFFFF',
                textDecoration: 'none',
                textOutline: '1px #000000'
            },
            breadcrumbs: {
                floating: true,
                formatter: function () {
                    return breadcrumbNames.join(' / ');
                },
                showFullPath: true 
            },
            drillUpButton: {
                relativeTo: 'spacingBox',
                position: {
                    x: 0,
                    y: 60
                }
            }
        }
    });

    // TREEMAP INITIALIZATION
    const valuesByCategory = getValuesByObjCategory(pointsFull);
    Highcharts.chart('treemap-container', {
    chart: {
        events: {
            redraw: function() {
                //console.log('tmredraw')
            }
        },
        style: {
            fontFamily: 'Montserrat, sans-serif'  
        }
    },
    colorAxis: {
        minColor: '#FFFFFF', 
        maxColor: '#00467E', 
        labels: {
            formatter: function() {
                return legendFormatter(this.value, t);
            }
        }
    },
    series: [{
        type: 'treemap',
        layoutAlgorithm: 'squarified',
        clip: false,
        data: valuesByCategory
    }],
    title: {
        text: t.spendsType,
        align: 'center'
    },
    tooltip: {
        useHTML: true,
        pointFormat: `{point.name}: <b>{point.value}</b> грн`,
        formatter: function() {
            return `${this.point.name}: <b>${legendFormatter(this.point.value, t, true)} ${t.lamount}</b>`;
        }
    }
    });

    // LINE CHART INITIALIZATION
    const tsSeries = formatTsData(pointsFull);
    Highcharts.chart('line-chart-container',{
        chart: {
            renderTo: 'container',
            type: 'column',
            zoomType: 'xy',
            style: {
                fontFamily: 'Montserrat, sans-serif'  
            }
        },
        xAxis: {
            type: 'datetime',
            tickInterval: 2592000000,
            dateTimeLabelFormats: monthFormatter,
            labels: {
                rotation: -90,
                formatter: function() {
                    return t.monthNames[new Date(this.value).getUTCMonth()];
                }
            }
        },
        yAxis: {
            labels: {
                formatter: function() {
                    return legendFormatter(this.value, t);
                }
            },
            title: {
                enabled: false
            }
        },
        tooltip: {
            valueSuffix: ` ${t.lamount}`,
            xDateFormat: '%b %Y',
            formatter: function() {
                return `<b>${legendFormatter(this.y, t, true)} ${t.lamount}</b>`;
            }
        },
        colors: ['#ffbd01'],
        title: {
            text: `${t.spendsPeriond}`
        },
        legend: {
            enabled: false
        },
        series: tsSeries.series,
    })

    // BAR CHARTS INITIALIZATION
    const { series: receiptSeries, categories: receiptCategories } = formatBarData(pointsFull, 'receipt_name');
    const { series: payerSeries, categories: payerCategories } = formatBarData(pointsFull, 'payer_name');
    Highcharts.chart('bar-payer', {
        chart: {
          type: "bar",
          zoomType: "y",
          style: {
            fontFamily: 'Montserrat, sans-serif'  
        }
        },
        title: {
            text: `${t.topPayers}`
        },
        xAxis: {
          categories: payerCategories,
          title: {
            text: null
          },
          labels: {
            style: {
                width: '150px', 
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
            }
        }
        },
        yAxis: {
          min: 0,
          title: {
            text: null
          },
          labels: {
            overflow: "justify",
            formatter: function() {
                return legendFormatter(this.value, t, true);
            }
          },
          tickAmount: 6
        },
        tooltip: {
            valueSuffix: ` ${t.lamount}`
        },
        legend: {
          enabled: false
        },
        series: [payerSeries]
      });
    Highcharts.chart('bar-reciept', {
        chart: {
          type: "bar",
          zoomType: "y",
          style: {
            fontFamily: 'Montserrat, sans-serif'  
        }
        },
        title: {
          text: `${t.topReceipts}`
        },
        xAxis: {
          categories: receiptCategories,
          title: {
            text: null
          },
          labels: {
            style: {
                width: '150px', 
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
            }
        }
        },
        yAxis: {
          min: 0,
          title: {
            text: null
          },
          labels: {
            rotation: 0, 
            overflow: "justify",
            formatter: function() {
                return legendFormatter(this.value, t, true);
            }
          },
          tickAmount: 6
        },
        tooltip: {
          valueSuffix: ` ${t.lamount}`
        },
        legend: {
          enabled: false
        },
        series: [receiptSeries]
      });

    // PROGRAMS TABLE INITIALIZATION
    await updateTable(pointsFull);
    await updateMetrics(pointsFull, t);

    // EVENT HANDLERS
    const onDropdownChange = async function() {
        if (drilldownLevel !== 4) {
            const chart = Highcharts.charts[0]; 
            let aggregatedData = await aggregateByPcode(data); 
            chart.series[0].setData(aggregatedData);
            updateCharts(pcode[`${drilldownLevel}`]);
        }  else {
            const chart = Highcharts.charts[0]; 
            let points = await getFilteredMappoints(fname, drilldownLevel);
            updateCharts(pcode[`${drilldownLevel}`]);
            chart.series[1].remove();
            addMappointSeries(chart, 'Mappoints', points, t);
        }
    }

    $(document).ready(function() {
        $('#obj-category').select2();
        $('#program-type').select2();
        $('#receipt-edrpou').select2();
        $('#payer-edrpou').select2();
        $('#budget-type').select2();
        $('#payer-edrpou').on('change', onDropdownChange);
        $('#receipt-edrpou').on('change', onDropdownChange);
        $('#obj-category').on('change', onDropdownChange);
        $('#program-type').on('change', onDropdownChange);
        $('#budget-type').on('change', onDropdownChange);

        $('button[data-reset-target]').on('click', async function() {
            const targetId = $(this).data('reset-target');
            if (drilldownLevel !== 4) {
                resetFilter(targetId);
    
                const chart = Highcharts.charts[0]; 
                let aggregatedData = await aggregateByPcode(data); 
                chart.series[0].setData(aggregatedData);
                updateCharts(pcode[`${drilldownLevel}`]);
            } else {
                resetFilter(targetId);
                const chart = Highcharts.charts[0]; 
                let points = await getFilteredMappoints(fname, drilldownLevel);
                updateCharts(pcode[`${drilldownLevel}`]);
                chart.series[1].remove();
                addMappointSeries(chart, 'Mappoints', points, t);
            }   
        });
        $('#reset-all-filters').on('click', async function() {
            if (drilldownLevel !== 4) {
                resetAllFilters();

                const chart = Highcharts.charts[0]; 
                let aggregatedData = await aggregateByPcode(data); 
                chart.series[0].setData(aggregatedData);
                updateCharts(pcode[`${drilldownLevel}`]);
            } else {
                resetAllFilters();
    
                const chart = Highcharts.charts[0]; 
                let points = await getFilteredMappoints(fname, drilldownLevel);
                updateCharts(pcode[`${drilldownLevel}`]);
                chart.series[1].remove();
                addMappointSeries(chart, 'Mappoints', points, t);
            }
        });
    });
})();
export const formatTsData = function (points) {
    let monthData = points.reduce((acc, point) => {
        point.payments.forEach(payment => {
            let date = new Date(payment.trans_date * 1000);
            let yearMonthKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
            let amount = payment.amount; 

            if (!acc[yearMonthKey]) {
                acc[yearMonthKey] = {
                    total: 0,
                    timestamp: Date.UTC(date.getUTCFullYear(), date.getUTCMonth())
                };
            }
            
            acc[yearMonthKey].total += amount;
        });
        
        return acc;
    }, {});

    let minDate = new Date(Math.min(...Object.values(monthData).map(entry => entry.timestamp)));
    let maxDate = new Date(Math.max(...Object.values(monthData).map(entry => entry.timestamp)));
    
    for (let year = minDate.getUTCFullYear(); year <= maxDate.getUTCFullYear(); year++) {
        for (let month = 0; month < 12; month++) {
            let yearMonthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
            if (!monthData[yearMonthKey]) {
                monthData[yearMonthKey] = {
                    total: 0,
                    timestamp: Date.UTC(year, month)
                };
            }
        }
    }

    let timestamps = Object.values(monthData).map(entry => entry.timestamp);
    let pointStart = Math.min(...timestamps);

    let aggregatedData = Object.keys(monthData)
        .sort((a, b) => monthData[a].timestamp - monthData[b].timestamp)
        .map(yearMonth => ({
            x: monthData[yearMonth].timestamp,
            y: monthData[yearMonth].total
        }));

    return {
        series: [{
            name: 'Усього за місяць', 
            pointStart: pointStart,
            pointInterval: 30 * 24 * 3600 * 1000, 
            data: aggregatedData
        }]
    };
};

export const updateLineChart = async function (pts) {
    const tsData = formatTsData(pts);
    Highcharts.charts[2].series[0].setData(tsData.series[0].data);
};
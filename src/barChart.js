export const formatBarData = function (points, aggregateBy) {
    const barColour = aggregateBy === 'payer_name' ? "#00457e" : '#ffbd01';
    const barLabel = aggregateBy === 'payer_name' ? 'Payer' : 'Recipient';
    const aggregatedData = {};

    points.forEach(point => {
        point.payments.forEach(payment => {
            const key = aggregateBy === 'payer_name' ? payment.payer_name : payment.receipt_name;
            if (aggregatedData[key]) {
                aggregatedData[key] += payment.amount;
            } else {
                aggregatedData[key] = payment.amount;
            }
        });
    });

    const sortedData = Object.keys(aggregatedData)
        .map(key => ({ name: key, amount: aggregatedData[key] }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10);

    const seriesData = sortedData.map(item => item.amount);
    const categories = sortedData.map(item => item.name);

    const series = {
        name: barLabel,
        color: barColour,
        data: seriesData
    };
    return { series, categories };
};

export const updateBarChart = async function (pts) {
    const { series: receiptSeries, categories: receiptCategories } = formatBarData(pts, 'receipt_name');
    const { series: payerSeries, categories: payerCategories } = formatBarData(pts, 'payer_name');
    Highcharts.charts[3].series[0].setData(payerSeries.data);
    Highcharts.charts[4].series[0].setData(receiptSeries.data);
    Highcharts.charts[3].axes[0].setCategories(payerCategories);
    Highcharts.charts[4].axes[0].setCategories(receiptCategories);
};
export const calculateColorValue = (value) => {
    const scaleFactor = 0.1;
    return value * scaleFactor;
};

export const getValuesByObjCategory = function(points) {
    const aggregatedByCategory = points.reduce((acc, point) => {
        const { object_type, payments } = point;

        const totalAmountByCategory = payments.reduce((sum, payment) => sum + payment.amount, 0);

        if (!acc[object_type]) {
            acc[object_type] = 0;
        }
        acc[object_type] += totalAmountByCategory;
        return acc;
    }, {});

    const categoryValuesArray = Object.keys(aggregatedByCategory).map((key) => ({
        name: key,
        value: aggregatedByCategory[key],
        colorValue: calculateColorValue(aggregatedByCategory[key]) 
    }));

    return categoryValuesArray;
};

export const updateTreeMap = async function (pts) {
    const valuesByCategory = getValuesByObjCategory(pts);
    Highcharts.charts[1].series[0].setData(valuesByCategory);
};
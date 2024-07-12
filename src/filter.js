const {log} = console;

export const filterByCategories = async function (fname, drilldownLevel, pcode=null) {
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

    log(`Filtering by ${objectCategory}, ${payerEdrpou}, ${receiptEdrpou}, ${programType}, ${budgetType}`);
    return filteredPoints;
};

export const aggregateByPcode = async function (data, fname, drilldownLevel) {
    const points = await filterByCategories(fname, drilldownLevel); 
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

export const getFilteredMappoints = async function (fname, drilldownLevel) {
    let points = await fetch(fname).then(response => response.json());
    points = await filterByCategories(fname, drilldownLevel);

    const maxAmount = Math.max(...points.map(p => p.amount)); 
    const minRadius = 10; 
    const maxRadius = 60; 

    const scale_factor = (maxRadius - minRadius) / Math.sqrt(maxAmount);

    const calculateRadius = (amount) => {
        return Math.sqrt(amount) * scale_factor + minRadius;
    };

    points = points.map(obj => ({
        ...obj,
        lat: obj.latitude,
        lon: obj.longitude,
        marker: {
            radius: calculateRadius(obj.amount),
            fillColor: 'rgba(25, 77, 119, 0.2)',
            lineWidth: 0.75, 
            lineColor: 'rgba(25, 77, 119, 1)', 
            symbol: 'circle'
        }
    }));
    return points;
};
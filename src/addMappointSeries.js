export const addMappointSeries = function (chart, seriesName, pointsConverted, t) {
    chart.addSeries({
        type: 'mappoint',
        name: seriesName,
        enableMouseTracking: true,
        turboThreshold: 5000,
        legend: {
            enabled: false
        },
        states: {
            inactive: {
                enabled: false
            }
        },
        dataLabels: {
            enabled: false,
        },
        tooltip: {
            enabled: false
        },
        data: pointsConverted,
        point: {
            events: {
                click: function () {
                    const point = this;
                    chart.tooltip.update({
                        enabled: true,
                        useHTML: true,
                        formatter: function () {
                            const point = this.point;

                            const aggregatedPayments = (point.payments || []).reduce((acc, payment) => {
                                const key = `${payment.payer_edrpou}_${payment.receipt_edrpou}`;
                                if (!acc[key]) {
                                    acc[key] = {
                                        payer_edrpou: payment.payer_edrpou,
                                        payer_name: payment.payer_name,
                                        receipt_edrpou: payment.receipt_edrpou,
                                        receipt_name: payment.receipt_name,
                                        programme_type: payment.programme_name,
                                        object_type: point.object_type,
                                        total_amount: 0
                                    };
                                }
                                acc[key].total_amount += payment.amount;
                                return acc;
                            }, {});

                            const payerCounts = {};
                            for (const key in aggregatedPayments) {
                                const edrpou = aggregatedPayments[key].payer_edrpou;
                                if (!payerCounts[edrpou]) {
                                    payerCounts[edrpou] = 0;
                                }
                                payerCounts[edrpou]++;
                            }

                            let tooltipContent = `
                                <div class="tooltip-content">
                                    <div class="tooltip-section">
                                        <table>
                                            <tr>
                                                <th>${t.district}:</th>
                                                <td style="font-weight: 500;">${point.district || ''}</td>
                                            </tr>
                                            <tr>
                                                <th>${t.terhromada}:</th>
                                                <td style="font-weight: 500;">${point.terhromada || ''}</td>
                                            </tr>
                                            <tr>
                                                <th>${t.settlement}:</th>
                                                <td style="font-weight: 500;">${point.settlement || ''}</td>
                                            </tr>
                                            <tr>
                                                <th>${t.address}:</th>
                                                <td style="font-weight: 500;">${point.address}</td>
                                            </tr>
                                            <tr>
                                                <th>${t.financed}:</th>
                                                <td style="font-weight: 500;">${point.amount_payments ? point.amount_payments.toLocaleString().replaceAll(',', ' ') + ` ${t.uah}` : ''}</td>
                                            </tr>
                                            ${point.note ? `
                                            <tr>
                                                <th>${t.note}:</th>
                                                <td style="font-weight: 500;">${point.note || ''}</td>
                                            </tr>` : ''}
                                        </table>
                                    </div>
                                    <div class="tooltip-section">
                                        <table style="border-collapse: separate; border-spacing: 0; width: 100%; overflow: hidden;">
                                            <tr>
                                                <th style="border: 1px solid #000; text-align: center; padding: 8px;">${t.payerId}</th>
                                                <th style="border: 1px solid #000; border-left: none; text-align: center; padding: 8px;">${t.payer}</th>
                                                <th style="border: 1px solid #000; border-left: none; text-align: center; padding: 8px;">${t.receiptId}</th>
                                                <th style="border: 1px solid #000; border-left: none; text-align: center; padding: 8px;">${t.receipt}</th>
                                                <th style="border: 1px solid #000; border-left: none; text-align: center; padding: 8px;">${t.program}</th>
                                                <th style="border: 1px solid #000; border-left: none; text-align: center; padding: 8px;">${t.type}</th>
                                                <th style="border: 1px solid #000; border-left: none; text-align: center; padding: 8px; white-space: nowrap; width: 100px;">${t.uah}</th>
                                            </tr>
        `;

                            const keys = Object.keys(aggregatedPayments);
                            let currentPayer = null;
                            let currentPayerRowSpan = 0;
                            for (let i = 0; i < keys.length; i++) {
                                const key = keys[i];
                                const payment = aggregatedPayments[key];
                                const isFirstRowForPayer = payment.payer_edrpou !== currentPayer;
                                const isLastRowForPayer = currentPayerRowSpan === payerCounts[payment.payer_edrpou] - 1;
                                
                                if (isFirstRowForPayer) {
                                    currentPayer = payment.payer_edrpou;
                                    currentPayerRowSpan = 0; 
                                    tooltipContent += `
                                        <tr>
                                            <td rowspan="${payerCounts[payment.payer_edrpou]}" style="border: 1px solid #000; padding: 8px; font-weight: 500; white-space: normal;">${payment.payer_edrpou || ''}</td>
                                            <td rowspan="${payerCounts[payment.payer_edrpou]}" style="border: 1px solid #000; border-left: none; padding: 8px; font-weight: 500; white-space: normal;">${payment.payer_name || ''}</td>
                                            <td style="border: 1px solid #000; border-left: none; padding: 8px; font-weight: 500; white-space: normal;">${payment.receipt_edrpou || ''}</td>
                                            <td style="border: 1px solid #000; border-left: none; padding: 8px; font-weight: 500; white-space: normal;">${payment.receipt_name || ''}</td>
                                            <td style="border: 1px solid #000; border-left: none; padding: 8px; font-weight: 500; white-space: normal;">${payment.programme_type || ''}</td>
                                            <td style="border: 1px solid #000; border-left: none; padding: 8px; font-weight: 500; white-space: normal;">${payment.object_type || ''}</td>
                                            <td style="border: 1px solid #000; border-left: none; padding: 8px; font-weight: 500; white-space: nowrap;">${payment.total_amount.toLocaleString().replaceAll(',', ' ') || ''}</td>
                                        </tr> 
                                    `;
                                } else {
                                    tooltipContent += `
                                        <tr>
                                            <td style="border: 1px solid #000; border-left: none; border-top: none; padding: 8px; font-weight: 500; white-space: normal;">${payment.receipt_edrpou || ''}</td>
                                            <td style="border: 1px solid #000; border-left: none; border-top: none; padding: 8px; font-weight: 500; white-space: normal;">${payment.receipt_name || ''}</td>
                                            <td style="border: 1px solid #000; border-left: none; border-top: none; padding: 8px; font-weight: 500; white-space: normal;">${payment.programme_type || ''}</td>
                                            <td style="border: 1px solid #000; border-left: none; border-top: none; padding: 8px; font-weight: 500; white-space: normal;">${payment.object_type || ''}</td>
                                            <td style="border: 1px solid #000; border-left: none; border-top: none; padding: 8px; font-weight: 500; white-space: nowrap;">${payment.total_amount.toLocaleString().replaceAll(',', ' ') || ''}</td>
                                        </tr>
                                    `;
                                }
                                currentPayerRowSpan++;
                            }

                            tooltipContent += `
                                        </table>
                                    </div>
                                    <div class="tooltip-section">
                                        <p>${point.note_coordinates || ''}</p>
                                    </div>
                                </div>
                            `;

                            return tooltipContent;
                        }
                    });

                    point.series.chart.tooltip.refresh(point);
                },
                mouseOut: function () {
                    chart.tooltip.update({
                        enabled: false
                    });
                }
            }
        }
    }, false);

    chart.mapView.update({
        projection: {
            name: 'WebMercator'
        }
    }, false);
    chart.redraw();
    chart.hideLoading();
};
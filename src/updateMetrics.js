import { numberFormatter } from "./formatters.js";

export const updateMetrics = async function (pts, t, uah=true){
    let plannedBudgetTotal = 0;
    let stateSpent = 0;
    let localSpent = 0;
    let partnersSpent = 0;
    let totalSpent = 0;

    pts.forEach(point => {
        plannedBudgetTotal += point.amount_decision ? point.amount_decision : 0;
        point.payments.forEach(payment => {
            const budgetType = payment['budget_type'];

            if (budgetType === t.budgetType.state) {
                stateSpent += payment.amount ? payment.amount : 0;
            } else if (budgetType === t.budgetType.local) {
                localSpent += payment.amount ? payment.amount : 0;
            } else if (budgetType === t.budgetType.partners) {
                partnersSpent += payment.amount ? payment.amount : 0;
            }

            totalSpent += payment.amount ? payment.amount : 0;
        });
    });

    if (document.getElementById('planned-budget') !== null) {
        document.getElementById('planned-budget').textContent = numberFormatter(plannedBudgetTotal, t, true);
    }
    document.getElementById('total-spent').textContent = numberFormatter(totalSpent, t, uah);
    document.getElementById('state-spent').textContent = numberFormatter(stateSpent, t, uah);
    document.getElementById('local-spent').textContent = numberFormatter(localSpent, t, uah);
    document.getElementById('partners-spent').textContent = numberFormatter(partnersSpent, t, uah);
}
export const initializeDropdownOptions = async function(selectElementId, pts, propertyValueKey, propertyLabelKey, update, t) {
    const selectElement = document.getElementById(selectElementId);
    const valueLabelMapper = pts.reduce((acc, item) => {
        const value = item[propertyValueKey];
        const label = item[propertyLabelKey];
        if (value && label) {
            acc[value] = label;
        }
        return acc;
    }, {});

    const currentSelectedValue = selectElement.value;

    while (selectElement.options.length > 0) {
        selectElement.remove(0);
    }

    const allOptionsEl = document.createElement('option');
    allOptionsEl.value = 'all';
    allOptionsEl.textContent = t.all;
    selectElement.appendChild(allOptionsEl);

    Object.entries(valueLabelMapper).forEach(([value, label]) => {
        const optionElement = document.createElement('option');
        optionElement.value = value;
        optionElement.textContent = label;
        selectElement.appendChild(optionElement);
    });

    if (update) {
        if (selectElement.querySelector(`option[value="${currentSelectedValue}"]`)) {
            selectElement.value = currentSelectedValue;
        } else {
            selectElement.value = 'all';
        }
    } else {
        selectElement.value = 'all';
    }
    selectElement.dataset.selectedValue = selectElement.value;
};

export const initializeNestedDropdownOptions = async function(selectElementId, pts, propertyKey, update, t) {
    const selectElement = document.getElementById(selectElementId);
    const valueLabelMapper = pts.reduce((acc, point) => {
        point.payments.forEach(payment => {
            const value = payment[propertyKey];
            const label = payment[propertyKey]; 
            if (value) {
                acc[value] = label;
            }
        });
        return acc;
    }, {});

    const currentSelectedValue = selectElement.value;

    while (selectElement.options.length > 0) {
        selectElement.remove(0);
    }

    const allOptionsEl = document.createElement('option');
    allOptionsEl.value = 'all';
    allOptionsEl.textContent = t.all;
    selectElement.appendChild(allOptionsEl);

    Object.entries(valueLabelMapper).forEach(([value, label]) => {
        const optionElement = document.createElement('option');
        optionElement.value = value;
        optionElement.textContent = label;
        selectElement.appendChild(optionElement);
    });

    if (update) {
        if (selectElement.querySelector(`option[value="${currentSelectedValue}"]`)) {
            selectElement.value = currentSelectedValue;
        } else {
            selectElement.value = 'all';
        }
    } else {
        selectElement.value = 'all';
    }
    selectElement.dataset.selectedValue = selectElement.value;
};
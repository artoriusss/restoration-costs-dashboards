export const numberFormatter = (num, t, uah=false) => {
    const absNum = Math.abs(num);
    let formattedNumber;
    let suffix;
    let uahSuffix = uah ? ` ${t.uah}` : '';

    if (absNum >= 1e9) {
        formattedNumber = (num / 1e9).toFixed(1);
        suffix = t.bln + uahSuffix;
    } else if (absNum >= 1e6) {
        formattedNumber = (num / 1e6).toFixed(1);
        suffix = t.mln + uahSuffix;
    } else if (absNum >= 1e3) {
        formattedNumber = (num / 1e3).toFixed(1);
        suffix = t.k + uahSuffix;
    } else {
        formattedNumber = num.toString();
        suffix = '';
    }

    if (formattedNumber.endsWith('.0')) {
        formattedNumber = formattedNumber.slice(0, -2);
    }

    return `${formattedNumber} ${suffix}`;
};

export const legendFormatter = function(value, t, space=false) {
    const absValue = Math.abs(value);
    let suffix;
    let label;
    if (absValue >= 1e9) {
        suffix = space ? ` ${t.bln}` : `${t.bln}`;
        label = (value / 1e9).toFixed() + suffix;
    } else if (absValue >= 1e6) {
        suffix = space ? ` ${t.mln}` : `${t.mln}`;
        label = (value / 1e6).toFixed() + suffix;
    } else if (absValue >= 1e3) {
        suffix = space ? ` ${t.k}` : `${t.k}`;
        label = (value / 1e3).toFixed() + suffix;
    } else {
        label = value.toString();
    }
    return label;
};

export const mapTooltipFormatter = function(options, drilldownLevel, t) {
    const region = drilldownLevel === 0 ? `${t.lregion}`: drilldownLevel === 1 ? `${t.ldistrict}`: drilldownLevel === 2? `${t.lterhromada}`: `${t.lsettlement}`;
    return `<b>${options.properties[`ADM${drilldownLevel+1}_${t.code}`]}</b> ${region}<br>${t.spending}: ${options.value.toLocaleString()} ${t.lamount}`.replaceAll(',', ' ');;
};

export const monthFormatter = {
    month: function() {
        const date = new Date(this.value);
        return t.monthNames[date.getUTCMonth()];
    }
};
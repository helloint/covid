function extendCalcData(data) {
    var total_cured = 0,
        total_confirm = 0,
        total_wzz = 0,
        total_zhuangui = 0,
        total_death = 0;
    Object.entries(data.daily).forEach(([date, dailyData]) => {
        total_cured = total_cured + dailyData['cured'];
        dailyData['history_total_cured'] = total_cured + 385;
        dailyData['confirm-wzz_percent'] = parseInt(dailyData['confirm'] / dailyData['wzz'] * 10000, 10) / 100 + '%';
        dailyData['wzz-zhuangui_percent'] = parseInt(dailyData['zhuangui'] / dailyData['wzz'] * 10000, 10) / 100 + '%';
        total_confirm = total_confirm + dailyData['confirm'];
        dailyData['total_confirm'] = total_confirm;
        total_wzz = total_wzz + dailyData['wzz'];
        dailyData['total_wzz'] = total_wzz;
        total_zhuangui = total_zhuangui + dailyData['zhuangui'];
        dailyData['total_zhuangui'] = total_zhuangui;
        dailyData['total_wzz_correct'] = dailyData['total_wzz'] - dailyData['total_zhuangui'];
        total_death = total_death + dailyData['death'];
        dailyData['total_death'] = total_death;
    });
    return data;
}
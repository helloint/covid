var config = {};
config.fakeid = 'MjM5NTA5NzYyMA==';
config.token = '';
config.cookie = '';
config.links = [
    // ['2022-02-26','https://mp.weixin.qq.com/s/jpToJCcWCPWnCHvH8jOY2w'],
    // ['2022-02-27','https://mp.weixin.qq.com/s/8CC7x6vW2TKI6sKqOekMGg'],
    // ['2022-02-28','https://mp.weixin.qq.com/s/LXNrvU2ot8cvgIr2OHkWyA'],
    // ['2022-03-01','https://mp.weixin.qq.com/s/fdQQmBiK_hm3Erg_99k-xw'],
    // ['2022-03-02','https://mp.weixin.qq.com/s/shipU1Tz-9JLwVwUl0pCmg'],
    // ['2022-03-03','https://mp.weixin.qq.com/s/Jlnl9fkV5q368tEgtta-6Q'],
    // ['2022-03-04','https://mp.weixin.qq.com/s/RAmdUMyQxuWlEAv5gG1U7A'],
    // ['2022-03-05','https://mp.weixin.qq.com/s/k0y4SvCRKtR9RyKeAi15ng'],
    // ['2022-03-06','https://mp.weixin.qq.com/s/-osxhdKAgIv9Yz6_7uKTrA'],
    // ['2022-03-07','https://mp.weixin.qq.com/s/8ab50NJNL7zbaDC8HbMMFQ'],
    // ['2022-03-08','https://mp.weixin.qq.com/s/ccZhy4RexXajKwoeX8pURw'],
    // ['2022-03-09','https://mp.weixin.qq.com/s/9_HUJ4bc58bJP_InkqMKhw'],
    // ['2022-03-10','https://mp.weixin.qq.com/s/TXbtjAgxlR5rvgaCJ_dt7A'],
    // 这之前的文字版本差异太大, 没法解析。
    ['2022-03-11','https://mp.weixin.qq.com/s/e_1M17uJPRITsLaYcdgnxA'],
    ['2022-03-12','https://mp.weixin.qq.com/s/MbQoeN54jg0xVDsMl4oTxw'],
    ['2022-03-13','https://mp.weixin.qq.com/s/kdSUGd2xGR6Xx-HfekKUSA'],
    ['2022-03-14','https://mp.weixin.qq.com/s/15EJxTQ-lmatQhze30R9-g'],
    ['2022-03-15','https://mp.weixin.qq.com/s/G77OEw8GgiJQiAkRH3tOlw'],
    ['2022-03-16','https://mp.weixin.qq.com/s/J8Ib1MFCWI6vouw5Gz2MiQ'],
    ['2022-03-17','https://mp.weixin.qq.com/s/ZSIDH6G-IIrWUmXKpWGulg'],
    ['2022-03-18','https://mp.weixin.qq.com/s/OFt7LzeHt8fNl6GqPpkD1g'],
    ['2022-03-19','https://mp.weixin.qq.com/s/ZkFbmJMo6tUiFHezQeArsQ'],
    ['2022-03-20','https://mp.weixin.qq.com/s/nVDL7sPkms09qai-LUsWeA'],
    ['2022-03-21','https://mp.weixin.qq.com/s/xvI3YyiqPJm-7E0AcfqtiA'],
    ['2022-03-22','https://mp.weixin.qq.com/s/63lyE8S-py-qPNs0hVidNA'],
    ['2022-03-23','https://mp.weixin.qq.com/s/hhszboYJIwWBwUl3eTu-bA'],
    ['2022-03-24','https://mp.weixin.qq.com/s/ERDsKlg9hev6H1PG__DAnw'],
    ['2022-03-25','https://mp.weixin.qq.com/s/xV7WBuu_7D9JA_D2mEOH_w'],
    ['2022-03-26','https://mp.weixin.qq.com/s/BJWNxy6RJ1vjTRLxjrT-eA'],
    ['2022-03-27','https://mp.weixin.qq.com/s/Qj1lyFPzCnAbR_EJBzFRIA'],
    ['2022-03-28','https://mp.weixin.qq.com/s/b50xlqsNgcvuw8JbILsJVw'],
    ['2022-03-29','https://mp.weixin.qq.com/s/ou48Io0NdHAzP6g89yp5Sg'],
    ['2022-03-30','https://mp.weixin.qq.com/s/iaU47C-9pA_amrrVRupb0w'],
    ['2022-03-31','https://mp.weixin.qq.com/s/3RmzomqKwlXl0L_SAarnEg'],
    ['2022-04-01','https://mp.weixin.qq.com/s/-W3o-tlKXZFTBOGgSKnEwA'],
    ['2022-04-02','https://mp.weixin.qq.com/s/K3KUe2X9Y0o9MrMg7hf4Ng'],
    ['2022-04-03','https://mp.weixin.qq.com/s/4BMkUSlU7DYdvgoLyMkYyQ'],
    ['2022-04-04','https://mp.weixin.qq.com/s/EEtAYt7eskfNz4A-OuBIYA'],
    ['2022-04-05','https://mp.weixin.qq.com/s/knbDe8_s_1POJJnXDmBVXA'],
    ['2022-04-06','https://mp.weixin.qq.com/s/6ZmYd30MvJIltQIre6XMvA'],
    ['2022-04-07','https://mp.weixin.qq.com/s/h_nGXZEav52TrJfIzaC1FQ'],
    ['2022-04-08','https://mp.weixin.qq.com/s/FBRtpIMlQEDd8b7mbtYENw'],
    ['2022-04-09','https://mp.weixin.qq.com/s/s_Ylm-oTP-frivKUR6Wo_A'],
    ['2022-04-10','https://mp.weixin.qq.com/s/FVqVXKK8EBnUe9sG1Gxq8g'],
    ['2022-04-11','https://mp.weixin.qq.com/s/eun72mybh5Uy0k2m88ae_Q'],
    ['2022-04-12','https://mp.weixin.qq.com/s/SQoQiurUqYMz6xOvuBdVWw'],
    ['2022-04-13','https://mp.weixin.qq.com/s/C8CaP7iR8Bi1HizU9NnjDw'],
    ['2022-04-14','https://mp.weixin.qq.com/s/CuoDLOZXhBl5HREQZe_9IQ'],
    ['2022-04-15','https://mp.weixin.qq.com/s/SE0_F-Bwc2JFM_qKLwXpyQ'],
    ['2022-04-16','https://mp.weixin.qq.com/s/9YaDe0nseAmv58IwTQfakQ'],
    ['2022-04-17','https://mp.weixin.qq.com/s/wuZXG2rdCKi-A5sZQJdKfA'],
    ['2022-04-18','https://mp.weixin.qq.com/s/lSysAcZ6cJTJRfgu9M9hjQ'],
    ['2022-04-19','https://mp.weixin.qq.com/s/9VrtdzjAQC-3rvgokmGmBg'],
    ['2022-04-20','https://mp.weixin.qq.com/s/5LQeyprKrAgx__a9Ul037w'],
    ['2022-04-21','https://mp.weixin.qq.com/s/BTtYkDdU6t6OGF0a8kE3Zg'],
    ['2022-04-22','https://mp.weixin.qq.com/s/xxXPs9eVCdfm9yrjbt9mNQ'],
    ['2022-04-23','https://mp.weixin.qq.com/s/AuSlHyEj-MM4MfTlnFyWZg'],
    ['2022-04-24','https://mp.weixin.qq.com/s/Dm0pjazKR_Fxb8-jScmmvA'],
    ['2022-04-25','https://mp.weixin.qq.com/s/KZCe8ZJ4Im3L9rsHVFrmqQ'],
    ['2022-04-26','https://mp.weixin.qq.com/s/zH8lKAD_P6ykUzNLfrrtQg'],
    ['2022-04-27','https://mp.weixin.qq.com/s/rufH4lvC5yO1835aNhs93A'],
    ['2022-04-28','https://mp.weixin.qq.com/s/yXYX7NlcD0X7sgWZs5s28w'],
    ['2022-04-29','https://mp.weixin.qq.com/s/CYOXGLyfb83mBhXfa-NCrA'],
    ['2022-04-30','https://mp.weixin.qq.com/s/lCLtEnZj04R2ASLdgzViDw'],
    ['2022-05-01','https://mp.weixin.qq.com/s/9JjgWRhVwTN9IY0DYS2ajQ'],
    ['2022-05-02','https://mp.weixin.qq.com/s/6Zk1yLrGojy_5bU4oS9ZTA'],
    ['2022-05-03','https://mp.weixin.qq.com/s/BNp0FTEIV33VRghIpWaXwg'],
    ['2022-05-04','https://mp.weixin.qq.com/s/xps19UKtpgZUEPhfj1GC9Q'],
    ['2022-05-05','https://mp.weixin.qq.com/s/Sq1YN8oMu0RCSddtFnN3tg'],
    ['2022-05-06','https://mp.weixin.qq.com/s/zwbcfAnrreYuw9tUyRJspA'],
    ['2022-05-07','https://mp.weixin.qq.com/s/jlMoi0uCLQOGxNUH-TAZ0g'],
    ['2022-05-08','https://mp.weixin.qq.com/s/cntvgb707GCmMtDwGUOoiQ'],
    ['2022-05-09','https://mp.weixin.qq.com/s/kl9WRMiTBTxcOltkWVgcqg'],
    ['2022-05-10','https://mp.weixin.qq.com/s/h4sJpA6EOUmCtcAPT6nURw'],
    ['2022-05-11','https://mp.weixin.qq.com/s/kNyNia6o6hNPY32NdM2XwA'],
    ['2022-05-12','https://mp.weixin.qq.com/s/HwJtxifyDizLGW3_NHhqJg'],
    ['2022-05-13','https://mp.weixin.qq.com/s/rCMCEYZHZ_kesfdupIPbLA'],
    ['2022-05-14','https://mp.weixin.qq.com/s/miH1BQQV-txwkfv8_1PXsA'],
    ['2022-05-15','https://mp.weixin.qq.com/s/5eHtCZBGZ5OuSHXlcUMafQ'],
    ['2022-05-16','https://mp.weixin.qq.com/s/5xp_Y7j9gWZrLpNj6XSOvA'],
    ['2022-05-17','https://mp.weixin.qq.com/s/wSFyo0UMmY1Azf67E16Aiw'],
    ['2022-05-18','https://mp.weixin.qq.com/s/fzdExYKRAxR8_V_Lk_sJdw'],
    ['2022-05-19','https://mp.weixin.qq.com/s/SBdPT7J_9WJq0Y4bp2SXIA'],
    ['2022-05-20','https://mp.weixin.qq.com/s/WG5vfHOkt55JTZdMsrbFew'],
    ['2022-05-21','https://mp.weixin.qq.com/s/q385QELBASHyzn1xVYVNlA'],
    ['2022-05-22','https://mp.weixin.qq.com/s/nd-S1WZ_XfCZFFmTQ4oKIw'],
];
config.addressLinks = [
    'https://mp.weixin.qq.com/s/rQ385zJfnJQVH1A9TE98TA',//0518
    'https://mp.weixin.qq.com/s/HIjthO2QrWMs3awazdyI5Q',
    'https://mp.weixin.qq.com/s/APzs3KMMjfzAZzhypMXAEg',
    'https://mp.weixin.qq.com/s/XWA8Pzf0DQ5i92si5Epsgg',
    'https://mp.weixin.qq.com/s/FE5FmXxk7180mjqoj9jOSA',
    'https://mp.weixin.qq.com/s/-8XvTb6gxkgfNzMxQ_COZw',
    'https://mp.weixin.qq.com/s/Zpll7k6wZfJiPNeV8sz6Ig',
    'https://mp.weixin.qq.com/s/ofoMUIJOQNAtwGXn7Xqr3g',
    'https://mp.weixin.qq.com/s/edhko1xae7do5FhPSER7Qw',
    'https://mp.weixin.qq.com/s/A5CZRqmuMTdmYcZhdIi9rQ',
    'https://mp.weixin.qq.com/s/PHW04o9E4HKgkGE6wt3suA',
    'https://mp.weixin.qq.com/s/kuCaSb1fFdzaUhwsc6KPSA',
    'https://mp.weixin.qq.com/s/1AsoUPz51QTmNUPItNUCFg',
    'https://mp.weixin.qq.com/s/1AsoUPz51QTmNUPItNUCFg',
    'https://mp.weixin.qq.com/s/CaM334YdoAxbwA8PJ19wcg',
    'https://mp.weixin.qq.com/s/UnPUsNGUyL1_NxBKMQyZpA', //0601
    'https://mp.weixin.qq.com/s/eYimdanb4krg7j_vAJd33g',
    'https://mp.weixin.qq.com/s/z-v2eFk7btPaXEBZro8sqQ',
    'https://mp.weixin.qq.com/s/2zJLbgq0spJfXHY9BLMhWA',
    'https://mp.weixin.qq.com/s/zERWgFNJzWTydSmvjRPFLw',
    'https://mp.weixin.qq.com/s/ft2t7EVyT96YmwXfvd-zQg',
    'https://mp.weixin.qq.com/s/W9tBwbc2tSNe7-zDWw_ViA',
    'https://mp.weixin.qq.com/s/OKxw0qxTtCy_utS5ilh6Lw',
    'https://mp.weixin.qq.com/s/IpYd6G-lavQmufm1DQiFVg',
    'https://mp.weixin.qq.com/s/Cv94y7zJ1THMXBkwKloHkA', // 0610
    'https://mp.weixin.qq.com/s/BUs1bbsc_YTmyFkJ-xdPtw',
    'https://mp.weixin.qq.com/s/7tHJuJUtYEEIqGlywmWpBg',
    'https://mp.weixin.qq.com/s/Brq4G4gZOj2y_F4O8cPm2A',
    'https://mp.weixin.qq.com/s/jNlwZj7s19emjB58lE9rzg',
    'https://mp.weixin.qq.com/s/SHpQtAgzJRTHsypyDtEU3w',
    'https://mp.weixin.qq.com/s/86Ly4-B8zpVAtay0syJuwg',
];

module.exports = config;

let chart;
let series;
let refreshIndex = 0;
let refreshName = 'A';
let MyName = "-";
let wsUri = "ws://localhost:30709/"; // IP !!! 
let websocket;
let stockTable = [];

function rangeCalc(index) {
    $('#now-price').html(numberWithCommas(stockTable[index][1]));

    if (getRadioValue('sb') == null ||
        getTableValue('stock-table', index, 1) == '0') {
        $('#count').attr({
            "max": 0,
            "min": 0
        });

        $('#count').val('0');
        $('#count').attr({ 'disabled': 'disabled' });
        $('.ord.button').addClass('disabled');
        return;
    }

    $('#count').removeAttr('disabled');
    $('.ord.button').removeClass('disabled');

    if (getRadioValue('sb') == 'buy') {
        let max = Math.floor(
            removeComma($('#my-point').text()) /
            removeComma(stockTable[index][1])
        );

        let min = max == 0 ? 0 : 1;

        if (parseInt($('#count').val()) < min)
            $('#count').val('1');
        else if (parseInt($('#count').val()) > max)
            $('#count').val(max);

        if (isInputChecked('always-max')) {
            $('#count').val(max);
        }

        $('#count').attr({
            "max": max,
            "min": min
        });
    }
    else if (getRadioValue('sb') == 'sell') {
        let max = removeComma(getTableValue('stock-table', index, 2));
        let min = max == 0 ? 0 : 1;

        if (parseInt($('#count').val()) < min)
            $('#count').val('1');
        else if (parseInt($('#count').val()) > max)
            $('#count').val(max);

        if (isInputChecked('always-max')) {
            $('#count').val(max);
        }

        $('#count').attr({
            "max": max,
            "min": 1
        });
    }

    $('.conf-count').html(numberWithCommas($('#count').val(), "주"));
}

function optionCheck(index) {
    if (getTableValue('stock-table', index, 1) == '0') {
        $('#buyl').addClass('disabled');
        $('#buy').addClass('disabled');
        $('#selll').addClass('disabled');
        $('#sell').addClass('disabled');

        setRadioValue('sb', 'sell', false);
        setRadioValue('sb', 'buy', false);
    }

    if (removeComma(getTableValue('stock-table', index, 2)) > 0) {
        $('#selll').removeClass('disabled');
        $('#sell').removeClass('disabled');

        if ($('#buy').hasClass('disabled')) {
            setRadioValue('sb', 'sell', true);
        }
    }
    else {
        $('#selll').addClass('disabled');
        $('#sell').addClass('disabled');

        if ($('#buy').hasClass('disabled')) {
            setRadioValue('sb', 'sell', false);
        }
    }

    if (
        Math.floor(
            removeComma($('#my-point').text()) /
            removeComma(stockTable[index][1])
        ) == 0) {
        $('#buyl').addClass('disabled');
        $('#buy').addClass('disabled');

        if ($('#sell').hasClass('disabled')) {
            setRadioValue('sb', 'buy', false);
        }
    }
    else {
        $('#buyl').removeClass('disabled');
        $('#buy').removeClass('disabled');

        if ($('#sell').hasClass('disabled')) {
            setRadioValue('sb', 'buy', true);
        }
    }
}

function indexChange(index) {
    chart.removeSeries(series);

    refreshName = stockTable[index][0];
    refreshIndex = index;

    $('#stock-table tr').removeClass('enabled');
    $('#stock-table tr:eq(' + (index + 1) + ')').addClass('enabled');

    websocket.send(`Prev|${MyName}|${index}`);

    series = chart.addAreaSeries(
        {
            topColor: 'rgba(0, 150, 136, 0.56)',
            bottomColor: 'rgba(0, 150, 136, 0.04)',
            lineColor: 'rgba(0, 150, 136, 1)',
            lineWidth: 2
        });

    $('#now-name').html(refreshName);
    checkV();
}

function checkV() {
    orderSelect(isSetTableValue('stock-table', 0, $('#now-name').html()));
}

function orderSelect(index) {
    optionCheck(index);
    rangeCalc(index);
}

function orderSend() {
    if (parseInt(getInputValue('count')) <= 0 ||
        parseInt($('#count').attr('max')) == 0
    ) {
        alert("거래 가능 수량은 1주 이상입니다.");
        return;
    }

    if (getRadioValue('sb') == 'buy') {
        let selectItem = $('#now-name').html();
        let count = $('#count').val();

        if (isInputChecked('no-alert'))
            websocket.send(`Buy|${MyName}|${selectItem}|${count}`);
        else
            confirmBox(
                '<div class="label conf">주식 이름 : ' + selectItem +
                '</div><div class="label conf">매매 유형 : 매수</div>' +
                '<div class="label conf">매매 수량 : <div class="conf-count"></div></div>',
                () => {
                    let _count = $('#count').val();
                    websocket.send(`Buy|${MyName}|${selectItem}|${_count}`);
                });
    }
    else if (getRadioValue('sb') == 'sell') {
        let selectItem = $('#now-name').html();
        let count = $('#count').val();

        if (isInputChecked('no-alert'))
            websocket.send(`Sell|${MyName}|${selectItem}|${count}`);
        else
            confirmBox(
                '<div class="label conf">주식 이름 : ' + selectItem +
                '</div><div class="label conf">매매 유형 : 매도</div>' +
                '<div class="label conf">매매 수량 : <div class="conf-count"></div></div>',
                () => {
                    let _count = $('#count').val();
                    websocket.send(`Sell|${MyName}|${selectItem}|${_count}`);
                });
    }
}

window.onbeforeunload = () => {
    websocket.close();
}

window.onload = () => {
    let GetPrm = getUrlVars();

    if (GetPrm["teacher"] == '1')
        MyName = decodeURI(GetPrm['grade']);
    else
        MyName = GetPrm['grade'] + "학년 " + GetPrm['class'] + "반 " + GetPrm['number'] + "번 " + decodeURI(GetPrm['name']);

    $('#my-name').html(MyName);

    websocket = new WebSocket(wsUri);

    websocket.onerror = function (params) {
        $('.serv.alert').css("display", "grid");
        $('.serv.alert>.title').html('서버 연결 실패');
        $('.serv.alert>.label').html('F5를 눌러 재접속 해주세요.');
    }

    websocket.onopen = (event) => {
        websocket.send(`MyNameIs|${MyName}`);
    }

    websocket.onmessage = function (evt) {
        let splitText = evt.data.split("|");

        switch (splitText[0]) {
            case "Wait":
                $('#buyl').addClass('disabled');
                $('#buy').addClass('disabled');
                $('#selll').addClass('disabled');
                $('#sell').addClass('disabled');
                $('#count').attr({ 'disabled': 'disabled' });
                $('.button').addClass('disabled');
                $('.logout.button').removeClass('disabled');

                $('.serv.alert>.title').html('서버 연결 성공');
                $('.serv.alert>.label').html('게임 시작 전까지 대기 해주세요.');
                break;

            case "Clear":

                break;

            case "GameStart":
                $('.serv.alert').css("display", "none");
                $('#buyl').removeClass('disabled');
                $('#buy').removeClass('disabled');
                $('#selll').removeClass('disabled');
                $('#sell').removeClass('disabled');
                $('#count').removeAttr('disabled');
                $('.button').removeClass('disabled');
                $('.logout.button').removeClass('disabled');
                break;

            case "EndGame":
                $('.serv.alert>.title').html('게임 종료');
                $('.serv.alert>.label').html('나의 순위 : ' + splitText[1] + '위');
                $('.serv.alert').css("display", "grid");
                $('#buyl').addClass('disabled');
                $('#buy').addClass('disabled');
                $('#selll').addClass('disabled');
                $('#sell').addClass('disabled');
                $('#count').attr({ 'disabled': 'disabled' });
                $('.button').addClass('disabled');
                $('.logout.button').removeClass('disabled');
                break;

            case "AlreadyConnected":
                $('.serv.alert>.title').html('서버 연결 실패');
                $('.serv.alert>.label').html('이미 로그인 되어 있습니다.');
                break;

            case "HelloClient":
                for (let i = 1; i < (splitText.length) / 2; i++) {
                    $('#stock-table')
                        .find('tbody')
                        .append(`<tr onclick="indexChange(${i - 1})"><td>${splitText[i * 2]}</td><td>${numberWithCommas(splitText[i * 2 + 1])}</td><td>0주</td><td></td></tr>`);

                    /* $('#stock-select')
                     .append(`<option onclick="orderSelect(${i - 1})">${splitText[i * 2]}</option>`);
*/
                    stockTable[i - 1] = [splitText[i * 2], splitText[i * 2 + 1]];
                }

                $('#my-point').html(numberWithCommas(splitText[1]));

                indexChange(0);
                break;

            case "MyStocks":
                for (let i = 0; i < (splitText.length - 1) / 2; i++) {
                    let ind = isSetTableValue('stock-table', 0, splitText[i * 2 + 1]);
                    setTableValue('stock-table', ind, 2, numberWithCommas(splitText[i * 2 + 2], "주"));
                }
                break;

            case "RefreshPrice":
                series.update({ time: splitText[1], value: splitText[(refreshIndex + 1) * 2 + 1] });
                let myAll = 0;
                for (let i = 1; i < (splitText.length) / 2; i++) {
                    if (parseInt(splitText[i * 2 + 1]) == 0) {
                        setTableValue('stock-table', i - 1, 1, 0);
                        setTableValue('stock-table', i - 1, 3, "상장 폐지");
                    }
                    else {
                        setTableValue('stock-table', i - 1, 1, numberWithCommas(splitText[i * 2 + 1]));
                        setTableValue('stock-table', i - 1, 3, "거래 가능");
                    }

                    myAll += splitText[i * 2 + 1] *
                        parseInt(
                            removeComma(getTableValue('stock-table', i - 1, 2)
                            ));

                    stockTable[i - 1] = [splitText[i * 2], splitText[i * 2 + 1]];

                    if ($('#now-name').html() == splitText[i * 2]) {
                        orderSelect(i - 1);
                    }
                }
                var pppp = removeComma($('#my-point').html()) + myAll;
                $('#my-all').html(numberWithCommas(pppp));
                break;

            case "PrevPrice":
                series.setData(JSON.parse("[" + splitText[1] + "]"));
                break;

            case "BuySuccess":
                $('#my-point').html(numberWithCommas(splitText[1]));
                ind = isSetTableValue('stock-table', 0, splitText[2]);
                setTableValue('stock-table', ind, 2, numberWithCommas(splitText[3], "주"));
                checkV();
                break;

            case "SellSuccess":
                $('#my-point').html(numberWithCommas(splitText[1]));
                ind = isSetTableValue('stock-table', 0, splitText[2]);
                setTableValue('stock-table', ind, 2, numberWithCommas(splitText[3], "주"));
                checkV();
                break;

            default:

                break;
        }
    };

    var container = document.getElementById('stock-graph');

    chart = window.tvchart = LightweightCharts.createChart('stock-graph', {
        layout: {
            backgroundColor: '#1b262d',
            lineColor: '#2B2B43',
            textColor: '#D9D9D9',
        },
        localization: {
            priceFormatter: function (price) {
                return Math.round(price) + "원";
            }
        },
        priceScale: {
            scaleMargins: {
                top: 0.25,
                bottom: 0.3,
            },
            borderVisible: false,
        },
        timeScale: {
            borderVisible: false,
        },
        grid: {
            horzLines: {
                color: '#eee1',
                visible: true,
            },
            vertLines: {
                color: '#0000',
            },
        },
        crosshair: {
            horzLine: {
                visible: false,
                labelVisible: false
            },
            vertLine: {
                visible: true,
                style: 0,
                width: 2,
                color: 'rgba(0, 150, 136, 1)',
                labelVisible: false,
            }
        },
    });

    series = chart.addAreaSeries(
        {
            topColor: 'rgba(0, 150, 136, 0.56)',
            bottomColor: 'rgba(0, 150, 136, 0.04)',
            lineColor: 'rgba(0, 150, 136, 1)',
            lineWidth: 2
        });

    var toolTipWidth = 80;
    var toolTipHeight = 80;
    var toolTipMargin = 15;

    var toolTip = document.createElement('div');
    toolTip.className = 'floating-tooltip-2';
    container.appendChild(toolTip);

    chart.subscribeCrosshairMove(function (param) {
        if (param.point === undefined || !param.time || param.point.x < 0 || param.point.x > container.clientWidth || param.point.y < 0 || param.point.y > container.clientHeight) {
            toolTip.style.display = 'none';
        } else {
            const dateStr = businessDayToString(param.time);
            toolTip.style.display = 'block';
            var price = param.seriesPrices.get(series);
            toolTip.innerHTML = '<div style="color: #009688">' + refreshName + '</div><div style="font-size: 23px; color: #21384d">' + numberWithCommas(price) + '</div><div style="color: #21384d">' + dateStr + '</div>';
            var coordinate = series.priceToCoordinate(price);
            var shiftedCoordinate = param.point.x - 65;
            if (coordinate === null) {
                return;
            }
            shiftedCoordinate = Math.max(0, Math.min(container.clientWidth - toolTipWidth, shiftedCoordinate));
            var coordinateY = coordinate - toolTipHeight - toolTipMargin > 0 ? coordinate - toolTipHeight - toolTipMargin : Math.max(0, Math.min(container.clientHeight - toolTipHeight - toolTipMargin, coordinate + toolTipMargin));
            toolTip.style.left = shiftedCoordinate + 'px';
            toolTip.style.top = coordinateY - 10 + 'px';
        }
    });
}
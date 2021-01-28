function getUrlVars() {
    var vars = [];
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
        vars[key] = value;
    });
    return vars;
}

function confirmBox(txt, callbackMethod, jsonData) {
    modal({
        type: 'confirm',
        title: '확인',
        text: txt,
        buttons: [{
            eKey: false
        }],
        callback: function (result) {
            if (result) {
                callbackMethod(jsonData);
            }
        }
    });
}

function numberWithCommas(x, type = "원") {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + type;
}

function removeComma(str) {
    return parseInt(str.replace('원', '').replace('주', '').replace(/,/g, ""));
}

function getStockName(index) {
    return $('#stock-table td:eq(' + (index * 3) + ')').text();
}

function getSelectValue(id) {
    var obj = document.getElementById(id);
    return obj.options[obj.selectedIndex].value;
}

function setSelectIndex(id, val) {
    document.getElementById(id).selectedIndex = val;
}

function getInputValue(id) {
    return document.getElementById(id).value;
}

function getRadioValue(name) {
    var obj = document.querySelector('input[name="' + name + '"]:checked');
    return obj == null ? null : obj.value;
}

function setRadioValue(name, id, value) {
    $('input:radio[name=' + name + ']:input[value=' + id + ']').prop("checked", value);
}

function isSetTableValue(id, col, val) {
    let cnt = $('#' + id + ' tr').length - 1;
    for (let i = 0; i < cnt; i++) {
        if ($('table#' + id + '>tbody>tr:eq(' + i + ')>td:eq(' + col + ')').html() == val) {
            return i;
        }
    }
    return null;
}

function isInputChecked(id) {
    return document.getElementById(id).checked;
}

function getTableValue(id, row, col) {
    return $('table#' + id + '>tbody>tr:eq(' + row + ')>td:eq(' + col + ')').html();
}

function setTableValue(id, row, col, val) {
    return $('table#' + id + '>tbody>tr:eq(' + row + ')>td:eq(' + col + ')').html(val);
}

function businessDayToString(businessDay) {
    return businessDay.year + '년 ' + businessDay.month + '월 ' + businessDay.day + "일";
}

$(document).bind('keydown', function (e) {
    if (e.keyCode == 123) {
        e.preventDefault();
        e.returnValue = false;
    }
});
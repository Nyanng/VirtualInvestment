function isVaild() {
    if (document.querySelectorAll(':invalid').length != 0)
        return false;
    return true;
}

function confirmLogin() {
    if (isVaild())
        confirmBox(
            '<div class="label conf">아래 정보로 로그인 하시겠습니까?</div>' +
            '<div class="label conf">정보가 부정확 하면 순위를 매길 때 불이익이 생깁니다.</div>' +
            '<div class="label conf bold">' + getInputValue('grade') + '학년 ' +
            getInputValue('class') + '반 ' +
            getInputValue('number') + '번 ' +
            getInputValue('name') + '</div>',
            () => {
                location.href = 'index.html?grade=' + getInputValue('grade') +
                    '&class=' + getInputValue('class') +
                    '&number=' + getInputValue('number') +
                    '&name=' + getInputValue('name');
            });

    return false;
}
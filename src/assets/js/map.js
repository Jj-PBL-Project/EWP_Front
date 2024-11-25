// 장소 검색 객체를 생성하고 api 초기화
var ps = new kakao.maps.services.Places();

// 키워드로 장소를 검색하는 부분
function searchPlaces() {
    var keyword = document.getElementById('keyword').value;

    if (!keyword.replace(/^\s+|\s+$/g, '')) {
        alert('찾을 장소를 입력해주세요!');
        return false;
    }

    // 장소검색 기능, 키워드로 장소검색을 요청
    ps.keywordSearch(keyword, placesSearchCB);
}

// 장소검색이 완료됐을 때 호출되는 콜백함수입니당
function placesSearchCB(data, status, pagination) {
    if (status === kakao.maps.services.Status.OK) {
        displayPlaces(data);
        displayPagination(pagination);
    } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
        alert('검색 결과가 존재하지 않습니다.');
        return;
    } else if (status === kakao.maps.services.Status.ERROR) {
        alert('검색 결과 중 오류가 발생했습니다.');
        return;
    }
}

// 검색 결과 목록을 표출하는 함수입니다
function displayPlaces(places) {
    var listEl = document.getElementById('placesList'),
        menuEl = document.getElementById('menu_wrap'),
        fragment = document.createDocumentFragment();

    removeAllChildNods(listEl);

    for (var i = 0; i < places.length; i++) {
        var itemEl = getListItem(i, places[i]);
        fragment.appendChild(itemEl);
    }

    listEl.appendChild(fragment);
    menuEl.scrollTop = 0;
}

function displayPagination(pagination) {
    var paginationEl = document.getElementById('pagination'),
        fragment = document.createDocumentFragment(),
        placesListEl = document.getElementById('placesList'),
        i;

    while (paginationEl.hasChildNodes()) {
        paginationEl.removeChild(paginationEl.lastChild);
    }

    for (i = 1; i <= pagination.last; i++) {
        var el = document.createElement('a');
        el.href = "#";
        el.innerHTML = i;

        if (i === pagination.current) {
            el.className = 'on';
        } else {
            el.onclick = (function (i) {
                return function () {
                    pagination.gotoPage(i);
                    placesListEl.scrollTop = 0; // 페이지 변경 후 장소 리스트의 스크롤을 맨 위로 올리는 부분
                }
            })(i);
        }

        fragment.appendChild(el);
    }
    paginationEl.appendChild(fragment);
}

function removeAllChildNods(el) {
    while (el.hasChildNodes()) {
        el.removeChild(el.lastChild);
    }
}
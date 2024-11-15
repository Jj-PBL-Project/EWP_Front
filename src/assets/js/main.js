(function () {
  // Responsive Sidebar Navigation - by CodyHouse.co << 여기서 가져와서 수정함
  var searchInput = document.getElementsByClassName('js-cd-search')[0],
    navList = document.getElementsByClassName('js-cd-nav__list')[0];
  if (searchInput && navList) {
    var sidebar = document.getElementsByClassName('js-cd-side-nav')[0],
      mainHeader = document.getElementsByClassName('js-cd-main-header')[0],
      mobileNavTrigger = document.getElementsByClassName('js-cd-nav-trigger')[0],
      dropdownItems = document.getElementsByClassName('js-cd-item--has-children');

    //on resize, move search and top nav position according to window width
    var resizing = false;
    window.addEventListener('resize', function () {
      if (resizing) return;
      resizing = true;
      (!window.requestAnimationFrame) ? setTimeout(moveNavigation, 300) : window.requestAnimationFrame(moveNavigation);
    });
    window.dispatchEvent(new Event('resize'));//trigger the moveNavigation function

    //on mobile, open sidebar when clicking on menu icon
    mobileNavTrigger.addEventListener('click', function (event) {
      event.preventDefault();
      var toggle = !Util.hasClass(sidebar, 'cd-side-nav--is-visible');
      if (toggle) expandSidebarItem();
      Util.toggleClass(sidebar, 'cd-side-nav--is-visible', toggle);
      Util.toggleClass(mobileNavTrigger, 'cd-nav-trigger--nav-is-visible', toggle);
    });

    // on mobile -> show subnavigation on click
    for (var i = 0; i < dropdownItems.length; i++) {
      (function (i) {
        dropdownItems[i].children[0].addEventListener('click', function (event) {
          if (checkMQ() == 'mobile') {
            event.preventDefault();
            var item = event.target.parentNode;
            Util.toggleClass(item, 'cd-side__item--expanded', !Util.hasClass(item, 'cd-side__item--expanded'));
          }
        });
      })(i);
    }

    //on desktop - differentiate between a user trying to hover over a dropdown item vs trying to navigate into a submenu's contents
    var listItems = sidebar.querySelectorAll('.js-cd-side__list > li');
    new menuAim({
      menu: sidebar,
      activate: function (row) {
        Util.addClass(row, 'hover');
      },
      deactivate: function (row) {
        Util.removeClass(row, 'hover');
      },
      exitMenu: function () {
        hideHoveredItems();
        return true;
      },
      rows: listItems,
      submenuSelector: '.js-cd-item--has-children',
    });

    function moveNavigation() { // move searchInput and navList
      var mq = checkMQ();
      if (mq == 'mobile' && !Util.hasClass(navList.parentNode, 'js-cd-side-nav')) {
        detachElements();
        sidebar.appendChild(navList);
        sidebar.insertBefore(searchInput, sidebar.firstElementChild);
      } else if (mq == 'desktop' && !Util.hasClass(navList.parentNode, 'js-cd-main-header')) {
        detachElements();
        mainHeader.appendChild(navList);
        mainHeader.insertBefore(searchInput, mainHeader.firstElementChild.nextSibling);
      }
      checkSelected(mq);
      resizing = false;
    };

    function detachElements() { // remove element from DOM
      searchInput.parentNode.removeChild(searchInput);
      navList.parentNode.removeChild(navList);
    };

    function hideHoveredItems() { // exit sidebar -> hide dropdown
      var hoveredItems = sidebar.getElementsByClassName('hover');
      for (var i = 0; i < hoveredItems.length; i++) Util.removeClass(hoveredItems[i], 'hover');
    };

    function checkMQ() { // check if mobile or desktop device
      return window.getComputedStyle(mainHeader, '::before').getPropertyValue('content').replace(/'|"/g, "");
    };

    function expandSidebarItem() { // show dropdown of the selected sidebar item
      Util.addClass(sidebar.getElementsByClassName('cd-side__item--selected')[0], 'cd-side__item--expanded');
    };

    function checkSelected(mq) {
      // on desktop, remove expanded class from items (js-cd-item--has-children) that were expanded on mobile version
      if (mq == 'desktop') {
        for (var i = 0; i < dropdownItems.length; i++) Util.removeClass(dropdownItems[i], 'cd-side__item--expanded');
      };
    }
  }
}());

// 로그인, 로그아웃 테스트 영역(정식 릴리즈 시 삭제)
const userState = new UserState();

document.querySelector('.login-btn').addEventListener('click', () => {
  // 테스트용 사용자 데이터
  userState.login({
    name: '홍길동',
    id: '#HONG',
    bio: '안녕하세요.',
    profileImage: 'assets/img/default-profile.png'
  });
});

document.querySelector('.cd-nav__sub-list').addEventListener('click', (e) => {
  if (e.target.textContent === '로그아웃') {
    e.preventDefault();
    userState.logout();
  }
});
// 로그인, 로그아웃 테스트 영역
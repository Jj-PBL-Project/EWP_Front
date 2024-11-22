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

// document.querySelector('.login-btn').addEventListener('click', () => {
// 테스트용 사용자 데이터
// userState.login({
//   name: '홍길동',
//   id: '#HONG',
//   bio: '안녕하세요.',
//   profileImage: 'assets/img/default-profile.png'
// });
// });

document.querySelector('.cd-nav__sub-list').addEventListener('click', (e) => {
  if (e.target.textContent === '로그아웃') {
    e.preventDefault();
    userState.logout();
  }
});
// 로그인, 로그아웃 테스트 영역



// 로그인, 회원가입 모달 표시 함수입니당.
document.addEventListener('DOMContentLoaded', function () {
  // 모든 모달 창을 닫는 함수
  function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
      modal.style.display = 'none';
      if (modal.parentNode === document.body) {
        document.body.removeChild(modal);
      }
    });
  };


  /**
   * 작성자 : 성민우
   * 작성일 : 2024-11-20
   */


  // 호스트 설정
  const host = {
    protocal: "https",
    addr: "ewp.devist.me",
    path: "/api/socket.io"
  }

  // 소켓 연결
  const socket = io(host.protocal + "://" + host.addr, {
    path: host.path,
    transports: ["websocket"]
  });

  // 연결 이벤트
  socket.on("connect", () => {
    console.log("서버와 연결되었습니다.");
  });

  // 오류 이벤트
  socket.on("connect_error", (err) => {
    console.error("Connection error:", err);
  });

  // 회원가입 이벤트
  socket.on('signUpRes', (data) => {
    if (data.status == 200) {
      // 회원가입이 성공한 경우 이벤트
    } else {
      // 회원가입이 실패한 경우 이벤트
    }
  });

  // 중복 아이디 확인 이벤트
  socket.on('checkUserIdRes', (data) => {
    if (data.status == 200) {
      // 사용 가능한 아이디 일 경우 이벤트
    } else {
      // 사용이 불가능한 아이디 일 경우 이벤트
    }
  });

  // 로그인 이벤트
  socket.on('loginRes', (data) => {
    if (data.status == 200) {
      const { userName, userBirthday, userTag, userBio, userProfileImgUrl } = data.data;

      userState.login({
        name: userName,
        id: userTag,
        bio: userBio,
        profileImage: userProfileImgUrl ?? 'assets/img/default-profile.png'
      });
      closeAllModals();
    } else {
      alert(data.message);
    }
  });

  // 로그인 모달 표시 함수
  function showLoginModal() {
    fetch('modal.html')
      .then(response => response.text())
      .then(data => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(data, 'text/html');
        const loginModal = doc.querySelector('#loginModal');
        document.body.appendChild(loginModal);
        loginModal.style.display = 'block';

        // 회원가입 링크 이벤트 리스너 
        const signupLink = loginModal.querySelector('.signup_text a');
        signupLink.addEventListener('click', function (e) {
          e.preventDefault();
          showSignupModal();
        });

        // 닫기 버튼 이벤트 리스너
        const closeButton = loginModal.querySelector('.close-button');
        closeButton.addEventListener('click', closeAllModals);

        // 로그인 버튼 이벤트 리스너
        const loginBtn = loginModal.querySelector("#btnLogin");
        console.log(loginBtn);

        loginBtn.addEventListener('click', (e) => {
          e.preventDefault();

          const userId = loginModal.querySelector("#loginId").value;
          const userPassword = loginModal.querySelector("#loginPw").value;

          // 만약 알맞은 정보가 없을 경우
          if (!userId || !userPassword)
            return alert("아이디 또는 비밀번호가 잘못되었습니다.");

          // 소켓에 데이터 전송
          socket.emit("login", { userId, userPassword });
        });
      });
  }

  // 회원가입 모달 표시 함수
  function showSignupModal() {
    fetch('modal.html')
      .then(response => response.text())
      .then(data => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(data, 'text/html');
        const signupModal = doc.querySelector('#signupModal');
        document.body.appendChild(signupModal);
        signupModal.style.display = 'block';

        // DOM 요소 참조 수정 - signupModal 내부에서 검색
        const elInputUsername = signupModal.querySelector('#signupId');
        const elSuccessMessage = signupModal.querySelector('.success-message');
        const elFailureMessage = signupModal.querySelector('.failure-message');
        const elFailureMessageTwo = signupModal.querySelector('.failure-message2');
        const elInputPassword = signupModal.querySelector('#signupPw');
        const elInputPasswordRetype = signupModal.querySelector('#signupPwConfirm');
        const elMismatchMessage = signupModal.querySelector('.status-text');
        const elStrongPasswordMessage = signupModal.querySelector('.strongPassword-message');

        // 유효성 검사 함수들
        // 글자 수 제한
        function idLength(value) {
          return value.length >= 4 && value.length <= 12
        }

        // 영어 또는 숫자만 가능
        function onlyNumberAndEnglish(str) {
          return /^[A-Za-z0-9][A-Za-z0-9]*$/.test(str);
        }

        // 비밀번호 8글자 이상, 영어, 숫자, 특수문자 포함
        function strongPassword(str) {
          return /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/.test(str);
        }

        // 비밀번호와 비밀번호 확인 일치 여부
        function isMatch(pw1, pw2) {
          return pw1 === pw2;
        }

        // 아이디 유효성 검사 이벤트 리스너
        elInputUsername.addEventListener('keyup', function () {
          if (elInputUsername.value.length !== 0) {
            if (!onlyNumberAndEnglish(elInputUsername.value)) {
              elSuccessMessage.classList.add('hide');
              elFailureMessage.classList.add('hide');
              elFailureMessageTwo.classList.remove('hide');
            } else if (!idLength(elInputUsername.value)) {
              elSuccessMessage.classList.add('hide');
              elFailureMessage.classList.remove('hide');
              elFailureMessageTwo.classList.add('hide');
            } else {
              elSuccessMessage.classList.remove('hide');
              elFailureMessage.classList.add('hide');
              elFailureMessageTwo.classList.add('hide');
            }
          } else {
            elSuccessMessage.classList.add('hide');
            elFailureMessage.classList.add('hide');
            elFailureMessageTwo.classList.add('hide');
          }
        });

        // 비밀번호 양식 유효성 검사 이벤트 리스너
        elInputPassword.addEventListener('keyup', function () {
          if (elInputPassword.value.length !== 0) {
            elStrongPasswordMessage.classList.toggle('hide', strongPassword(elInputPassword.value));
          } else {
            elStrongPasswordMessage.classList.add('hide');
          }
        });

        // 비밀번호 확인 이벤트 리스너
        elInputPasswordRetype.addEventListener('keyup', function () {
          if (elInputPasswordRetype.value.length !== 0) {
            if (isMatch(elInputPassword.value, elInputPasswordRetype.value)) {
              elMismatchMessage.classList.add('hide');
            } else {
              elMismatchMessage.classList.remove('hide');
            }
          } else {
            elMismatchMessage.classList.add('hide');
          }
        });

        // 아이디 중복확인 버튼 이벤트 리스너
        const idCheckButton = signupModal.querySelector('.id-check-btn');
        idCheckButton.addEventListener('click', function (e) {
          e.preventDefault();
          const userId = elInputUsername.value;

          // 아이디 형식 검사
          if (!idLength(userId) || !onlyNumberAndEnglish(userId)) {
            alert('아이디는 4~12글자의 영문자와 숫자만 사용 가능합니다.');
            elInputUsername.focus();
            return;
          }

          // ***여기에 중복확인 로직 작성하시면 됩니다.***
          socket.emit("checkUserIdRes", { userId });
        });

        // 닫기 버튼 이벤트 리스너
        const closeButton = signupModal.querySelector('.close-button');
        closeButton.addEventListener('click', closeAllModals);

        // 회원가입 버튼 이벤트 리스너
        const signupButton = signupModal.querySelector('.btn-submit');
        signupButton.addEventListener('click', function (e) {
          e.preventDefault();

          // 모든 입력값 가져오기
          const userName = signupModal.querySelector('#userName').value;
          const userBirthday = signupModal.querySelector('#userBirthday').value;
          const userId = elInputUsername.value;
          const userPassword = elInputPassword.value;
          const userPasswordConfirm = elInputPasswordRetype.value;
          const termsAgreed = signupModal.querySelector('#terms').checked;

          // 모든 필드가 입력되었는지 확인
          if (!userName || !userBirthday || !userId || !userPassword || !userPasswordConfirm) {
            alert('모든 필수 정보를 입력해주세요.');
            return;
          }

          // 아이디 유효성 검사
          if (!idLength(userId) || !onlyNumberAndEnglish(userId)) {
            alert('아이디는 4~12글자의 영문자와 숫자만 사용 가능합니다.');
            elInputUsername.focus();
            return;
          }

          // 비밀번호 유효성 검사
          if (!strongPassword(userPassword)) {
            alert('비밀번호는 8글자 이상이며, 영문자, 숫자, 특수문자를 포함해야 합니다.');
            elInputPassword.focus();
            return;
          }

          // 비밀번호 일치 확인
          if (!isMatch(userPassword, userPasswordConfirm)) {
            alert('비밀번호가 일치하지 않습니다.');
            elInputPasswordRetype.focus();
            return;
          }

          // 개인정보 수집 동의 확인
          if (!termsAgreed) {
            alert('개인정보 수집에 동의해주세요.');
            return;
          }

          // 이상이 없으면 소켓에 데이터 전송, 이 부분 백엔드 쪽에서 보완하시면 됩니다.
          socket.emit('signUp', {
            userName,
            userBirthday,
            userId,
            userPassword
          });

          // 회원가입 성공 시 회원가입 모달이 닫히고, 로그인 모달이 보여지는 형식
          closeAllModals();
          showLoginModal();
        });
      })
      .catch(error => {
        console.error('모달 로딩 중 오류 발생:', error);
      });
  }

  // 로그인 버튼 클릭 이벤트 여기에 로그인 처리 기능 추가하면 될듯. 
  const loginButton = document.querySelector('.login-btn');
  loginButton.addEventListener('click', showLoginModal);

});


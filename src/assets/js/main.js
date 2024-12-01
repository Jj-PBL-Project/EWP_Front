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

document.addEventListener('DOMContentLoaded', function () {
  const userState = new UserState();

  // 로그인, 로그아웃 테스트 영역(정식 릴리즈 시 삭제)

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
    if (e.target.textContent === '계정 관리') { // 수정된 부분
      e.preventDefault();
      userState.editUserData();
    }
  });

  document.querySelector('.cd-nav__sub-list').addEventListener('click', (e) => {
    if (e.target.textContent === '로그아웃') {
      e.preventDefault();
      userState.logout();
    }
  });
  // 로그인, 로그아웃 테스트 영역

  // 로그인, 회원가입 모달 표시 함수입니당.
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
  const socket = io(host.protocal + "://" + host.addr + "/", {
    path: host.path,
    transports: ["websocket"]
  });

  // 연결 이벤트
  socket.on("connect", () => {
    console.log("서버와 연결되었습니다.");
    // 소켓 연결시 알림 받아오기 부분
    socket.emit('소켓알림받는함수'); // 여기 부분은 실제 알림 받아오는 명칭으로 변경하면 됩니다.
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
      const { userName, userBirthday, userTag, userBio, userProfileImgUrl, userAlarm } = data.data;

      userState.login({
        name: userName,
        id: userTag,
        bio: userBio,
        profileImage: userProfileImgUrl ?? 'assets/img/default-profile.svg',
        userAlarm: userAlarm // userAlarm 데이터로 변경하면 됩니다.
      });
      closeAllModals();

      // 로그인 후 알림 데이터 요청
      socket.emit('getNotifications');
    } else {
      alert(data.message);
    }
  });


  // 서버로부터 알림 목록 수신
  socket.on('notificationList', (data) => {
    if (data.status === 200) {
      window.notifications = data.notifications || [
        "새로운 프로젝트가 할당되었습니다.",
        "회의 일정이 업데이트되었습니다.",
        "업무 보고서 제출 기한이 다가옵니다."
      ]; // 테스트용 알림 데이터 추가
      // 로컬 스토리지에 저장
      localStorage.setItem('notifications', JSON.stringify(window.notifications));
      initializeNotificationCount();
    }
  });

  // 새로운 알림 수신
  socket.on('newNotification', (notification) => {
    window.notifications.unshift(notification); // 새 알림을 배열 앞에 추가
    // 로컬 스토리지에 저장
    localStorage.setItem('notifications', JSON.stringify(window.notifications));
    initializeNotificationCount();
    // 선택적: 새 알림 토스트 메시지 표시
    showNotificationToast(notification);
  });

  // 알림 삭제 응답 처리
  socket.on('notificationDeleted', (data) => {
    if (data.status === 200) {
      // 서버에서 삭제 성공 시 UI 업데이트
      const index = window.notifications.findIndex(n => n.id === data.notificationId);
      if (index !== -1) {
        window.notifications.splice(index, 1);
        // 로컬 스토리지에 저장
        localStorage.setItem('notifications', JSON.stringify(window.notifications));
        initializeNotificationCount();
      }
    }
  });

  // 알림 삭제 함수 수정
  function deleteNotification(index) {
    // 서버에 삭제 요청
    socket.emit('deleteNotification', { notificationId });
    // 낙관적 UI 업데이트
    window.notifications.splice(index, 1);
    // 로컬 스토리지에 저장
    localStorage.setItem('notifications', JSON.stringify(window.notifications));
    updateNotifications();
  }

  /*
  // 서버에서 보낼 알림의 양식
  socket.emit('newNotification', {
    id: "unique-notification-id",
    message: "30분 후 회의 예정 입니다.", // "남은시간" 후 "이벤트" 예정입니다. 이런식으로 메세지를 보내면 될듯
    timestamp: "2024-01-01T00:00:00Z",
    type: "meeting" <- 여기 부분은 알림의 타입이나 타입마다 별도의 이벤트가 없다면 없애도 될듯?
  });
  */

  // 알림 메세지 토스트 부분인데 일단 자리만 만듬
  function showNotificationToast(notification) {
    // 토스트 메시지 부분
  }

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

  const selectAllCheckbox = document.getElementById('selectAll');
  const filterCheckboxes = document.querySelectorAll('.event_filter');

  // 모두 선택 체크박스 변경 시 모든 필터 체크박스 상태 변경
  selectAllCheckbox.addEventListener('change', function () {
    filterCheckboxes.forEach(checkbox => {
      checkbox.checked = selectAllCheckbox.checked;
    });
  });

  // 개별 필터 체크박스 변경 시 모두 선택 체크박스 상태 업데이트
  filterCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function () {
      if (!checkbox.checked) {
        selectAllCheckbox.checked = false;
      } else {
        const allChecked = Array.from(filterCheckboxes).every(cb => cb.checked);
        selectAllCheckbox.checked = allChecked;
      }
    });
  });

  // 알림 모달 처리
  const notificationTrigger = document.querySelector('.cd-side__item--notifications a');

  function showNotificationModal() {
    fetch('modal.html')
      .then(response => response.text())
      .then(data => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(data, 'text/html');
        const notificationModal = doc.querySelector('#notificationModal');

        // 기존 모달이 있다면 제거
        const existingModal = document.querySelector('#notificationModal');
        if (existingModal) {
          existingModal.remove();
        }

        document.body.appendChild(notificationModal);
        notificationModal.style.display = 'block';

        // 알림 목록 생성 (예시 데이터)
        const notificationList = notificationModal.querySelector('#notificationList');
        const countElement = document.querySelector('.cd-count');

        function updateNotifications() {
          const notifications = window.notifications ?? [];
          if (notifications.length === 0) {
            notificationList.innerHTML = '<div class="notification-empty">알림이 없습니다</div>';
            countElement.style.display = 'none';
          } else {
            notificationList.innerHTML = notifications.map(notification =>
              `<li class="notification-item">
                ${notification.content}
                <button class="delete-btn" id="${notification.UUID}">
                  <img src="assets/img/gal.svg" alt="삭제">
                </button>
              </li>`
            ).join('');
            countElement.style.display = 'inline-flex';
            countElement.textContent = notifications.length;
          }

          // 삭제 버튼 이벤트 
          const deleteButtons = notificationModal.querySelectorAll('.delete-btn');
          deleteButtons.forEach((button, index) => {
            button.addEventListener('click', () => {
              // 서버에 삭제 요청 생략
              socket.emit('alarmHandlers', { type: 'deleteAlarm', deleteId: button.id });
              // 즉시 삭제 처리
              window.notifications.splice(index, 1);
              localStorage.setItem('notifications', JSON.stringify(window.notifications));
              updateNotifications();
            });
          });
        }

        // 초기 알림 목록 표시
        updateNotifications();

        // 닫기 버튼 이벤트 
        const closeButton = notificationModal.querySelector('.close-button');
        closeButton.addEventListener('click', () => {
          notificationModal.style.display = 'none';
        });
      });
  }

  // 알림 아이콘 클릭 이벤트
  notificationTrigger.addEventListener('click', function (e) {
    e.preventDefault();
    showNotificationModal();
  });

  // 초기화 후 로그인 상태 확인 및 알림 데이터 요청
  if (userState.isLoggedIn) {
    socket.emit('getNotifications');
  }
});


// 사용자 상태를 관리하는 클래스 정의

class UserState {
    
    constructor() {
        // 로그인 여부를 나타내는 변수
        this.isLoggedIn = false;
        // 사용자 데이터를 저장하는 객체
        this.userData = null;
        // 초기화 메서드 호출
        this.init();
    }

    // 초기화 메서드: 로컬 스토리지에서 사용자 데이터 및 알림 데이터 로드
    init() {
        this.logout();
        const savedUser = localStorage.getItem('userData');
        if (savedUser) {
            // 저장된 사용자 데이터가 있으면 파싱하여 설정
            this.userData = JSON.parse(savedUser);
            this.isLoggedIn = true;
        }
        // 알림 데이터 로드
        const savedNotifications = localStorage.getItem('notifications');
        if (savedNotifications) {
            window.notifications = JSON.parse(savedNotifications);
        }
        // UI를 현재 상태에 맞게 업데이트
        this.updateUI();
    }

    // 로그인 메서드: 사용자 데이터 설정 및 로컬 스토리지에 저장
    login(userData) {
        this.userData = userData;
        this.isLoggedIn = true;
        localStorage.setItem('userData', JSON.stringify(userData));
        // 알림 데이터를 window.notifications에 저장하고 로컬 스토리지에도 저장
        window.notifications = this.userData.userAlarm ?? [];
        console.log(window.notifications);
        localStorage.setItem('notifications', JSON.stringify(window.notifications));
        // UI 업데이트
        this.updateUI();

        // 로그인 시 캘린더 일정 요청
        window.socket.emit('scheduleHandlers', {
            type: 'readMonth',
            data: {
                startDate: new Date(new Date().setDate(1)), 
                endDate: new Date(new Date().setMonth(new Date().getMonth() + 1, 0)) 
            }
        });
    }

    // 로그아웃 메서드: 사용자 데이터 초기화 및 로컬 스토리지에서 제거
    logout() {
        this.userData = null;
        this.isLoggedIn = false;
        localStorage.removeItem('userData');
        // 알림 배열 초기화 및 로컬 스토리지에서 제거
        window.notifications = [];
        this.initializeNotificationCount();
        localStorage.removeItem('notifications');
        // UI 업데이트
        this.updateUI();
    }

    // 로그인 상태 확인 메서드 추가
    isUserLoggedIn() {
        return this.isLoggedIn;
    }

    // UI 업데이트 메서드: 로그인 상태에 따라 화면 요소를 조정
    updateUI() {
        // 필요한 DOM 요소를 가져옴
        const userAccount = document.getElementById('userAccount');
        const loginButton = document.getElementById('loginButton');
        const userProfile = document.getElementById('userProfile');
        const guestProfile = document.getElementById('guestProfile');

        if (this.isLoggedIn && this.userData) {
            // 로그인된 상태일 때 UI 업데이트
            userAccount.style.display = 'block';
            loginButton.style.display = 'none';
            userProfile.style.display = 'block';
            guestProfile.style.display = 'none';

            // 사용자 정보 표시
            document.getElementById('userName').textContent = this.userData.name;
            document.querySelector('.profile-name').textContent = this.userData.name;
            document.querySelector('.profile-id').textContent = `#${this.userData.id}`;
            document.querySelector('.profile-bio').textContent = this.userData.bio;

            // 프로필 이미지가 있으면 설정
            if (this.userData.profileImage) {
                document.getElementById('profileImage').src = this.userData.profileImage;
            }

            // 알림 카운트 초기화
            this.initializeNotificationCount();
        } else {
            // 로그인되지 않은 상태일 때 UI 업데이트
            userAccount.style.display = 'none';
            loginButton.style.display = 'block';
            userProfile.style.display = 'none';
            guestProfile.style.display = 'block';
        }
    }

    // 알림 카운트 초기화 메서드
    initializeNotificationCount() {
        const countElement = document.querySelector('.cd-count');
        // window.notifications가 존재하는지 확인
        const notifications = window.notifications ?? [];
        if (notifications.length > 0) {
            countElement.style.display = 'inline-flex';
            countElement.textContent = notifications.length;
        } else {
            countElement.style.display = 'none';
        }
    }

    // 사용자 정보 수정 모달창
    editUserData() {
        const accountTrigger = document.querySelector("#editData");
        const accountModal = document.getElementById("accountModal");
        const closeBtn = accountModal.querySelector(".close-btn");
        const saveBtn = accountModal.querySelector(".save-btn");
        
        // 기존 이벤트 리스너 제거
        accountTrigger.replaceWith(accountTrigger.cloneNode(true));
        const newAccountTrigger = document.querySelector("#editData");
          
        // 모달 열기 (이벤트 한 번만 등록)
        newAccountTrigger.addEventListener("click", () => {
            accountModal.style.display = "block";
            
            // userData에서 데이터 가져와서 폼 채우기
            if (this.userData) {
                document.getElementById('accountName').value = this.userData.name || '';
                document.getElementById('accountId').value = this.userData.id || '';
                document.getElementById('accountIntro').value = this.userData.bio || '';
                if (this.userData.profileImage) {
                    document.getElementById('previewImage').src = this.userData.profileImage;
                }
            }
        });
          
        // 모달 닫기
        const closeModal = () => {
            accountModal.style.display = "none";
        };

        closeBtn.onclick = closeModal;
            
        // 이미지 미리보기 처리
        const imageInput = document.getElementById('profileImageInput');
        const previewImage = document.getElementById('previewImage');

        imageInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewImage.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        };

        // 모달 저장 버튼 클릭 시 (이벤트 한 번만 등록)
        saveBtn.onclick = () => {
            if (confirm("정보를 수정하시겠습니까?")) {
                const formData = new FormData();
                formData.append('userName', document.getElementById('accountName').value);
                formData.append('userBio', document.getElementById('accountIntro').value);
                
                const imageFile = imageInput.files[0];
                if (imageFile) {
                    formData.append('profileImage', imageFile);
                }

                // 소켓을 통해 서버로 수정 요청
                window.socket.emit('updateUserInfo', formData);

                // 서버 응답 대기
                window.socket.once('updateUserInfoRes', (response) => {
                    if (response.status === 200) {
                        // 수정 성공 시
                        this.userData = {
                            ...this.userData,
                            name: formData.get('userName'),
                            bio: formData.get('userBio'),
                            profileImage: response.profileImageUrl || this.userData.profileImage
                        };
                        // localStorage 업데이트
                        localStorage.setItem('userData', JSON.stringify(this.userData));
                        // UI 업데이트
                        this.updateUI();
                        closeModal();
                        alert("정보가 수정되었습니다.");
                    } else {
                        // 수정 실패 시
                        alert("정보 수정에 실패했습니다.");
                    }
                });
            }
        };
          
        // 모달 외부 클릭 시 닫기
        accountModal.onclick = (event) => {
            if (event.target === accountModal) {
                closeModal();
            }
        };
    }
}

// 전역에서 접근 가능하도록 인스턴스 생성
window.userState = new UserState();

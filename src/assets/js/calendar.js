// ========================== 전역 변수 선언 ==========================
let calendar; // 캘린더 인스턴스 전역 변수
let currentEventAttendees = new Set(); // 현재 이벤트 참석자 집합
let editEventAttendees = new Set(); // 이벤트 수정 시 참석자 집합
window.pageDate = {
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
};
// ========================== 소켓 연결 및 이벤트 리스너  ==========================

socket.on('readMonthScheduleRes', (response) => {
    if (response.status === 200) {
        // 기존 일정 제거 
        calendar.removeAllEvents();

        // 받은 일정 데이터를 캘린더에 추가
        response.data.forEach(schedule => {
            calendar.addEvent({
                id: schedule.UUID, // 서버에서 받은 고유 ID 사용
                title: schedule.scdTitle,
                start: schedule.startDate,
                end: schedule.endDate,
                location: schedule.scdLocation,
                description: schedule.scdContent,
                color: schedule.color,
                display: 'block',
                extendedProps: {
                    calendar: schedule.calendarName,
                    reminder: schedule.scdAlarm,
                    attendees: schedule.tag
                }
            });
        });
        console.log('일정 조회 성공:', response.data);
        calendar.render();
    } else {
        console.error('일정 조회 실패:', response.message);
    }
});

// 일정 추가 응답 이벤트 리스너
socket.on('createScheduleRes', (response) => {
    if (response.status === 201) {
        console.log('일정 추가 성공:', response.data);
    } else {
        console.error('일정 추가 실패:', response.message);
    }
});
// 일정 수정 응답 이벤트 리스너
socket.on('updateScheduleRes', (response) => {
    if (response.status === 200) {
        console.log('일정 수정 성공:', response.data);
        socket.emit('scheduleHandlers', {
            type: 'readMonth',
            data: {
                startDate: window.pageDate.start,
                endDate: window.pageDate.end
            }
        });
    } else {
        console.error('일정 수정 실패:', response.message);
    }
});

// 일정 삭제 응답 이벤트 리스너
socket.on('deleteScheduleRes', (response) => {
    if (response.status === 200) {
        console.log('일정 삭제 성공:', response.data);
    } else if (response.status === 404) {
        console.error('일정 삭제 실패:', response.message);
    } else {
        console.error('일정 삭제 실패:', response.message);
    }
});

//  오류 응답 이벤트 리스너
socket.on('scheduleRes', (response) => {
    if (response.status === 400) {
        console.log('오류', response.data);
    }
});

// 일정 검색 응답 이벤트 리스너
socket.on('searchScheduleRes', (response) => {
    if (response.status === 200) {
        console.log(response.data);
    } else {
        console.error(response.data);
    }
});

/*
// 초대 수락시 초대한 사람 일정 갱신
socket.on('inviteRes', (response) => {
    if (response.status === 200) {
        console.log(response.message);
        socket.emit('scheduleHandlers', {
            type: 'readMonth',
            data: {
                startDate: start,
                endDate: end
            }
        });
    } else {
        console.error(response.message)
    }
});
*/


// ========================== DOMContentLoaded 이벤트(분류에 따른 이벤트 필터 관련) ==========================

document.addEventListener('DOMContentLoaded', () => {
    loadModalHTML().then(() => {
        initializeCalendar(); // 캘린더 초기화
        initializeFilters(); // 필터 초기화
        initializeSearch(); // 검색 기능 초기화
    });
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});

// ========================== 모달 HTML 로드 함수 ==========================

async function loadModalHTML() {
    try {
        const response = await fetch('modal.html');
        const html = await response.text();
        document.getElementById('modalContainer').innerHTML = html;
    } catch (error) {
        console.error('모달 HTML 로드 실패:', error);
    }
}

// ========================== 캘린더 초기화 함수 ==========================

function initializeCalendar() {
    const calendarEl = document.getElementById('calendar');
    calendar = new FullCalendar.Calendar(calendarEl, {
        // 툴바 설정
        headerToolbar: {
            left: 'prevYear,prev,next,nextYear,today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
        },
        initialView: 'dayGridMonth',
        locale: 'ko',
        selectable: true,
        selectMirror: true,
        navLinks: true,
        editable: true,
        height: '100%',
        aspectRatio: 1.8,
        dayMaxEvents: true,
        dayCellDidMount: adjustDayCellStyle, // 일자 셀 스타일 조정
        dayCellContent: formatDayCellContent, // 일자 셀 내용 포맷팅
        dateClick: handleDateClick, // 날짜 클릭 이벤트 처리
        eventClick: handleEventClick, // 이벤트 클릭 이벤트 처리
        eventContent: customizeEventContent, // 이벤트 내용 커스터마이징
        eventClassNames: () => ['custom-event'], // 이벤트 클래스 지정
        events: [], // 초기 이벤트는 빈 배열
        googleCalendarApiKey: '$API_KEY', // 구글 캘린더 API 키
        eventSources: [
            {
                // 한국 공휴일 캘린더
                googleCalendarId: 'ko.south_korea#holiday@group.v.calendar.google.com',
                color: 'white',
                textColor: 'red',
                className: 'holiday-event'
            }
        ],
        datesSet: function (info) {
            // 월이 변경될 때마다 해당 월의 일정 요청
            const start = info.start;
            const end = info.end;

            window.pageDate.start = start;
            window.pageDate.end = end;

            // 로그인 상태일 때만 일정 요청
            if (window.userState.isUserLoggedIn) {
                socket.emit('scheduleHandlers', {
                    type: 'readMonth',
                    data: {
                        startDate: start,
                        endDate: end
                    }
                });
            }
            calendar.render(); // 캘린더 렌더링
        }
    });
    calendar.render(); // 캘린더 렌더링
}

// ========================== 캘린더 관련 함수들 ==========================

// 일자 셀 스타일 조정 함수
function adjustDayCellStyle(arg) {
    arg.el.style.padding = '2px';
    arg.el.style.height = 'auto';
}

// 일자 셀 내용 포맷팅 함수
function formatDayCellContent(arg) {
    arg.dayNumberText = arg.date.getDate(); // 날짜를 숫자로 표시
}

// 이벤트 내용 커스터마이징 함수
function customizeEventContent(arg) {
    return {
        html: `<div class="fc-event-title">${arg.event.title}</div>`
    };
}

// ========================== 필터 초기화 함수 ==========================

function initializeFilters() {
    const filterCheckboxes = document.querySelectorAll('.event_filter');
    const selectAllCheckbox = document.getElementById('selectAll');

    filterCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', handleFilterChange);
    });

    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', handleSelectAllChange);
    }
}

// 필터 변경 시 처리 함수
function handleFilterChange() {
    const selectedCategories = Array.from(document.querySelectorAll('.event_filter'))
        .filter(cb => cb.checked && cb.id !== 'selectAll')
        .map(cb => cb.value);

    if (calendar && typeof calendar.getEvents === 'function') {
        const events = calendar.getEvents();
        events.forEach(event => {
            const eventCategory = event.extendedProps.calendar;
            if (selectedCategories.length === 0 && document.getElementById('selectAll').checked) {
                event.setProp('display', '');
            } else if (selectedCategories.includes(eventCategory)) {
                event.setProp('display', '');
            } else {
                event.setProp('display', 'none');
            }
        });
    }
}

// "모두 선택" 체크박스 변경 시 처리 함수
function handleSelectAllChange() {
    const isChecked = this.checked;
    const filterCheckboxes = document.querySelectorAll('.event_filter');
    filterCheckboxes.forEach(checkbox => {
        if (checkbox !== this) {
            checkbox.checked = isChecked;
        }
    });

    if (calendar && typeof calendar.getEvents === 'function') {
        const events = calendar.getEvents();
        events.forEach(event => {
            event.setProp('display', isChecked ? '' : 'none');
        });
    }
}

// ========================== 검색 기능 초기화 함수 ==========================

function initializeSearch() {
    const searchInput = document.getElementById('searchEvent');
    const eventList = document.getElementById('eventList');
    const backButton = document.getElementById('backToCalendarButton');
    const calendarElement = document.getElementById('calendar');

    if (!searchInput || !eventList || !backButton || !calendarElement) {
        console.error('검색 관련 요소를 찾을 수 없습니다.');
        return;
    }

    searchInput.addEventListener('input', handleSearchInput);
    backButton.addEventListener('click', handleBackToCalendar);
}

// 검색 입력 처리 함수
function handleSearchInput(e) {
    const searchText = e.target.value.toLowerCase().trim();
    const calendarElement = document.getElementById('calendar');
    const eventList = document.getElementById('eventList');

    if (searchText.length > 0) {
        calendarElement.style.visibility = 'hidden';
        eventList.style.display = 'block';
        const events = calendar.getEvents();
        const filteredEvents = events.filter(event => {
            const title = event.title.toLowerCase();
            const description = (event.extendedProps.description || '').toLowerCase();
            const location = (event.extendedProps.location || '').toLowerCase();
            return title.includes(searchText) || description.includes(searchText) || location.includes(searchText);
        });
        displaySearchResults(filteredEvents);
    } else {
        calendarElement.style.visibility = 'visible';
        eventList.style.display = 'none';
    }
}

// 캘린더로 돌아가기 버튼 클릭 처리 함수
function handleBackToCalendar() {
    const calendarElement = document.getElementById('calendar');
    const eventList = document.getElementById('eventList');
    const searchInput = document.getElementById('searchEvent');

    calendarElement.style.visibility = 'visible';
    eventList.style.display = 'none';
    searchInput.value = '';
    calendarElement.style.height = '100%';
    calendar.updateSize();
    calendar.render();
}

// 검색 결과 표시 함수
function displaySearchResults(events) {
    const eventListContent = document.getElementById('eventListContent');
    eventListContent.innerHTML = '';

    if (events.length === 0) {
        eventListContent.innerHTML = '<p class="no-results">검색 결과가 없습니다.</p>';
        return;
    }

    const ul = document.createElement('ul');
    ul.className = 'event-search-results';

    events.forEach(event => {
        const li = document.createElement('li');
        li.className = 'event-search-item';
        const startDate = new Date(event.start).toLocaleString('ko-KR');
        const endDate = event.end ? new Date(event.end).toLocaleString('ko-KR') : '';
        li.innerHTML = `
            <div class="event-title">${event.title}</div>
            <div class="event-details">
                <span class="event-date">${startDate}${endDate ? ` ~ ${endDate}` : ''}</span>
                ${event.extendedProps.location ? `<span class="event-location">📍 ${event.extendedProps.location}</span>` : ''}
                ${event.extendedProps.description ? `<div class="event-description">${event.extendedProps.description}</div>` : ''}
            </div>
        `;
        ul.appendChild(li);
    });

    eventListContent.appendChild(ul);
}

// ========================== 일정 생성 관련 함수 ==========================

// 날짜 클릭 시 처리 함수 (이벤트 추가)
function handleDateClick(info) {
    openEventModal(info.date);
}

// 일정 생성 모달 열기 함수
function openEventModal(date) {
    const modal = document.getElementById('eventModal');
    const form = document.getElementById('eventForm');

    resetEventForm(); // 폼 초기화
    initializeModalAttendees(); // 참석자 초기화

    setEventFormDates(date); // 날짜 설정

    modal.style.display = "block";

    form.onsubmit = handleEventFormSubmit; // 폼 제출 처리

    setModalCloseHandlers(modal, form); // 모달 닫기 핸들러 설정
}

// 일정 생성 폼 초기화 함수
function resetEventForm() {
    const form = document.getElementById('eventForm');
    form.reset();
}

// 모달 참석자 초기화 함수
function initializeModalAttendees() {
    currentEventAttendees.clear();
    const attendeesList = document.getElementById('attendeesList');
    if (attendeesList) {
        attendeesList.innerHTML = '';
    }
}

// 일정 생성 폼 날짜 설정 함수
function setEventFormDates(date) {
    const startDate = new Date(date);
    startDate.setDate(startDate.getDate() + 1);

    const endDate = new Date(startDate.getTime() + (60 * 60 * 1000));

    document.getElementById('eventStart').value = startDate.toISOString().slice(0, 16);
    document.getElementById('eventEnd').value = endDate.toISOString().slice(0, 16);
}

// 일정 생성 폼 제출 처리 함수 수정
function handleEventFormSubmit(e) {
    e.preventDefault();

    const eventData = collectEventDataFromForm('event');

    calendar.addEvent({
        title: eventData.scdTitle,
        start: eventData.startDate,
        end: eventData.endDatend,
        location: eventData.scdLocation,
        description: eventData.scdContent,
        color: eventData.color,
        display: 'block',
        extendedProps: {
            calendar: eventData.calendarName,
            reminder: eventData.scdAlarm,
            attendees: eventData.tag
        }
    });

    alert('서버로 전송할 이벤트 데이터: ' + JSON.stringify(eventData)); // 디버그용

    socket.emit('scheduleHandlers', {
        type: 'create',
        data: eventData
    });

    currentEventAttendees.clear();
    closeModal('eventModal');
    resetEventForm();
}

// 일정 생성 폼에서 이벤트 데이터 수집 함수
function collectEventDataFromForm(prefix) {
    return {
        scdTitle: document.getElementById(`${prefix}Title`).value,
        scdLocation: document.getElementById(`${prefix}Location`).value,
        startDate: document.getElementById(`${prefix}Start`).value,
        endDate: document.getElementById(`${prefix}End`).value,
        tag: Array.from(prefix === 'event' ? currentEventAttendees : editEventAttendees),
        calendarName: document.getElementById(`${prefix}Calendar`).value,
        scdContent: document.getElementById(`${prefix}Description`).value,
        scdAlarm: document.getElementById(`${prefix}Reminder`).value,
        color: document.getElementById(`${prefix}Color`).value
    };
}

// 모달 닫기 함수
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = "none";
}

// 모달 닫기 핸들러 설정 함수
function setModalCloseHandlers(modal, form) {
    const closeButton = modal.querySelector('.close-button');
    const cancelButton = modal.querySelector('.btn-cancel');

    closeButton.onclick = () => closeModal(modal.id);
    cancelButton.onclick = () => closeModal(modal.id);

    window.onclick = (event) => {
        if (event.target == modal) {
            closeModal(modal.id);
        }
    };
}

// ========================== 일정 클릭 관련 함수 ==========================

// 일정 클릭 시 처리 함수 (일정 정보 보기 또는 수정)
function handleEventClick(info) {
    info.jsEvent.preventDefault();
    openEventInfoModal(info.event, info.el);
}

// 일정 정보 모달 열기 함수
function openEventInfoModal(event, eventElement) {
    const infoModal = document.getElementById('eventInfoModal');

    if (!infoModal) {
        console.error('일정 정보 모달을 찾을 수 없습니다.');
        return;
    }

    positionInfoModal(infoModal, eventElement); // 모달 위치 설정
    populateInfoModal(event); // 모달에 일정 정보 채우기

    infoModal.style.display = "block";
    infoModal.style.backgroundColor = 'transparent';

    setInfoModalEventHandlers(infoModal, event); // 모달 일정 핸들러 설정
}

// 일정 정보 모달 위치 설정 함수
function positionInfoModal(modal, eventElement) {
    const rect = eventElement.getBoundingClientRect();
    const modalContent = modal.querySelector('.new-modal-content');
    const windowWidth = window.innerWidth;
    const modalWidth = windowWidth < 480 ? 200 : 300; // 모바일 환경일 때 모달 너비 조정

    // 모달이 잠시 보이도록 설정하여 높이를 측정
    modal.style.display = 'block';
    modal.style.visibility = 'hidden'; // 사용자에게는 보이지 않도록

    // 브라우저 렌더링 이후에 실행되도록 함
    requestAnimationFrame(() => {


        // 좌우 공간 계산
        const spaceLeft = rect.left;
        const spaceRight = windowWidth - rect.right;
        if (spaceRight < modalWidth + 20 && spaceLeft < modalWidth + 20) { // 양쪽 모두 여유 공간 부족
            modalContent.style.left = '50%';
            modalContent.style.right = 'auto';
            modalContent.style.transform = 'translateX(-50%)'; // 중앙 정렬
            modalContent.style.setProperty('--arrow-left', 'auto');
            modalContent.style.setProperty('--arrow-right', 'auto');

            // 화살표를 중앙에 맞추거나 제거할 수도 있음
            modalContent.classList.remove('arrow-right');
        } else if (spaceRight < modalWidth + 20) { // 오른쪽 공간이 부족한 경우 왼쪽에 표시
            modalContent.style.left = 'auto';
            modalContent.style.right = 'auto';
            modalContent.style.transform = 'translateX(calc(-100% - 10px))'; // 모달 너비만큼 왼쪽으로 이동
            modalContent.style.left = rect.left + 'px';
            modalContent.style.setProperty('--arrow-left', 'auto');
            modalContent.style.setProperty('--arrow-right', '-10px');

            // 화살표 방향 변경
            modalContent.classList.add('arrow-right');
        } else { // 기본적으로 오른쪽에 표시
            modalContent.style.left = rect.right + 'px';
            modalContent.style.right = 'auto';
            modalContent.style.transform = 'translateX(10px)';
            modalContent.style.setProperty('--arrow-left', '-10px');
            modalContent.style.setProperty('--arrow-right', 'auto');

            // 화살표 방향 원복
            modalContent.classList.remove('arrow-right');
        }

        // 모달 높이 측정
        const windowHeight = window.innerHeight;
        const modalHeight = 150; // 모달의 높이
        const spaceBottom = windowHeight - rect.bottom;
        if (spaceBottom < modalHeight + 250) { // 여유 공간인데 조정이 좀 필요할듯
            modalContent.style.top = 'auto';
            modalContent.style.bottom = 'auto';
            modalContent.style.transform += ' translateY(calc(-100% - 10px))'; // 모달 높이만큼 위로 이동
            modalContent.style.top = rect.top + 'px';
            modalContent.style.setProperty('--arrow-top', 'auto');
            modalContent.style.setProperty('--arrow-bottom', '-10px');

            // 화살표 방향 변경
            modalContent.classList.add('arrow-bottom');
        } else { // 기본적으로 아래에 표시
            modalContent.style.top = rect.top + 'px';
            modalContent.style.bottom = 'auto';
            modalContent.style.transform += ' translateY(10px)';
            modalContent.style.setProperty('--arrow-top', '-10px');
            modalContent.style.setProperty('--arrow-bottom', 'auto');

            // 화살표 방향 원복
            modalContent.classList.remove('arrow-bottom');
        }

        modalContent.style.margin = '0';
        modalContent.style.width = modalWidth + 'px'; // 모달 너비 설정

        modalContent.style.setProperty('--arrow-left', '-10px');

        // 모달을 다시 보이도록 설정
        modal.style.visibility = 'visible';
    });
}

// 일정 정보 모달에 데이터 채우기 함수
function populateInfoModal(event) {
    const titleEl = document.getElementById('infoEventTitle');
    const locationEl = document.getElementById('infoEventLocation');
    const dateTimeEl = document.getElementById('infoEventDateTime');
    const calendarEl = document.getElementById('infoEventCalendar');
    const attendeesEl = document.getElementById('infoEventAttendees');
    const descriptionEl = document.getElementById('infoEventDescription');

    if (titleEl) titleEl.textContent = event.title;
    if (locationEl) locationEl.textContent = event.extendedProps.location || '(없음)';

    const startDateEl = document.getElementById('infoEventStart');
    const endDateEl = document.getElementById('infoEventEnd');

    if (startDateEl) {
        const startDate = new Date(event.start).toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        startDateEl.textContent = startDate;
    }

    if (endDateEl) {
        if (event.end) {
            const endDate = new Date(event.end).toLocaleString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            endDateEl.textContent = endDate;
        } else {
            endDateEl.textContent = '종료 시간 없음';
        }
    }

    if (calendarEl) calendarEl.textContent = event.extendedProps.calendar || '기본';
    if (attendeesEl) {
        const attendeesList = Array.from(event.extendedProps.attendees || []);
        if (attendeesList.length === 0) {
            attendeesEl.textContent = '(없음)';
        } else if (attendeesList.length === 1) {
            attendeesEl.textContent = attendeesList[0];
        } else {
            const attendeesText = `${attendeesList[0]} 외 ${attendeesList.length - 1}명`;
            const tooltipText = attendeesList.join('\n');
            attendeesEl.innerHTML = `<span class="attendees-tooltip" title="${tooltipText}">${attendeesText}</span>`;
        }
    }
    if (descriptionEl) descriptionEl.textContent = event.extendedProps.description || '(없음)';

    if (dateTimeEl) {
        const startDate = new Date(event.start).toLocaleString('ko-KR');
        const endDate = event.end ? new Date(event.end).toLocaleString('ko-KR') : '';
        const dateTimeText = endDate ? `${startDate} ~ ${endDate}` : startDate;
        dateTimeEl.textContent = dateTimeText;
        dateTimeEl.setAttribute('title', dateTimeText); // 툴팁 내용 설정
    }

    if (descriptionEl) {
        const description = event.extendedProps.description || '(없음)';
        descriptionEl.textContent = description;
        descriptionEl.setAttribute('title', description); // 툴팁 내용 설정
    }

    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.forEach(function (tooltipTriggerEl) {
        new bootstrap.Tooltip(tooltipTriggerEl);
    });
}


// 일정 정보 모달 이벤트 핸들러 설정 함수 수정
function setInfoModalEventHandlers(modal, event) {
    const closeButton = modal.querySelector('.close-button');
    const editButton = modal.querySelector('.btn-edit');
    const deleteButton = modal.querySelector('.btn-delete');

    closeButton.onclick = () => closeModal(modal.id);

    editButton.onclick = () => {
        closeModal(modal.id);
        openEditEventModal(event);
    };

    deleteButton.onclick = () => {
        if (confirm('일정을 삭제하시겠습니까?')) {
            socket.emit('scheduleHandlers', {
                type: 'delete',
                data: { UUID: event.id }
            });
            event.remove();
            closeModal(modal.id);
        }
    };

    window.onclick = (event) => {
        if (event.target == modal) {
            closeModal(modal.id);
        }
    };
}

// ========================== 일정 수정 관련 함수 ==========================

// 일정 수정 모달 열기 함수
function openEditEventModal(event) {
    const editModal = document.getElementById('editEventModal');

    if (!editModal) {
        console.error('이벤트 수정 모달을 찾을 수 없습니다.');
        return;
    }

    resetEditEventForm(); // 폼 초기화
    populateEditEventForm(event); // 폼에 이벤트 데이터 채우기
    initializeEditModalAttendees(event); // 참석자 초기화

    editModal.style.display = "block";

    setEditModalEventHandlers(editModal, event); // 모달 이벤트 핸들러 설정
}

// 일정 수정 폼 초기화 함수
function resetEditEventForm() {
    const form = document.getElementById('editEventForm');
    form.reset();
}

// 일정 수정 폼에 데이터 채우기 함수
function populateEditEventForm(event) {
    const editEventTitle = document.getElementById('editEventTitle');
    const editEventLocation = document.getElementById('editEventLocation');
    const editEventStart = document.getElementById('editEventStart');
    const editEventEnd = document.getElementById('editEventEnd');
    const editEventCalendar = document.getElementById('editEventCalendar');
    const editEventDescription = document.getElementById('editEventDescription');
    const editEventReminder = document.getElementById('editEventReminder');
    const editEventColor = document.getElementById('editEventColor');

    editEventTitle.value = event.title;
    editEventLocation.value = event.extendedProps.location || '';
    editEventCalendar.value = event.extendedProps.calendar || 'default';
    editEventDescription.value = event.extendedProps.description || '';
    editEventReminder.value = event.extendedProps.reminder || '0';
    editEventColor.value = event.backgroundColor || 'red';

    const startDate = new Date(event.start);
    startDate.setMinutes(startDate.getMinutes() - startDate.getTimezoneOffset());
    editEventStart.value = startDate.toISOString().slice(0, 16);

    if (event.end) {
        const endDate = new Date(event.end);
        endDate.setMinutes(endDate.getMinutes() - endDate.getTimezoneOffset());
        editEventEnd.value = endDate.toISOString().slice(0, 16);
    }
}

// 일정 수정 모달 참석자 초기화 함수
function initializeEditModalAttendees(event) {
    editEventAttendees.clear();
    const attendeesList = document.getElementById('editAttendeesList');
    attendeesList.innerHTML = '';

    const attendees = event.extendedProps.attendees || [];
    attendees.forEach(attendee => {
        editEventAttendees.add(attendee);
        addAttendeeToList(attendee, attendeesList, editEventAttendees);
    });
}

// 일정 수정 모달 이벤트 핸들러 설정 함수 수정
function setEditModalEventHandlers(modal, event) {
    const form = document.getElementById('editEventForm');
    const closeButton = modal.querySelector('.close-button');
    const cancelButton = modal.querySelector('.btn-cancel');

    form.onsubmit = (e) => {
        e.preventDefault();
        const eventData = {
            UUID: event.id,
            updateScdTitle: document.getElementById('editEventTitle').value,
            updateScdLocation: document.getElementById('editEventLocation').value,
            updateStartDate: document.getElementById('editEventStart').value,
            updateEndDate: document.getElementById('editEventEnd').value,
            updateTag: Array.from(editEventAttendees),
            updateCalendarName: document.getElementById('editEventCalendar').value,
            updateScdContent: document.getElementById('editEventDescription').value,
            updateScdAlarm: document.getElementById('editEventReminder').value,
        };

        socket.emit('scheduleHandlers', {
            type: 'update',
            data: eventData
        });
        closeModal(modal.id);
    };

    closeButton.onclick = () => closeModal(modal.id);
    cancelButton.onclick = () => closeModal(modal.id);

    window.onclick = (event) => {
        if (event.target == modal) {
            closeModal(modal.id);
        }
    };
}

// 일정 업데이트 함수
function updateEvent(event, eventData) {
    event.setProp('title', eventData.title);
    event.setStart(eventData.start);
    event.setEnd(eventData.end);
    event.setExtendedProp('location', eventData.location);
    event.setExtendedProp('description', eventData.description);
    event.setExtendedProp('calendar', eventData.calendar);
    event.setExtendedProp('reminder', eventData.reminder);
    event.setExtendedProp('attendees', eventData.attendees);
    event.setProp('backgroundColor', eventData.color);
}

// ========================== 참석자 추가 관련 함수 ==========================

// 참석자 목록에 추가하는 유틸리티 함수
function addAttendeeToList(value, listElement, attendeesSet) {
    const attendeeItem = document.createElement('div');
    attendeeItem.className = 'attendee-item';
    attendeeItem.innerHTML = `
        <span>${value}</span>
        <button type="button" class="remove-attendee">&times;</button>
    `;

    attendeeItem.querySelector('.remove-attendee').addEventListener('click', function () {
        attendeesSet.delete(value);
        attendeeItem.remove();
    });

    listElement.appendChild(attendeeItem);
}

// 참석자 추가 버튼 클릭 이벤트 처리 (이벤트 위임 사용)
document.addEventListener('click', (e) => {
    if (e.target.matches('#eventModal .id-check-btn')) {
        const input = document.getElementById('eventAttendees');
        const list = document.getElementById('attendeesList');
        const value = input.value.trim();

        if (!value || !value.includes('#')) return;

        if (currentEventAttendees.has(value)) {
            alert('이미 추가된 참석자입니다.');
            return;
        }

        // 이 부분에 소켓 통신 추가
        // 소켓 통신으로 사용자가 존재하는지 확인하고, 존재하면 참석자 추가
        // 존재하지 않으면 alert으로 사용자가 없다고 알림

        // 입력된 사용자의 아이디를 리스트로 추가
        currentEventAttendees.add(value);
        addAttendeeToList(value, list, currentEventAttendees);
        input.value = '';
    }
    // 일정 수정 참석자 추가
    else if (e.target.matches('#editEventModal .id-check-btn')) {
        const input = document.getElementById('editEventAttendees');
        const list = document.getElementById('editAttendeesList');
        const value = input.value.trim();

        if (!value || !value.includes('#')) return;

        if (editEventAttendees.has(value)) {
            alert('이미 추가된 참석자입니다.');
            return;
        }

        // 이 부분에 소켓 통신 추가
        // 소켓 통신으로 사용자가 존재하는지 확인하고, 존재하면 참석자 추가
        // 존재하지 않으면 alert으로 사용자가 없다고 알림

        // 입력된 사용자의 아이디를 리스트로 추가
        editEventAttendees.add(value);
        addAttendeeToList(value, list, editEventAttendees);
        input.value = '';
    }
});

// ========================== 장소 검색 관련 함수 ==========================

// 지도 검색 버튼 클릭 이벤트 처리
document.addEventListener('click', function (e) {
    if (e.target.matches('#mapSearch, #editMapSearch')) {
        const mapSearchModal = document.getElementById('mapSearchModal');
        mapSearchModal.style.display = "block";

        // 현재 활성화된 모달의 location input 저장
        window.activeLocationInput = e.target.id === 'mapSearch' ?
            document.getElementById('eventLocation') :
            document.getElementById('editEventLocation');
    }
});

// 지도 검색 모달 닫기 버튼 클릭 이벤트 처리
document.addEventListener('click', function (e) {
    if (e.target.matches('#mapSearchModal .close-button')) {
        const mapSearchModal = document.getElementById('mapSearchModal');
        mapSearchModal.style.display = "none";
    }
});

// 검색 버튼 클릭 이벤트 처리
document.addEventListener('click', function (e) {
    if (e.target.id === 'searchButton') {
        searchPlaces();
    }
});

// 검색어 입력 후 엔터키 처리
document.addEventListener('keypress', function (e) {
    if (e.target.id === 'keyword' && e.key === 'Enter') {
        e.preventDefault();
        searchPlaces();
    }
});


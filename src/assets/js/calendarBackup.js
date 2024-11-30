let calendar; // 전역 변수로 calendar 인스턴스 선언

document.addEventListener('DOMContentLoaded', function () {
    // 모달 HTML 지정 및 캘린더 초기화
    fetch('modal.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('modalContainer').innerHTML = html;
            initializeCalendar(); // 모달 로드 후 캘린더 초기화
            initializeFilters(); // 필터 초기화
            initializeSearch(); // 검색 기능 초기화 추가
        });
});

// 검색 기능 초기화 함수 추가
function initializeSearch() {
    const searchInput = document.getElementById('searchEvent');
    const eventList = document.getElementById('eventList');
    const eventListContent = document.getElementById('eventListContent');
    const backButton = document.getElementById('backToCalendarButton');
    const calendarElement = document.getElementById('calendar');

    if (!searchInput || !eventList || !eventListContent || !backButton || !calendarElement) {
        console.error('검색 관련 엘리먼트를 찾을 수 없습니다.');
        return;
    }

    searchInput.addEventListener('input', function(e) {
        const searchText = e.target.value.toLowerCase().trim();
        
        if (searchText.length > 0) {
            // 캘린더는 visibility로 제어
            calendarElement.style.visibility = 'hidden';
            // 검색 결과는 display로 제어
            eventList.style.display = 'block';
            
            // 모든 이벤트 가져오기
            const events = calendar.getEvents();
            
            // 검색어와 일치하는 이벤트 필터링
            const filteredEvents = events.filter(event => {
                const title = event.title.toLowerCase();
                const description = (event.extendedProps.description || '').toLowerCase();
                const location = (event.extendedProps.location || '').toLowerCase();
                
                return title.includes(searchText) || 
                       description.includes(searchText) || 
                       location.includes(searchText);
            });
            
            displaySearchResults(filteredEvents);
        } else {
            calendarElement.style.visibility = 'visible';
            eventList.style.display = 'none';
        }
    });

    // 뒤로가기 버튼 수정
    backButton.addEventListener('click', function() {
        calendarElement.style.visibility = 'visible';
        eventList.style.display = 'none';
        searchInput.value = '';
        // 캘린더 엘리먼트 스타일 초기화 및 다시 렌더링
        calendarElement.style.height = '100%';
        calendarElement.style.visibility = 'visible';
        calendar.updateSize(); // 캘린더 크기 업데이트
        calendar.render(); // 캘린더 다시 렌더링
    });
}

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

// 필터 초기화 함수 추가
function initializeFilters() {
    const filterCheckboxes = document.querySelectorAll('.event_filter');

    filterCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            const selectedCategories = Array.from(filterCheckboxes)
                .filter(cb => cb.checked && cb.id !== 'selectAll')  // selectAll 제외
                .map(cb => cb.value);

            console.log('Selected Categories:', selectedCategories);

            if (calendar && typeof calendar.getEvents === 'function') {
                const events = calendar.getEvents();
                events.forEach(event => {
                    const eventCategory = event.extendedProps.calendar;
                    console.log('Event Category:', eventCategory);

                    // 수정된 필터링 로직
                    if (selectedCategories.length === 0 && document.getElementById('selectAll').checked) {
                        // 모두 선택이 체크되어 있을 때만 모든 이벤트 표시
                        event.setProp('display', '');
                    } else if (selectedCategories.includes(eventCategory)) {
                        // 선택된 카테고리에 포함된 이벤트만 표시
                        event.setProp('display', '');
                    } else {
                        // 그 외의 경우 숨김
                        event.setProp('display', 'none');
                    }
                });
            }
        });
    });

    // 모두 선택 체크박스 이벤트 핸들러 추가
    const selectAllCheckbox = document.getElementById('selectAll');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function () {
            const isChecked = selectAllCheckbox.checked;

            // 다른 체크박스들의 상태 변경
            filterCheckboxes.forEach(checkbox => {
                if (checkbox !== selectAllCheckbox) {
                    checkbox.checked = isChecked;
                }
            });

            // 이벤트 표시/숨김 처리
            if (calendar && typeof calendar.getEvents === 'function') {
                const events = calendar.getEvents();
                events.forEach(event => {
                    event.setProp('display', isChecked ? '' : 'none');
                });
            }
        });
    }
}

// 전역 Set 객체 선언
let currentEventAttendees = new Set();
let editEventAttendees = new Set();

// 소켓 연결 설정
const socket = io("https://ewp.devist.me/", {
  path: "/api/socket.io",
  transports: ["websocket"]
});

// 로그인 시 서버로부터 캘린더 데이터 수신
socket.on('loginRes', (data) => {
  if (data.status === 200) { // main.js에 적어둔 if문이랑 동일하게 적었는데 이상하면 수정하시면 됩니다.
    // 받아온 일정 데이터로 캘린더 업데이트
    calendar.removeAllEvents(); // 풀캘린더에서 기존 이벤트 모두 삭제하는 함수입니다.
    calendar.addEventSource(data.events); // 풀캘린더에서 이벤트 소스(db에서 이벤트를 가져온)를 추가하는 함수입니다. https://fullcalendar.io/docs/Calendar-addEventSource
  }
});


// 캘린더 초기화 함수
function initializeCalendar() {
    var calendarEl = document.getElementById('calendar');
    calendar = new FullCalendar.Calendar(calendarEl, {

        // Tool Bar 목록 document : https://fullcalendar.io/docs/toolbar
        headerToolbar: {
            left: 'prevYear,prev,next,nextYear,today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
        },

        initialView: 'dayGridMonth',
        selectable: true,
        selectMirror: true,
        locale: 'ko',
        navLinks: true,
        editable: true,
        height: '100%',
        aspectRatio: 1.8,
        dayMaxEvents: true,

        dayCellDidMount: function (arg) {
            arg.el.style.padding = '2px';
            arg.el.style.height = 'auto';
        },
        dayCellContent: function (arg) {
            arg.dayNumberText = arg.date.getDate(); // 날짜를 숫자로만 표시
        },

        // 날짜 클릭시 이벤트 추가
        dateClick: function (info) {
            const modal = document.getElementById('eventModal');
            const form = document.getElementById('eventForm');
            const closeButton = document.querySelector('.close-button');

            // 모달 열릴 때 참석자 목록 초기화
            currentEventAttendees.clear();
            const attendeesList = document.getElementById('attendeesList');
            if (attendeesList) {
                attendeesList.innerHTML = '';
            }

            // 시작 시간 설정
            const startDate = new Date(info.date);
            startDate.setDate(startDate.getDate() + 1);

            // 종료 시간을 시작 시간 + 1시간으로 설정
            const endDate = new Date(startDate.getTime() + (60 * 60 * 1000));

            document.getElementById('eventStart').value = startDate.toISOString().slice(0, 16);
            document.getElementById('eventEnd').value = endDate.toISOString().slice(0, 16);

            modal.style.display = "block";



            // 모달 생성 버튼 이벤트 처리
            form.onsubmit = function (e) {
                e.preventDefault();

                const eventData = { // 일정 데이터 가져와서
                    title: document.getElementById('eventTitle').value,
                    start: document.getElementById('eventStart').value,
                    end: document.getElementById('eventEnd').value,
                    location: document.getElementById('eventLocation').value,
                    description: document.getElementById('eventDescription').value,
                    color: document.getElementById('eventColor').value,
                    calendar: document.getElementById('eventCalendar').value,
                    reminder: document.getElementById('eventReminder').value,
                    attendees: Array.from(currentEventAttendees)
                };

                calendar.addEvent({
                    title: document.getElementById('eventTitle').value,
                    start: document.getElementById('eventStart').value,
                    end: document.getElementById('eventEnd').value,
                    location: document.getElementById('eventLocation').value,
                    description: document.getElementById('eventDescription').value,
                    color: document.getElementById('eventColor').value,
                    display: 'block', // 하루짜리 이벤트도 블록으로 표시
                    extendedProps: {
                        calendar: document.getElementById('eventCalendar').value,
                        reminder: document.getElementById('eventReminder').value,
                        attendees: Array.from(currentEventAttendees) // Set을 배열로 변환
                    }
                });
                
                socket.emit('createEvent', eventData);
                
                currentEventAttendees.clear(); // 참석자 목록 초기화
                modal.style.display = "none"; // 모달 닫기
                form.reset(); // 폼 초기화
            };

            

            document.querySelector('.btn-cancel').onclick = function () { 
                modal.style.display = "none";
                form.reset();
            };

            closeButton.onclick = function () {
                modal.style.display = "none";
                form.reset();
            };

            // 모달 외부 클릭 시 닫기
            window.onclick = function (event) {
                if (event.target == modal) {
                    modal.style.display = "none";
                    form.reset();
                }
            };
        },

        eventClick: function (info) {

            const infoModal = document.getElementById('eventInfoModal');
            if (!infoModal) {
                console.error('이벤트 정보 모달을 찾을 수 없습니다.');
                return;
            }

            // 구글 캘린더 이벤트인 경우 클릭 이벤트 무시(이거안하면 구글캘린더 링크로 리다이렉트됨)
            info.jsEvent.stopPropagation();
            info.jsEvent.preventDefault();
            const event = info.event;

            // 클릭한 위치 기준으로 모달 위치 설정
            const rect = info.el.getBoundingClientRect();
            const modalContent = infoModal.querySelector('.modal-content');
            const windowWidth = window.innerWidth;
            const modalWidth = windowWidth < 480 ? 200 : 300; // 모바일 환경일 때 창이 더 작게 설정

            // 오른쪽과 왼쪽 모두 공간이 부족한 경우 중앙에 표시
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

            // 아래 부분 일정을 클릭할 때 모달이 위로 오도록 설정
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

            // 말풍선 화살표 스타일 추가
            modalContent.style.setProperty('--arrow-left', '-10px');

            // 일정 정보 채우기
            const titleEl = document.getElementById('infoEventTitle');
            const locationEl = document.getElementById('infoEventLocation');
            const dateTimeEl = document.getElementById('infoEventDateTime');
            const calendarEl = document.getElementById('infoEventCalendar');
            const attendeesEl = document.getElementById('infoEventAttendees');
            const descriptionEl = document.getElementById('infoEventDescription');

            if (titleEl) titleEl.textContent = event.title;
            if (locationEl) locationEl.textContent = event.extendedProps.location || '(없음)';


            // 날짜 형식 지정
            const startDate = new Date(event.start).toLocaleString('ko-KR');
            const endDate = event.end ? new Date(event.end).toLocaleString('ko-KR') : '';
            if (dateTimeEl) dateTimeEl.textContent = endDate ? `${startDate} ~ ${endDate}` : startDate;

            if (calendarEl) calendarEl.textContent = event.extendedProps.calendar || '기본';
            if (attendeesEl) {
                const attendeesList = Array.from(event.extendedProps.attendees || []);
                if (attendeesList.length === 0) {
                    attendeesEl.textContent = '(없음)';
                } else if (attendeesList.length === 1) {
                    attendeesEl.textContent = attendeesList[0];
                } else {
                    // 툴팁으로 전체 참석자 목록을 보여주는 기능 추가
                    const attendeesText = `${attendeesList[0]} 외 ${attendeesList.length - 1}명`;
                    const tooltipText = attendeesList.join('\n');
                    attendeesEl.innerHTML = `<span class="attendees-tooltip" title="${tooltipText}">${attendeesText}</span>`;
                }
            }
            if (descriptionEl) descriptionEl.textContent = event.extendedProps.description || '(없음)';

            // 모달 표시
            infoModal.style.display = "block";
            infoModal.style.backgroundColor = 'transparent';

            // 닫기 버튼 이벤트 핸들러 추가
            const closeButton = infoModal.querySelector('.close-button');
            if (closeButton) {
                closeButton.onclick = function () {
                    infoModal.style.display = "none";
                };
            }

            // 수정 버튼 클릭 처리
            const editButton = infoModal.querySelector('.btn-edit');
            if (editButton) {
                editButton.onclick = function () {
                    infoModal.style.display = "none";
                    const editModal = document.getElementById('editEventModal');
                    if (!editModal) {
                        console.error('모달아이디 못찾겟음'); // 디버그용
                        return;
                    }

                    // 수정 모달의 필드들
                    const editEventTitle = document.getElementById('editEventTitle');
                    const editEventLocation = document.getElementById('editEventLocation');
                    const editEventStart = document.getElementById('editEventStart');
                    const editEventEnd = document.getElementById('editEventEnd');
                    const editEventCalendar = document.getElementById('editEventCalendar');
                    const editEventDescription = document.getElementById('editEventDescription');
                    const editEventReminder = document.getElementById('editEventReminder');
                    const editEventColor = document.getElementById('editEventColor');

                    // 기본 정보 설정
                    editEventTitle.value = event.title;
                    editEventLocation.value = event.extendedProps.location || '';
                    editEventCalendar.value = event.extendedProps.calendar || 'default';
                    editEventDescription.value = event.extendedProps.description || '';
                    editEventReminder.value = event.extendedProps.reminder || '0';
                    editEventColor.value = event.backgroundColor || 'red';

                    // 날짜 정보 설정
                    const startDate = new Date(event.start);
                    startDate.setMinutes(startDate.getMinutes() - startDate.getTimezoneOffset());
                    editEventStart.value = startDate.toISOString().slice(0, 16);

                    if (event.end) {
                        const endDate = new Date(event.end);
                        endDate.setMinutes(endDate.getMinutes() - endDate.getTimezoneOffset());
                        editEventEnd.value = endDate.toISOString().slice(0, 16);
                    }

                    // 수정 모달에서 기존 참석자 목록 표시 부분 수정
                    const editEventAttendeesInput = document.getElementById('editEventAttendees');
                    const editAttendeesList = document.getElementById('editAttendeesList');

                    // input 값과 목록 초기화
                    editEventAttendeesInput.value = '';
                    editEventAttendees.clear();  // Set 객체 초기화
                    editAttendeesList.innerHTML = '';

                    // 기존 참석자 목록 복원
                    const attendees = event.extendedProps.attendees || [];
                    attendees.forEach(attendee => {
                        editEventAttendees.add(attendee);
                        addAttendeeToList(attendee, editAttendeesList, editEventAttendees);
                    });

                    editModal.style.display = "block";

                    // 수정된 데이터 제출 
                    const editForm = document.getElementById('editEventForm'); // 수정 폼
                    if (editForm) {
                        editForm.onsubmit = function (e) {
                            e.preventDefault();
                            const eventData = { // 수정할 데이터 가져오기
                                id: event.id, 
                                title: document.getElementById('editEventTitle').value,
                                start: document.getElementById('editEventStart').value,
                                end: document.getElementById('editEventEnd').value,
                                location: document.getElementById('editEventLocation').value,
                                description: document.getElementById('editEventDescription').value,
                                color: document.getElementById('editEventColor').value,
                                calendar: document.getElementById('editEventCalendar').value,
                                reminder: document.getElementById('editEventReminder').value,
                                attendees: Array.from(currentEventAttendees)
                            };
                        
                            event.setProp('title', editEventTitle.value);
                            event.setStart(editEventStart.value);
                            event.setEnd(editEventEnd.value);
                            event.setExtendedProp('location', editEventLocation.value);
                            event.setExtendedProp('description', editEventDescription.value);
                            event.setExtendedProp('calendar', editEventCalendar.value);
                            event.setExtendedProp('reminder', editEventReminder.value);
                            event.setExtendedProp('attendees', Array.from(editEventAttendees));
                            event.setProp('backgroundColor', editEventColor.value);

                            socket.emit('updateEvent', eventData); // 수정된 데이터 서버로 전송
                            editModal.style.display = "none";
                        };
                    }

                    // 수정 모달 취소 버튼
                    const editCancelButton = editModal.querySelector('.btn-cancel');
                    if (editCancelButton) {
                        editCancelButton.onclick = function () {
                            editModal.style.display = "none";
                        };
                    }

                    // 수정 모달 닫기 버튼
                    const editCloseButton = editModal.querySelector('.close-button');
                    if (editCloseButton) {
                        editCloseButton.onclick = function () {
                            editModal.style.display = "none";
                        };
                    }

                    // 모달 외부 클릭 시 닫기
                    window.onclick = function (event) {
                        if (event.target == editModal) {
                            editModal.style.display = "none";
                        }
                    };
                };
            }

            // 삭제 버튼 클릭 처리
            const deleteButton = infoModal.querySelector('.btn-delete');
            if (deleteButton) {
                deleteButton.onclick = function () {
                    if (confirm('이벤트를 삭제하시겠습니까?')) {
                        event.remove(); // 클릭한 이벤트 삭제
                        socket.emit('eventDelete', { eventId: event.id }); // 삭제된 이벤트 서버로 전송
                        infoModal.style.display = "none";
                    }
                };
            }

            // 모달 외부 클릭 시 닫기
            window.onclick = function (event) {
                if (event.target == infoModal) {
                    infoModal.style.display = "none";
                }
            };


        },
        dayMaxEvents: true,
        events: [

        ],

        // 구글 캘린더 연동을 위한 부분
        googleCalendarApiKey: 'AIzaSyDW7AWvIQ-PRfNCHF3l8mw0LD2rK17LDLo',
        eventSources: [
            {
                // 한국의 공휴일 캘린더를 따와서 표시
                googleCalendarId: 'ko.south_korea#holiday@group.v.calendar.google.com',
                color: 'white',
                textColor: 'red',
                className: 'holiday-event'
            }
        ],

        // 이벤트 표시 방식 커스터마이징
        eventContent: function (arg) {
            return {
                html: '<div class="fc-event-title">' + arg.event.title + '</div>'
            };
        },
        eventClassNames: function(arg) {
            return ['custom-event'];
        },
    });


    calendar.render();
}

// 참석자 추가 함수
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

// 이벤트 위임을 통한 참석자 추가 버튼 처리, 이 함수에 소캣 통신 기능 추가 바람(백엔드)
document.addEventListener('click', function (e) {
    // 일정 추가 참석자 추가 
    if (e.target.matches('#eventModal .id-check-btn')) {
        const input = document.getElementById('eventAttendees');
        const list = document.getElementById('attendeesList');
        const value = input.value.trim();

        if (!value) return;

        // #이 없으면 자동으로 추가
        const attendeeId = value.startsWith('#') ? value : '#' + value;

        if (currentEventAttendees.has(attendeeId)) {
            alert('이미 추가된 참석자입니다.');
            return;
        }

        // 이 부분에 소켓 통신 추가
        // 소켓 통신으로 사용자가 존재하는지 확인하고, 존재하면 참석자 추가
        // 존재하지 않으면 alert으로 사용자가 없다고 알림

        // 입력된 사용자의 아이디를 리스트로 추가
        currentEventAttendees.add(attendeeId);
        addAttendeeToList(attendeeId, list, currentEventAttendees);
        input.value = '';
    }
    // 일정 수정 참석자 추가
    else if (e.target.matches('#editEventModal .id-check-btn')) {
        const input = document.getElementById('editEventAttendees');
        const list = document.getElementById('editAttendeesList');
        const value = input.value.trim();

        if (!value) return;

        const attendeeId = value.startsWith('#') ? value : '#' + value;

        if (editEventAttendees.has(attendeeId)) {
            alert('이미 추가된 참석자입니다.');
            return;
        }

        // 이 부분에 소켓 통신 추가
        // 소켓 통신으로 사용자가 존재하는지 확인하고, 존재하면 참석자 추가
        // 존재하지 않으면 alert으로 사용자가 없다고 알림

        // 입력된 사용자의 아이디를 리스트로 추가
        editEventAttendees.add(attendeeId);
        addAttendeeToList(attendeeId, list, editEventAttendees);
        input.value = '';
    }
});

// 장소 검색 버튼 클릭 이벤트 처리
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

// 장소 검색 모달 닫기 버튼 이벤트 처리
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

// 리스트에서 장소를 선택하면 해당 장소의 주소와 상세 주소를 문자열로 반환
function getListItem(index, places) {
    var el = document.createElement('li');
    var itemStr = '<div class="info">' +
        '   <h5>' + places.place_name + '</h5>';

    if (places.road_address_name) {
        itemStr += '    <span>' + places.road_address_name + '</span>' +
            '   <span class="jibun gray">' + places.address_name + '</span>';
    } else {
        itemStr += '    <span>' + places.address_name + '</span>';
    }
    itemStr += '  <span class="tel">' + places.phone + '</span>' +
        '</div>';

    el.innerHTML = itemStr;
    el.className = 'item';

    // 장소 클릭 이벤트 수정
    el.onclick = function () {
        const address = places.place_name + ', ' + (places.road_address_name || places.address_name);
        if (window.activeLocationInput) {
            window.activeLocationInput.value = address;
        }
        document.getElementById('mapSearchModal').style.display = "none";
    };

    return el;
}

document.addEventListener('DOMContentLoaded', function () {
    // 분류 체크박스 필터링
    const filterCheckboxes = document.querySelectorAll('.event_filter');

    filterCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            const selectedCategories = Array.from(filterCheckboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.value);

            console.log('Selected Categories:', selectedCategories);

            calendar.getEvents().forEach(event => {
                const eventCategory = event.extendedProps.calendar; // infoEventCalendar 값 사용
                console.log('Event Category:', eventCategory);

                if (selectedCategories.length === 0 || selectedCategories.includes(eventCategory)) {
                    event.setProp('display', 'auto');
                } else {
                    event.setProp('display', 'none');
                }
            });
        });
    });
});

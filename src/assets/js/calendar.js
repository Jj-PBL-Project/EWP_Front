document.addEventListener('DOMContentLoaded', function () {
    // 모달 HTML 지정 및 캘린더 초기화
    fetch('newEvent.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('modalContainer').innerHTML = html;
            initializeCalendar(); // 모달 로드 후 캘린더 초기화
        });
});

// 캘린더 초기화 함수
function initializeCalendar() {
    var calendarEl = document.getElementById('calendar');
    var calendar = new FullCalendar.Calendar(calendarEl, {

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

            // 시작 시간 설정
            const startDate = new Date(info.date);
            startDate.setDate(startDate.getDate() + 1);

            // 종료 시간을 시작 시간 + 1시간으로 설정
            const endDate = new Date(startDate.getTime() + (60 * 60 * 1000));

            document.getElementById('eventStart').value = startDate.toISOString().slice(0, 16);
            document.getElementById('eventEnd').value = endDate.toISOString().slice(0, 16);

            modal.style.display = "block";

            // 모달 닫기 이벤트 핸들러들
            form.onsubmit = function (e) {
                e.preventDefault();

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
                        attendees: document.getElementById('eventAttendees').value
                    }
                });

                modal.style.display = "none";
                form.reset();
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
            if (attendeesEl) attendeesEl.textContent = event.extendedProps.attendees || '(없음)';
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

                    // 수정 모달ckddp epdlxj sjgrl
                    const editEventTitle = document.getElementById('editEventTitle');
                    const editEventLocation = document.getElementById('editEventLocation');
                    const editEventStart = document.getElementById('editEventStart');
                    const editEventEnd = document.getElementById('editEventEnd');
                    const editEventAttendees = document.getElementById('editEventAttendees');
                    const editEventCalendar = document.getElementById('editEventCalendar');
                    const editEventDescription = document.getElementById('editEventDescription');
                    const editEventReminder = document.getElementById('editEventReminder');
                    const editEventColor = document.getElementById('editEventColor');

                    if (!editEventTitle || !editEventLocation || !editEventStart || !editEventEnd || !editEventAttendees || !editEventCalendar || !editEventDescription || !editEventReminder || !editEventColor) {
                        console.error('모달 필드가 안보여');
                        return; // 디버그용 
                    }

                    editEventTitle.value = event.title;
                    editEventLocation.value = event.extendedProps.location || '';
                    editEventStart.value = new Date(event.start.getTime() - (event.start.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
                    editEventEnd.value = event.end ? new Date(event.end.getTime() - (event.end.getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : '';
                    editEventAttendees.value = event.extendedProps.attendees || '';
                    editEventCalendar.value = event.extendedProps.calendar || 'default';
                    editEventDescription.value = event.extendedProps.description || '';
                    editEventReminder.value = event.extendedProps.reminder || '0';
                    editEventColor.value = event.backgroundColor || 'red';

                    editModal.style.display = "block";

                    // 수정된 데이터 제출 
                    const editForm = document.getElementById('editEventForm');
                    if (editForm) {
                        editForm.onsubmit = function (e) {
                            e.preventDefault();
                            event.setProp('title', editEventTitle.value);
                            event.setStart(editEventStart.value);
                            event.setEnd(editEventEnd.value);
                            event.setExtendedProp('location', editEventLocation.value);
                            event.setExtendedProp('description', editEventDescription.value);
                            event.setExtendedProp('calendar', editEventCalendar.value);
                            event.setExtendedProp('reminder', editEventReminder.value);
                            event.setExtendedProp('attendees', editEventAttendees.value);
                            event.setProp('backgroundColor', editEventColor.value);

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
                        event.remove();
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
    });

    calendar.render();
}

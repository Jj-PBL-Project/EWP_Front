document.addEventListener('DOMContentLoaded', function() {
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

        dayCellDidMount: function(arg) {
            arg.el.style.padding = '2px';
            arg.el.style.height = 'auto';
        },
        dayCellContent: function(arg) {
            arg.dayNumberText = arg.date.getDate(); // 날짜를 숫자로만 표시
          },
        
        // 이벤트 추가 기능( 기본 에셋 기능인데 아직 연동 안되어있음)
        select: function (arg) {
            Swal.fire({
                html: "<div class='mb-7'>Create new event?</div><div class='fw-bold mb-5'>Event Name:</div><input type='text' class='form-control' name='event_name' />",
                icon: "info",
                showCancelButton: true,
                buttonsStyling: false,
                confirmButtonText: "Yes, create it!",
                cancelButtonText: "No, return",
                customClass: {
                    confirmButton: "btn btn-primary",
                    cancelButton: "btn btn-active-light"
                }
            }).then(function (result) {
                if (result.value) {
                    var title = document.querySelector("input[name=;event_name']").value;
                    if (title) {
                        calendar.addEvent({
                            title: title,
                            start: arg.start,
                            end: arg.end,
                            allDay: arg.allDay
                        })
                    }
                    calendar.unselect()
                } else if (result.dismiss === "cancel") {
                    Swal.fire({
                        text: "Event creation was declined!.",
                        icon: "error",
                        buttonsStyling: false,
                        confirmButtonText: "Ok, got it!",
                        customClass: {
                            confirmButton: "btn btn-primary",
                        }
                    });
                }
            });
        },
        
        // 이벤트 삭제( 기본 에셋 기능인데 아직 캘린더와 연동 안되어 있음)
        eventClick: function (arg) {
            Swal.fire({
                text: "Are you sure you want to delete this event?",
                icon: "warning",
                showCancelButton: true,
                buttonsStyling: false,
                confirmButtonText: "Yes, delete it!",
                cancelButtonText: "No, return",
                customClass: {
                    confirmButton: "btn btn-primary",
                    cancelButton: "btn btn-active-light"
                }
            }).then(function (result) {
                if (result.value) {
                    arg.event.remove()
                } else if (result.dismiss === "cancel") {
                    Swal.fire({
                        text: "Event was not deleted!.",
                        icon: "error",
                        buttonsStyling: false,
                        confirmButtonText: "Ok, got it!",
                        customClass: {
                            confirmButton: "btn btn-primary",
                        }
                    });
                }
            });
        },
        dayMaxEvents: true, 
        events: [
           
        ],

        // 구글 캘린더 연동을 위한 부분
        googleCalendarApiKey: 'AIzaSyDW7AWvIQ-PRfNCHF3l8mw0LD2rK17LDLo',
        eventSources :[ 
            {
             // 한국의 공휴일 캘린더를 따와서 표시
             googleCalendarId : 'ko.south_korea#holiday@group.v.calendar.google.com', 
             color: 'white' ,  
             textColor: 'red', 
             className: 'holiday-event'
            } 
        ],
        eventClick: function(info){
            // 클릭시 구글캘린더 url로 가는 것을 막음( 이거 안하면 공유일 클릭 시 구글 캘린더로 리다이렉트)
            info.jsEvent.stopPropagation();
            info.jsEvent.preventDefault();
        },
    });

    calendar.render();
});


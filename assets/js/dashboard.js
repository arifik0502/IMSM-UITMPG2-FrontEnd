$(function () {
    Nav.requireAuth();
    Nav.render('dashboard');

    let selectedLocation = null;
    let stream = null;
    let capturedDataUrl = null;
    let pendingAction = null; // 'in' | 'out'
    let canClockIn = false;
    const cameraModal = new bootstrap.Modal('#camera-modal');

    function updateClockInButton() {
        $('#clock-in-btn').prop('disabled', !canClockIn || !selectedLocation);
    }

    function renderStatus(attendance, openBreak) {
        const panel = $('#status-panel');

        if (!attendance) {
            panel.html('<span class="text-muted">You have not clocked in today.</span>');
            canClockIn = true;
            updateClockInButton();
            $('#clock-out-btn, #break-start-btn, #break-end-btn').prop('disabled', true);
            return;
        }

        let html = `<div><strong>Clocked in:</strong> ${attendance.clock_in ? new Date(attendance.clock_in).toLocaleTimeString() : '—'}`;
        html += ` (${attendance.work_location === 'home' ? 'Work from home' : 'Office'})</div>`;
        if (attendance.clock_out) {
            html += `<div><strong>Clocked out:</strong> ${new Date(attendance.clock_out).toLocaleTimeString()}</div>`;
        }
        if (attendance.late_minutes > 0) {
            html += `<div class="text-danger">Late by ${attendance.late_minutes} minute(s)</div>`;
        }
        if (attendance.overtime_minutes > 0) {
            html += `<div class="text-success">Overtime: ${attendance.overtime_minutes} minute(s)</div>`;
        }
        if (openBreak) {
            html += `<div class="text-warning">On break since ${new Date(openBreak.break_start).toLocaleTimeString()}</div>`;
        }
        if (attendance.clock_in_photo_url) {
            html += `<div class="mt-2"><img src="${attendance.clock_in_photo_url}" style="height:80px;border-radius:6px;" alt="Clock-in selfie"> `;
            if (attendance.clock_out_photo_url) {
                html += `<img src="${attendance.clock_out_photo_url}" style="height:80px;border-radius:6px;" alt="Clock-out selfie">`;
            }
            html += `</div>`;
        }
        panel.html(html);

        canClockIn = false;
        updateClockInButton();
        $('#clock-out-btn').prop('disabled', !attendance.clock_in || !!attendance.clock_out || !!openBreak);
        $('#break-start-btn').prop('disabled', !attendance.clock_in || !!attendance.clock_out || !!openBreak);
        $('#break-end-btn').prop('disabled', !openBreak);
    }

    function loadStatus() {
        Api.get('/attendance/status').done((res) => {
            renderStatus(res.attendance, res.open_break);
        }).fail((err) => showAlert('#alert-box', err));
    }

    function selectLocation(loc) {
        selectedLocation = loc;
        $('#location-office-btn').toggleClass('btn-primary', loc === 'office').toggleClass('btn-outline-primary', loc !== 'office');
        $('#location-home-btn').toggleClass('btn-primary', loc === 'home').toggleClass('btn-outline-primary', loc !== 'home');
        updateClockInButton();
    }

    $('#location-office-btn').on('click', () => selectLocation('office'));
    $('#location-home-btn').on('click', () => selectLocation('home'));

    // ---- Camera modal ----
    function showCameraError(msg) {
        $('#camera-error').text(msg).removeClass('d-none');
    }
    function resetCameraView() {
        capturedDataUrl = null;
        $('#camera-preview').addClass('d-none');
        $('#camera-video').removeClass('d-none');
        $('#camera-capture-btn').removeClass('d-none');
        $('#camera-retake-btn, #camera-submit-btn').addClass('d-none');
        $('#camera-error').addClass('d-none').text('');
    }
    function stopStream() {
        if (stream) {
            stream.getTracks().forEach((t) => t.stop());
            stream = null;
        }
    }

    async function openCamera(action) {
        pendingAction = action;
        $('#camera-modal-title').text(action === 'in' ? 'Take a selfie to clock in' : 'Take a selfie to clock out');
        resetCameraView();
        cameraModal.show();
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
            document.getElementById('camera-video').srcObject = stream;
        } catch (e) {
            showCameraError('Could not access your camera. Please allow camera permissions and try again.');
        }
    }

    $('#camera-modal').on('hidden.bs.modal', stopStream);

    $('#camera-capture-btn').on('click', () => {
        const video = document.getElementById('camera-video');
        const canvas = document.getElementById('camera-canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        capturedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        $('#camera-preview').attr('src', capturedDataUrl).removeClass('d-none');
        $('#camera-video').addClass('d-none');
        $('#camera-capture-btn').addClass('d-none');
        $('#camera-retake-btn, #camera-submit-btn').removeClass('d-none');
    });

    $('#camera-retake-btn').on('click', resetCameraView);

    $('#camera-submit-btn').on('click', () => {
        if (!capturedDataUrl) return;
        $('#camera-submit-btn').prop('disabled', true).text('Submitting...');
        clearAlert('#alert-box');

        const payload = { photo: capturedDataUrl };
        const request = pendingAction === 'in'
            ? Api.post('/attendance/clock-in', { photo: capturedDataUrl, work_location: selectedLocation })
            : Api.post('/attendance/clock-out', payload);

        request.done((res) => {
            cameraModal.hide();
            showAlert('#alert-box', res.message, 'success');
            renderStatus(res.attendance, null);
        }).fail((err) => {
            showAlert('#alert-box', err);
        }).always(() => {
            $('#camera-submit-btn').prop('disabled', false).text('Submit');
        });
    });

    $('#clock-in-btn').on('click', () => {
        if (!selectedLocation) {
            showAlert('#alert-box', 'Choose Office or Home first.');
            return;
        }
        openCamera('in');
    });
    $('#clock-out-btn').on('click', () => openCamera('out'));

    $('#break-start-btn').on('click', () => {
        Api.post('/breaks/start').done((res) => {
            showAlert('#alert-box', res.message, 'success');
            loadStatus();
        }).fail((err) => showAlert('#alert-box', err));
    });

    $('#break-end-btn').on('click', () => {
        Api.post('/breaks/end').done((res) => {
            showAlert('#alert-box', res.message, 'success');
            loadStatus();
        }).fail((err) => showAlert('#alert-box', err));
    });

    loadStatus();
});

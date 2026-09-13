$(function () {
    Nav.requireAuth();
    Nav.render('history');

    let currentPeriod = 'monthly';
    let currentPage = 1;

    function renderRows(attendances) {
        const tbody = $('#history-body');
        if (!attendances.data.length) {
            tbody.html('<tr><td colspan="7" class="text-center text-muted py-4">No records for this period.</td></tr>');
            return;
        }
        tbody.empty();
        attendances.data.forEach((a) => {
            const breaksText = (a.breaks || []).map((b) => {
                const start = new Date(b.break_start).toLocaleTimeString();
                const end = b.break_end ? new Date(b.break_end).toLocaleTimeString() : 'ongoing';
                return `${start}–${end}`;
            }).join(', ') || '—';

            tbody.append(`
                <tr>
                    <td>${a.date}</td>
                    <td>${a.work_location === 'home' ? 'Home' : 'Office'}</td>
                    <td>${a.clock_in ? new Date(a.clock_in).toLocaleTimeString() : '—'}</td>
                    <td>${a.clock_out ? new Date(a.clock_out).toLocaleTimeString() : '—'}</td>
                    <td>${a.late_minutes > 0 ? `<span class="text-danger">${a.late_minutes}</span>` : '—'}</td>
                    <td>${a.overtime_minutes > 0 ? `<span class="text-success">${a.overtime_minutes}</span>` : '—'}</td>
                    <td class="small">${breaksText}</td>
                </tr>
            `);
        });
    }

    function renderPagination(attendances) {
        const pag = $('#pagination').empty();
        if (attendances.last_page <= 1) return;
        for (let p = 1; p <= attendances.last_page; p++) {
            pag.append(`
                <li class="page-item ${p === attendances.current_page ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${p}">${p}</a>
                </li>
            `);
        }
    }

    function load() {
        $('#history-body').html('<tr><td colspan="7" class="text-center text-muted py-4">Loading...</td></tr>');
        Api.get(`/attendance/history?period=${currentPeriod}&page=${currentPage}`)
            .done((res) => {
                renderRows(res.attendances);
                renderPagination(res.attendances);
            })
            .fail((err) => showAlert('#alert-box', err));
    }

    $('#period-filter button').on('click', function () {
        $('#period-filter button').removeClass('active');
        $(this).addClass('active');
        currentPeriod = $(this).data('period');
        currentPage = 1;
        load();
    });

    $('#pagination').on('click', 'a.page-link', function (e) {
        e.preventDefault();
        currentPage = parseInt($(this).data('page'), 10);
        load();
    });

    load();
});

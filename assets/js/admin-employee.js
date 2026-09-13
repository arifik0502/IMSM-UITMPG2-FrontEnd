$(function () {
    Nav.requireAdmin();
    Nav.render('admin', '../');

    const employeeId = new URLSearchParams(window.location.search).get('id');
    if (!employeeId) {
        window.location.href = 'employees.html';
    }

    let period = 'monthly';
    let location = 'all';
    let page = 1;

    function statCard(label, value, color) {
        return `
            <div class="col-md-3 col-6">
                <div class="card"><div class="card-body text-center">
                    <div class="fs-4 fw-bold text-${color || 'dark'}">${value}</div>
                    <div class="text-muted small">${label}</div>
                </div></div>
            </div>
        `;
    }

    function load() {
        $('#attendance-body').html('<tr><td colspan="6" class="text-center text-muted py-4">Loading...</td></tr>');
        Api.get(`/admin/employees/${employeeId}?period=${period}&location=${location}&page=${page}`)
            .done((res) => {
                $('#employee-name').text(res.employee.name + ' — ' + res.employee.email);

                const s = res.stats;
                $('#stat-cards').html(
                    statCard('Total Records', s.total_records) +
                    statCard('Late Days', s.late_count, 'danger') +
                    statCard('Overtime (min)', s.overtime_minutes, 'success') +
                    statCard('WFH Days', s.wfh_count)
                );

                const tbody = $('#attendance-body').empty();
                if (!res.attendances.data.length) {
                    tbody.html('<tr><td colspan="6" class="text-center text-muted py-4">No records.</td></tr>');
                } else {
                    res.attendances.data.forEach((a) => {
                        tbody.append(`
                            <tr>
                                <td>${a.date}</td>
                                <td>${a.work_location === 'home' ? 'Home' : 'Office'}</td>
                                <td>${a.clock_in ? new Date(a.clock_in).toLocaleTimeString() : '—'}</td>
                                <td>${a.clock_out ? new Date(a.clock_out).toLocaleTimeString() : '—'}</td>
                                <td>${a.late_minutes || '—'}</td>
                                <td>${a.overtime_minutes || '—'}</td>
                            </tr>
                        `);
                    });
                }

                const pag = $('#pagination').empty();
                for (let p = 1; p <= res.attendances.last_page; p++) {
                    pag.append(`<li class="page-item ${p === res.attendances.current_page ? 'active' : ''}"><a class="page-link" href="#" data-page="${p}">${p}</a></li>`);
                }
            }).fail((err) => showAlert('#alert-box', err));
    }

    $('#period-filter button').on('click', function () {
        $('#period-filter button').removeClass('active');
        $(this).addClass('active');
        period = $(this).data('period');
        page = 1;
        load();
    });
    $('#location-filter button').on('click', function () {
        $('#location-filter button').removeClass('active');
        $(this).addClass('active');
        location = $(this).data('location');
        page = 1;
        load();
    });
    $('#pagination').on('click', 'a.page-link', function (e) {
        e.preventDefault();
        page = parseInt($(this).data('page'), 10);
        load();
    });

    load();
});

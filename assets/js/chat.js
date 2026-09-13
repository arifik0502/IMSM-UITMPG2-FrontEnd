$(function () {
    Nav.requireAuth();
    Nav.render('chat');

    let activeContactId = null;
    let lastMessageId = 0;
    let pollTimer = null;

    function renderContacts(contacts) {
        const list = $('#contact-list').empty();
        if (!contacts.length) {
            list.html('<div class="p-3 text-muted">No other employees yet.</div>');
            return;
        }
        contacts.forEach((c) => {
            list.append(`
                <a href="#" class="list-group-item list-group-item-action contact-list-item d-flex justify-content-between align-items-center ${c.user.id === activeContactId ? 'active' : ''}" data-id="${c.user.id}" data-name="${c.user.name}">
                    <span>
                        <div>${c.user.name}</div>
                        <small class="text-muted">${c.last_message ? c.last_message.substring(0, 30) : 'No messages yet'}</small>
                    </span>
                    ${c.unread_count > 0 ? `<span class="badge bg-danger rounded-pill">${c.unread_count}</span>` : ''}
                </a>
            `);
        });
    }

    function loadContacts() {
        Api.get('/chat').done((res) => renderContacts(res.contacts))
            .fail((err) => showAlert('#alert-box', err));
    }

    function renderMessages(messages, append) {
        const body = $('#thread-body');
        if (!append) body.empty();
        messages.forEach((m) => {
            body.append(`
                <div style="clear:both;">
                    <div class="chat-bubble ${m.from_me ? 'mine' : 'theirs'}">
                        ${$('<div>').text(m.body).html()}
                        <div class="small ${m.from_me ? 'text-white-50' : 'text-muted'}">${m.time}</div>
                    </div>
                </div>
            `);
            lastMessageId = Math.max(lastMessageId, m.id);
        });
        body.scrollTop(body[0].scrollHeight);
    }

    function openThread(id, name) {
        activeContactId = id;
        lastMessageId = 0;
        $('#thread-title').removeClass('text-muted').text(name);
        $('#message-form').removeClass('d-none');
        $('#contact-list a').removeClass('active');
        $(`#contact-list a[data-id="${id}"]`).addClass('active');

        Api.get(`/chat/${id}`).done((res) => {
            renderMessages(res.messages, false);
        }).fail((err) => showAlert('#alert-box', err));

        clearInterval(pollTimer);
        pollTimer = setInterval(poll, 4000);
    }

    function poll() {
        if (!activeContactId) return;
        Api.get(`/chat/${activeContactId}/poll?after_id=${lastMessageId}`).done((res) => {
            if (res.messages.length) {
                renderMessages(res.messages, true);
            }
        });
        Nav.pollUnreadChat();
    }

    $('#contact-list').on('click', 'a', function (e) {
        e.preventDefault();
        openThread($(this).data('id'), $(this).data('name'));
    });

    $('#message-form').on('submit', function (e) {
        e.preventDefault();
        const body = $('#message-input').val().trim();
        if (!body || !activeContactId) return;

        Api.post(`/chat/${activeContactId}`, { body }).done((msg) => {
            $('#message-input').val('');
            renderMessages([msg], true);
            loadContacts();
        }).fail((err) => showAlert('#alert-box', err));
    });

    loadContacts();
    setInterval(loadContacts, 8000);
});

/**
 * Interim login dialog.
 *
 * @output wp-includes/js/wp-auth-check.js
 */

(function ($) {
    var wrap,
        tempHidden,
        tempHiddenTimeout;

    /**
     * Shows the authentication form popup.
     *
     * @since 3.6.0
     * @private
     */
    function show() {
        // Гарантируем, что wrap валиден (на случай раннего вызова)
        if (!wrap || !wrap.length) {
            wrap = $('#wp-auth-check-wrap');
            if (!wrap.length) return;
        }

        var parent  = $('#wp-auth-check'),
            form    = $('#wp-auth-check-form'),
            noframe = wrap.find('.wp-auth-fallback-expired'),
            frame, loaded = false;

        if (form.length) {
            // Add unload confirmation to counter (frame-busting) JS redirects.
            $(window).on('beforeunload.wp-auth-check', function (event) {
                event.originalEvent.returnValue = window.wp.i18n.__(
                    'Your session has expired. You can log in again from this page or go to the login page.'
                );
            });

            frame = $('<iframe id="wp-auth-check-frame" frameborder="0">').attr('title', noframe.text());
            frame
                .on('load', function () {
                    var height, body;

                    loaded = true;
                    // Remove the spinner to avoid unnecessary CPU/GPU usage.
                    form.removeClass('loading');

                    try {
                        body   = $(this).contents().find('body');
                        height = body.height();
                    } catch (er) {
                        wrap.addClass('fallback');
                        parent.css('max-height', '');
                        form.remove();
                        noframe.trigger('focus');
                        return;
                    }

                    if (height) {
                        if (body && body.hasClass('interim-login-success')) {
                            hide();
                        } else {
                            parent.css('max-height', height + 40 + 'px');
                        }
                    } else if (!body || !body.length) {
                        // Catch "silent" iframe origin exceptions in WebKit
                        // after another page is loaded in the iframe.
                        wrap.addClass('fallback');
                        parent.css('max-height', '');
                        form.remove();
                        noframe.trigger('focus');
                    }
                })
                .attr('src', form.data('src'));

            form.append(frame);
        }

        $('body').addClass('modal-open');
        wrap.removeClass('hidden');

        if (frame) {
            frame.trigger('focus');
            /*
             * WebKit doesn't throw an error if the iframe fails to load
             * because of "X-Frame-Options: DENY" header.
             * Wait for 10 seconds and switch to the fallback text.
             */
            setTimeout(function () {
                if (!loaded) {
                    wrap.addClass('fallback');
                    form.remove();
                    noframe.trigger('focus');
                }
            }, 10000);
        } else {
            noframe.trigger('focus');
        }
    }

    /**
     * Hides the authentication form popup.
     *
     * @since 3.6.0
     * @private
     */
    function hide() {
        var adminpage = window.adminpage,
            wp        = window.wp;

        $(window).off('beforeunload.wp-auth-check');

        // When on the Edit Post screen, speed up heartbeat
        // after the user logs in to quickly refresh nonces.
        if ((adminpage === 'post-php' || adminpage === 'post-new-php') && wp && wp.heartbeat) {
            wp.heartbeat.connectNow();
        }

        // Безопасность: проверим wrap
        if (!wrap || !wrap.length) {
            wrap = $('#wp-auth-check-wrap');
            if (!wrap.length) return;
        }

        wrap.fadeOut(200, function () {
            wrap.addClass('hidden').css('display', '');
            $('#wp-auth-check-frame').remove();
            $('body').removeClass('modal-open');
        });
    }

    /**
     * Set or reset the tempHidden variable used to pause showing of the modal
     * after a user closes it without logging in.
     *
     * @since 5.5.0
     * @private
     */
    function setShowTimeout() {
        tempHidden = true;
        window.clearTimeout(tempHiddenTimeout);
        tempHiddenTimeout = window.setTimeout(function () {
            tempHidden = false;
        }, 300000); // 5 min.
    }

    /**
     * DOM ready: инициализация обёртки и кнопки закрытия.
     */
    $(function () {
        wrap = $('#wp-auth-check-wrap');

        if (wrap.length) {
            wrap.find('.wp-auth-check-close').on('click', function () {
                hide();
                setShowTimeout();
            });
        }
    });

    /**
     * Heartbeat Tick handler.
     *
     * Привязываем отдельно и с защитами: обработчик может прийти раньше DOM ready.
     */
    $(document).on('heartbeat-tick.wp-auth-check', function (e, data) {
        if (!data || !('wp-auth-check' in data)) {
            return;
        }

        // Гарантируем наличие wrap (лениво получаем, если ещё не инициализирован)
        if (!wrap || !wrap.length) {
            wrap = $('#wp-auth-check-wrap');
            if (!wrap.length) {
                // Нет контейнера — не обрабатываем
                return;
            }
        }

        var isHidden = wrap.hasClass('hidden');

        if (!data['wp-auth-check'] && isHidden && !tempHidden) {
            // сессия истекла — показываем
            show();
        } else if (data['wp-auth-check'] && !isHidden) {
            // сессия восстановлена — скрываем
            hide();
        }
    });
})(jQuery);

/**
 * @output wp-admin/js/editor.js (safe bootstrap)
 */
(function (bootstrap) {
    // Ленивый старт: ждём jQuery; создаём window.wp, если нет
    function boot() {
        var w = window;
        if (!w || !w.document) return;                 // вне браузера
        var $ = w.jQuery;
        if (!$) return setTimeout(boot, 50);           // ждём jQuery
        w.wp = w.wp || {};
        w.wp.editor = w.wp.editor || {};
        bootstrap($, w.wp, w);
    }
    boot();
})(function ($, wp, w) {

    // ====== НАЧАЛО оригинальной логики с защитами ======

    /**
     * Utility functions for the editor.
     */
    function SwitchEditors() {
        var tinymce, $$,
            exports = {};

        function init() {
            // TinyMCE может появиться позже — подождём его мягко.
            if (!tinymce && w.tinymce) {
                tinymce = w.tinymce;
                $$ = tinymce.$;

                // Если у TinyMCE нет собственной $ — используем jQuery.
                if (!$$ && $) { $$ = $; }

                // Безопасно выходим, если всё ещё нет DOM-обёртки
                if (!$$) { return; }

                // Обработчик вкладок Visual/Code
                $$(document).on('click', function (event) {
                    var id, mode,
                        target = $$(event.target);

                    if (target.hasClass('wp-switch-editor')) {
                        id = target.attr('data-wp-editor-id');
                        mode = target.hasClass('switch-tmce') ? 'tmce' : 'html';
                        switchEditor(id, mode);
                    }
                });
            } else {
                // Если TinyMCE ещё не готов — повторим попытку
                setTimeout(init, 50);
            }
        }

        function getToolbarHeight(editor) {
            var node = $$('.mce-toolbar-grp', editor.getContainer())[0],
                height = node && node.clientHeight;

            if (height && height > 10 && height < 200) {
                return parseInt(height, 10);
            }
            return 30;
        }

        function switchEditor(id, mode) {
            id = id || 'content';
            mode = mode || 'toggle';

            // Защита: без TinyMCE и jQuery‑суместимого $$ переключение не делаем
            if (!w.tinymce || !tinymce || !$$) return false;

            var editorHeight, toolbarHeight, iframe,
                editor = tinymce.get(id),
                wrap = $$('#wp-' + id + '-wrap'),
                htmlSwitch = wrap.find('.switch-tmce'),
                tmceSwitch = wrap.find('.switch-html'),
                $textarea = $$('#' + id),
                textarea = $textarea[0];

            if ('toggle' === mode) {
                mode = (editor && !editor.isHidden()) ? 'html' : 'tmce';
            }

            if ('tmce' === mode || 'tinymce' === mode) {
                if (editor && !editor.isHidden()) return false;

                if (typeof (w.QTags) !== 'undefined') {
                    w.QTags.closeAllTags(id);
                }

                editorHeight = parseInt(textarea && textarea.style ? textarea.style.height : 0, 10) || 0;

                addHTMLBookmarkInTextAreaContent($textarea);

                if (editor) {
                    editor.show();

                    if (!tinymce.Env.iOS && editorHeight) {
                        toolbarHeight = getToolbarHeight(editor);
                        editorHeight = editorHeight - toolbarHeight + 14;

                        if (editorHeight > 50 && editorHeight < 5000) {
                            editor.theme.resizeTo(null, editorHeight);
                        }
                    }

                    focusHTMLBookmarkInVisualEditor(editor);
                } else if (w.tinyMCEPreInit && w.tinyMCEPreInit.mceInit && w.tinyMCEPreInit.mceInit[id]) {
                    tinymce.init(w.tinyMCEPreInit.mceInit[id]);
                }

                wrap.removeClass('html-active').addClass('tmce-active');
                tmceSwitch.attr('aria-pressed', false);
                htmlSwitch.attr('aria-pressed', true);
                $textarea.attr('aria-hidden', true);
                w.setUserSetting && w.setUserSetting('editor', 'tinymce');

            } else if ('html' === mode) {
                if (editor && editor.isHidden()) return false;

                if (editor) {
                    if (!tinymce.Env.iOS) {
                        iframe = editor.iframeElement;
                        editorHeight = iframe ? parseInt(iframe.style.height, 10) : 0;

                        if (editorHeight) {
                            toolbarHeight = getToolbarHeight(editor);
                            editorHeight = editorHeight + toolbarHeight - 14;

                            if (editorHeight > 50 && editorHeight < 5000) {
                                textarea.style.height = editorHeight + 'px';
                            }
                        }
                    }

                    var selectionRange = findBookmarkedPosition(editor);
                    editor.hide();

                    if (selectionRange) {
                        selectTextInTextArea(editor, selectionRange);
                    }
                } else {
                    $textarea && $textarea.css({ 'display': '', 'visibility': '' });
                }

                wrap.removeClass('tmce-active').addClass('html-active');
                tmceSwitch.attr('aria-pressed', true);
                htmlSwitch.attr('aria-pressed', false);
                $textarea.attr('aria-hidden', false);
                w.setUserSetting && w.setUserSetting('editor', 'html');
            }
        }

        function getContainingTagInfo(content, cursorPosition) {
            var lastLtPos = content.lastIndexOf('<', cursorPosition - 1),
                lastGtPos = content.lastIndexOf('>', cursorPosition);

            if (lastLtPos > lastGtPos || content.substr(cursorPosition, 1) === '>') {
                var tagContent = content.substr(lastLtPos),
                    tagMatch = tagContent.match(/<\s*(\/)?(\w+|\!-{2}.*-{2})/);

                if (!tagMatch) return null;

                var tagType = tagMatch[2],
                    closingGt = tagContent.indexOf('>');

                return {
                    ltPos: lastLtPos,
                    gtPos: lastLtPos + closingGt + 1,
                    tagType: tagType,
                    isClosingTag: !!tagMatch[1]
                };
            }
            return null;
        }

        function getShortcodesInText(content) {
            var shortcodes = content.match(/\[+([\w_-])+/g),
                result = [];

            if (shortcodes) {
                for (var i = 0; i < shortcodes.length; i++) {
                    var shortcode = shortcodes[i].replace(/^\[+/g, '');
                    if (result.indexOf(shortcode) === -1) result.push(shortcode);
                }
            }
            return result;
        }

        function getShortcodeWrapperInfo(content, cursorPosition) {
            var contentShortcodes = getShortCodePositionsInText(content);
            for (var i = 0; i < contentShortcodes.length; i++) {
                var element = contentShortcodes[i];
                if (cursorPosition >= element.startIndex && cursorPosition <= element.endIndex) {
                    return element;
                }
            }
        }

        function getShortCodePositionsInText(content) {
            var allShortcodes = getShortcodesInText(content), shortcodeInfo;

            if (allShortcodes.length === 0) return [];

            var shortcodeDetailsRegexp = wp.shortcode.regexp(allShortcodes.join('|')),
                shortcodeMatch,
                shortcodesDetails = [];

            while (shortcodeMatch = shortcodeDetailsRegexp.exec(content)) {
                var showAsPlainText = shortcodeMatch[1] === '[';

                shortcodeInfo = {
                    shortcodeName: shortcodeMatch[2],
                    showAsPlainText: showAsPlainText,
                    startIndex: shortcodeMatch.index,
                    endIndex: shortcodeMatch.index + shortcodeMatch[0].length,
                    length: shortcodeMatch[0].length
                };

                shortcodesDetails.push(shortcodeInfo);
            }

            var urlRegexp = new RegExp(
                '(^|[\\n\\r][\\n\\r]|<p>)(https?:\\/\\/[^\s"]+?)(<\\/p>\\s*|[\\n\\r][\\n\\r]|$)', 'gi'
            );

            while (shortcodeMatch = urlRegexp.exec(content)) {
                shortcodeInfo = {
                    shortcodeName: 'url',
                    showAsPlainText: false,
                    startIndex: shortcodeMatch.index,
                    endIndex: shortcodeMatch.index + shortcodeMatch[0].length,
                    length: shortcodeMatch[0].length,
                    urlAtStartOfContent: shortcodeMatch[1] === '',
                    urlAtEndOfContent: shortcodeMatch[3] === ''
                };

                shortcodesDetails.push(shortcodeInfo);
            }

            return shortcodesDetails;
        }

        function getCursorMarkerSpan(domLib, content) {
            return domLib('<span>').css({
                display: 'inline-block',
                width: 0,
                overflow: 'hidden',
                'line-height': 0
            }).html(content ? content : '');
        }

        function adjustTextAreaSelectionCursors(content, cursorPositions) {
            var voidElements = [
                'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
                'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr'
            ];

            var cursorStart = cursorPositions.cursorStart,
                cursorEnd = cursorPositions.cursorEnd,
                isCursorStartInTag = getContainingTagInfo(content, cursorStart);

            if (isCursorStartInTag) {
                if (voidElements.indexOf(isCursorStartInTag.tagType) !== -1) {
                    cursorStart = isCursorStartInTag.ltPos;
                } else {
                    cursorStart = isCursorStartInTag.gtPos;
                }
            }

            var isCursorEndInTag = getContainingTagInfo(content, cursorEnd);
            if (isCursorEndInTag) cursorEnd = isCursorEndInTag.gtPos;

            var isCursorStartInShortcode = getShortcodeWrapperInfo(content, cursorStart);
            if (isCursorStartInShortcode && !isCursorStartInShortcode.showAsPlainText) {
                if (isCursorStartInShortcode.urlAtStartOfContent) {
                    cursorStart = isCursorStartInShortcode.endIndex;
                } else {
                    cursorStart = isCursorStartInShortcode.startIndex;
                }
            }

            var isCursorEndInShortcode = getShortcodeWrapperInfo(content, cursorEnd);
            if (isCursorEndInShortcode && !isCursorEndInShortcode.showAsPlainText) {
                if (isCursorEndInShortcode.urlAtEndOfContent) {
                    cursorEnd = isCursorEndInShortcode.startIndex;
                } else {
                    cursorEnd = isCursorEndInShortcode.endIndex;
                }
            }

            return { cursorStart: cursorStart, cursorEnd: cursorEnd };
        }

        function addHTMLBookmarkInTextAreaContent($textarea) {
            if (!$textarea || !$textarea.length) return;

            var textArea = $textarea[0],
                textAreaContent = textArea.value,

                adjustedCursorPositions = adjustTextAreaSelectionCursors(textAreaContent, {
                    cursorStart: textArea.selectionStart,
                    cursorEnd: textArea.selectionEnd
                }),

                htmlModeCursorStartPosition = adjustedCursorPositions.cursorStart,
                htmlModeCursorEndPosition = adjustedCursorPositions.cursorEnd,

                mode = htmlModeCursorStartPosition !== htmlModeCursorEndPosition ? 'range' : 'single',

                selectedText = null,
                cursorMarkerSkeleton = getCursorMarkerSpan($$, '&#65279;').attr('data-mce-type', 'bookmark');

            if (mode === 'range') {
                var markedText = textArea.value.slice(htmlModeCursorStartPosition, htmlModeCursorEndPosition),
                    bookMarkEnd = cursorMarkerSkeleton.clone().addClass('mce_SELRES_end');

                selectedText = [markedText, bookMarkEnd[0].outerHTML].join('');
            }

            textArea.value = [
                textArea.value.slice(0, htmlModeCursorStartPosition),
                cursorMarkerSkeleton.clone().addClass('mce_SELRES_start')[0].outerHTML,
                selectedText,
                textArea.value.slice(htmlModeCursorEndPosition)
            ].join('');
        }

        function focusHTMLBookmarkInVisualEditor(editor) {
            var startNode = editor.$('.mce_SELRES_start').attr('data-mce-bogus', 1),
                endNode = editor.$('.mce_SELRES_end').attr('data-mce-bogus', 1);

            if (startNode.length) {
                editor.focus();

                if (!endNode.length) {
                    editor.selection.select(startNode[0]);
                } else {
                    var selection = editor.getDoc().createRange();
                    selection.setStartAfter(startNode[0]);
                    selection.setEndBefore(endNode[0]);
                    editor.selection.setRng(selection);
                }
            }

            scrollVisualModeToStartElement(editor, startNode);

            removeSelectionMarker(startNode);
            removeSelectionMarker(endNode);

            editor.save();
        }

        function removeSelectionMarker($marker) {
            var $markerParent = $marker.parent();
            $marker.remove();
            if ($markerParent.is('p') && !$markerParent.children().length && !$markerParent.text()) {
                $markerParent.remove();
            }
        }

        function scrollVisualModeToStartElement(editor, element) {
            var elementTop = editor.$(element).offset().top,
                TinyMCEContentAreaTop = editor.$(editor.getContentAreaContainer()).offset().top,

                toolbarHeight = getToolbarHeight(editor),

                edTools = $('#wp-content-editor-tools'),
                edToolsHeight = 0,
                edToolsOffsetTop = 0,

                $scrollArea;

            if (edTools.length) {
                edToolsHeight = edTools.height();
                edToolsOffsetTop = edTools.offset().top;
            }

            var windowHeight = w.innerHeight || document.documentElement.clientHeight || document.body.clientHeight,

                selectionPosition = TinyMCEContentAreaTop + elementTop,
                visibleAreaHeight = windowHeight - (edToolsHeight + toolbarHeight);

            if (selectionPosition < visibleAreaHeight) return;

            var adjustedScroll;
            if (editor.settings.wp_autoresize_on) {
                $scrollArea = $('html,body');
                adjustedScroll = Math.max(selectionPosition - visibleAreaHeight / 2, edToolsOffsetTop - edToolsHeight);
            } else {
                $scrollArea = $(editor.contentDocument).find('html,body');
                adjustedScroll = elementTop;
            }

            $scrollArea.animate({ scrollTop: parseInt(adjustedScroll, 10) }, 100);
        }

        function fixTextAreaContent(event) {
            event.content = event.content.replace(/<p>(?:<br ?\/?>|\u00a0|\uFEFF| )*<\/p>/g, '<p>&nbsp;</p>');
        }

        function findBookmarkedPosition(editor) {
            var TinyMCEWindow = editor.getWin(),
                selection = TinyMCEWindow.getSelection();

            if (!selection || selection.rangeCount < 1) return;

            var selectionID = 'SELRES_' + Math.random();

            var spanSkeleton = getCursorMarkerSpan(editor.$, selectionID),
                startElement = spanSkeleton.clone().addClass('mce_SELRES_start'),
                endElement = spanSkeleton.clone().addClass('mce_SELRES_end');

            var range = selection.getRangeAt(0),
                startNode = range.startContainer,
                startOffset = range.startOffset,
                boundaryRange = range.cloneRange();

            if (editor.$(startNode).parents('.mce-offscreen-selection').length > 0) {
                startNode = editor.$('[data-mce-selected]')[0];

                startElement.attr('data-mce-object-selection', 'true');
                endElement.attr('data-mce-object-selection', 'true');

                editor.$(startNode).before(startElement[0]);
                editor.$(startNode).after(endElement[0]);
            } else {
                boundaryRange.collapse(false);
                boundaryRange.insertNode(endElement[0]);

                boundaryRange.setStart(startNode, startOffset);
                boundaryRange.collapse(true);
                boundaryRange.insertNode(startElement[0]);

                range.setStartAfter(startElement[0]);
                range.setEndBefore(endElement[0]);
                selection.removeAllRanges();
                selection.addRange(range);
            }

            editor.on('GetContent', fixTextAreaContent);
            var content = removep(editor.getContent());
            editor.off('GetContent', fixTextAreaContent);

            startElement.remove();
            endElement.remove();

            var startRegex = new RegExp(
                '<span[^>]*\\s*class="mce_SELRES_start"[^>]+>\\s*' + selectionID + '[^<]*<\\/span>(\\s*)'
            );

            var endRegex = new RegExp(
                '(\\s*)<span[^>]*\\s*class="mce_SELRES_end"[^>]+>\\s*' + selectionID + '[^<]*<\\/span>'
            );

            var startMatch = content.match(startRegex),
                endMatch = content.match(endRegex);

            if (!startMatch) return null;

            var startIndex = startMatch.index,
                startMatchLength = startMatch[0].length,
                endIndex = null;

            if (endMatch) {
                if (startMatch[0].indexOf('data-mce-object-selection') !== -1) {
                    startMatchLength -= startMatch[1].length;
                }

                var endMatchIndex = endMatch.index;

                if (endMatch[0].indexOf('data-mce-object-selection') !== -1) {
                    endMatchIndex -= endMatch[1].length;
                }

                endIndex = endMatchIndex - startMatchLength;
            }

            return { start: startIndex, end: endIndex };
        }

        function selectTextInTextArea(editor, selection) {
            if (!selection) return;

            var textArea = editor.getElement(),
                start = selection.start,
                end = selection.end || selection.start;

            if (textArea.focus) {
                setTimeout(function () {
                    textArea.setSelectionRange(start, end);
                    if (textArea.blur) textArea.blur();
                    textArea.focus();
                }, 100);
            }
        }

        $(document).on('tinymce-editor-init.keep-scroll-position', function (event, editor) {
            if (editor.$('.mce_SELRES_start').length) {
                focusHTMLBookmarkInVisualEditor(editor);
            }
        });

        function removep(html) {
            var blocklist = 'blockquote|ul|ol|li|dl|dt|dd|table|thead|tbody|tfoot|tr|th|td|h[1-6]|fieldset|figure',
                blocklist1 = blocklist + '|div|p',
                blocklist2 = blocklist + '|pre',
                preserve_linebreaks = false,
                preserve_br = false,
                preserve = [];

            if (!html) return '';

            if (html.indexOf('<script') !== -1 || html.indexOf('<style') !== -1) {
                html = html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/g, function (match) {
                    preserve.push(match);
                    return '<wp-preserve>';
                });
            }

            if (html.indexOf('<pre') !== -1) {
                preserve_linebreaks = true;
                html = html.replace(/<pre[^>]*>[\s\S]+?<\/pre>/g, function (a) {
                    a = a.replace(/<br ?\/?>(\r\n|\n)?/g, '<wp-line-break>');
                    a = a.replace(/<\/?p( [^>]*)?>(\r\n|\n)?/g, '<wp-line-break>');
                    return a.replace(/\r?\n/g, '<wp-line-break>');
                });
            }

            if (html.indexOf('[caption') !== -1) {
                preserve_br = true;
                html = html.replace(/\[caption[\s\S]+?\[\/caption\]/g, function (a) {
                    return a.replace(/<br([^>]*)>/g, '<wp-temp-br$1>').replace(/[\r\n\t]+/, '');
                });
            }

            html = html.replace(new RegExp('\\s*</(' + blocklist1 + ')>\\s*', 'g'), '</$1>\n');
            html = html.replace(new RegExp('\\s*<((?:' + blocklist1 + ')(?: [^>]*)?)>', 'g'), '\n<$1>');

            html = html.replace(/(<p [^>]+>.*?)<\/p>/g, '$1</p#>');

            html = html.replace(/<div( [^>]*)?>\s*<p>/gi, '<div$1>\n\n');

            html = html.replace(/\s*<p>/gi, '');
            html = html.replace(/\s*<\/p>\s*/gi, '\n\n');

            html = html.replace(/\n[\s\u00a0]+\n/g, '\n\n');

            html = html.replace(/(\s*)<br ?\/?>\s*/gi, function (match, space) {
                if (space && space.indexOf('\n') !== -1) return '\n\n';
                return '\n';
            });

            html = html.replace(/\s*<div/g, '\n<div');
            html = html.replace(/<\/div>\s*/g, '</div>\n');

            html = html.replace(/\s*\[caption([^\[]+)\[\/caption\]\s*/gi, '\n\n[caption$1[/caption]\n\n');
            html = html.replace(/caption\]\n\n+\[caption/g, 'caption]\n\n[caption');

            html = html.replace(new RegExp('\\s*<((?:' + blocklist2 + ')(?: [^>]*)?)\\s*>', 'g'), '\n<$1>');
            html = html.replace(new RegExp('\\s*</(' + blocklist2 + ')>\\s*', 'g'), '</$1>\n');

            html = html.replace(/<((li|dt|dd)[^>]*)>/g, ' \t<$1>');

            if (html.indexOf('<option') !== -1) {
                html = html.replace(/\s*<option/g, '\n<option');
                html = html.replace(/\s*<\/select>/g, '\n</select>');
            }

            if (html.indexOf('<hr') !== -1) {
                html = html.replace(/\s*<hr( [^>]*)?>\s*/g, '\n\n<hr$1>\n\n');
            }

            if (html.indexOf('<object') !== -1) {
                html = html.replace(/<object[\s\S]+?<\/object>/g, function (a) {
                    return a.replace(/[\r\n]+/g, '');
                });
            }

            html = html.replace(/<\/p#>/g, '</p>\n');

            html = html.replace(/\s*(<p [^>]+>[\s\S]*?<\/p>)/g, '\n$1');

            html = html.replace(/^\s+/, '');
            html = html.replace(/[\s\u00a0]+$/, '');

            if (preserve_linebreaks) {
                html = html.replace(/<wp-line-break>/g, '\n');
            }

            if (preserve_br) {
                html = html.replace(/<wp-temp-br([^>]*)>/g, '<br$1>');
            }

            if (preserve.length) {
                html = html.replace(/<wp-preserve>/g, function () {
                    return preserve.shift();
                });
            }

            return html;
        }

        function autop(text) {
            var preserve_linebreaks = false,
                preserve_br = false,
                blocklist = 'table|thead|tfoot|caption|col|colgroup|tbody|tr|td|th|div|dl|dd|dt|ul|ol|li|pre' +
                    '|form|map|area|blockquote|address|math|style|p|h[1-6]|hr|fieldset|legend|section' +
                    '|article|aside|hgroup|header|footer|nav|figure|figcaption|details|menu|summary';

            text = text.replace(/\r\n|\r/g, '\n');

            if (text.indexOf('<object') !== -1) {
                text = text.replace(/<object[\s\S]+?<\/object>/g, function (a) {
                    return a.replace(/\n+/g, '');
                });
            }

            text = text.replace(/<[^<>]+>/g, function (a) {
                return a.replace(/[\n\t ]+/g, ' ');
            });

            if (text.indexOf('<pre') !== -1 || text.indexOf('<script') !== -1) {
                preserve_linebreaks = true;
                text = text.replace(/<(pre|script)[^>]*>[\s\S]*?<\/\1>/g, function (a) {
                    return a.replace(/\n/g, '<wp-line-break>');
                });
            }

            if (text.indexOf('<figcaption') !== -1) {
                text = text.replace(/\s*(<figcaption[^>]*>)/g, '$1');
                text = text.replace(/<\/figcaption>\s*/g, '</figcaption>');
            }

            if (text.indexOf('[caption') !== -1) {
                preserve_br = true;

                text = text.replace(/\[caption[\s\S]+?\[\/caption\]/g, function (a) {
                    a = a.replace(/<br([^>]*)>/g, '<wp-temp-br$1>');

                    a = a.replace(/<[^<>]+>/g, function (b) {
                        return b.replace(/[\n\t ]+/, ' ');
                    });

                    return a.replace(/\s*\n\s*/g, '<wp-temp-br />');
                });
            }

            text = text + '\n\n';
            text = text.replace(/<br \/>\s*<br \/>/gi, '\n\n');

            text = text.replace(new RegExp('(<(?:' + blocklist + ')(?: [^>]*)?>)', 'gi'), '\n\n$1');
            text = text.replace(new RegExp('(</(?:' + blocklist + ')>)', 'gi'), '$1\n\n');
            text = text.replace(/<hr( [^>]*)?>/gi, '<hr$1>\n\n');

            text = text.replace(/\s*<option/gi, '<option');
            text = text.replace(/<\/option>\s*/gi, '</option>');

            text = text.replace(/\n\s*\n+/g, '\n\n');

            text = text.replace(/([\s\S]+?)\n\n/g, '<p>$1</p>\n');

            text = text.replace(/<p>\s*?<\/p>/gi, '');

            text = text.replace(new RegExp('<p>\\s*(</?(?:' + blocklist + ')(?: [^>]*)?>)\\s*</p>', 'gi'), '$1');
            text = text.replace(/<p>(<li.+?)<\/p>/gi, '$1');

            text = text.replace(/<p>\s*<blockquote([^>]*)>/gi, '<blockquote$1><p>');
            text = text.replace(/<\/blockquote>\s*<\/p>/gi, '</p></blockquote>');

            text = text.replace(new RegExp('<p>\\s*(</?(?:' + blocklist + ')(?: [^>]*)?>)', 'gi'), '$1');
            text = text.replace(new RegExp('(</?(?:' + blocklist + ')(?: [^>]*)?>)\\s*</p>', 'gi'), '$1');

            text = text.replace(/(<br[^>]*>)\s*\n/gi, '$1');

            text = text.replace(/\s*\n/g, '<br />\n');

            text = text.replace(new RegExp('(</?(?:' + blocklist + ')[^>]*>)\\s*<br />', 'gi'), '$1');
            text = text.replace(/<br \/>(\s*<\/?(?:p|li|div|dl|dd|dt|th|pre|td|ul|ol)>)/gi, '$1');

            text = text.replace(/(?:<p>|<br ?\/?>)*\s*\[caption([^\[]+)\[\/caption\]\s*(?:<\/p>|<br ?\/?>)*/gi, '[caption$1[/caption]');

            text = text.replace(/(<(?:div|th|td|form|fieldset|dd)[^>]*>)(.*?)<\/p>/g, function (a, b, c) {
                if (c.match(/<p( [^>]*)?>/)) return a;
                return b + '<p>' + c + '</p>';
            });

            if (preserve_linebreaks) text = text.replace(/<wp-line-break>/g, '\n');
            if (preserve_br) text = text.replace(/<wp-temp-br([^>]*)>/g, '<br$1>');

            return text;
        }

        function pre_wpautop(html) {
            var obj = { o: exports, data: html, unfiltered: html };

            if ($) $('body').trigger('beforePreWpautop', [obj]);

            obj.data = removep(obj.data);

            if ($) $('body').trigger('afterPreWpautop', [obj]);

            return obj.data;
        }

        function wpautop(text) {
            var obj = { o: exports, data: text, unfiltered: text };

            if ($) $('body').trigger('beforeWpautop', [obj]);

            obj.data = autop(obj.data);

            if ($) $('body').trigger('afterWpautop', [obj]);

            return obj.data;
        }

        if ($) {
            $(init);
        } else if (document.addEventListener) {
            document.addEventListener('DOMContentLoaded', init, false);
            w.addEventListener('load', init, false);
        } else if (w.attachEvent) {
            w.attachEvent('onload', init);
            document.attachEvent('onreadystatechange', function () {
                if ('complete' === document.readyState) init();
            });
        }

        wp.editor.autop = wpautop;
        wp.editor.removep = pre_wpautop;

        exports = {
            go: switchEditor,
            wpautop: wpautop,
            pre_wpautop: pre_wpautop,
            _wp_Autop: autop,
            _wp_Nop: removep
        };

        return exports;
    }

    // Глобально экспортируем совместимо с WP
    w.switchEditors = new SwitchEditors();

    wp.editor.initialize = function (id, settings) {
        var init, defaults;

        if (!$ || !id || !wp.editor.getDefaultSettings) {
            return;
        }

        defaults = wp.editor.getDefaultSettings();

        if (!settings) {
            settings = { tinymce: true };
        }

        if (settings.tinymce && settings.quicktags) {
            var $textarea = $('#' + id);

            var $wrap = $('<div>').attr({
                'class': 'wp-core-ui wp-editor-wrap tmce-active',
                id: 'wp-' + id + '-wrap'
            });

            var $editorContainer = $('<div class="wp-editor-container">');

            var $button = $('<button>').attr({
                type: 'button',
                'data-wp-editor-id': id
            });

            var $editorTools = $('<div class="wp-editor-tools">');

            if (settings.mediaButtons) {
                var buttonText = 'Add Media';

                if (w._wpMediaViewsL10n && w._wpMediaViewsL10n.addMedia) {
                    buttonText = w._wpMediaViewsL10n.addMedia;
                }

                var $addMediaButton = $('<button type="button" class="button insert-media add_media">');

                $addMediaButton.append('<span class="wp-media-buttons-icon"></span>');
                $addMediaButton.append(document.createTextNode(' ' + buttonText));
                $addMediaButton.data('editor', id);

                $editorTools.append(
                    $('<div class="wp-media-buttons">').append($addMediaButton)
                );
            }

            $wrap.append(
                $editorTools
                    .append($('<div class="wp-editor-tabs">')
                        .append($button.clone().attr({
                            id: id + '-tmce',
                            'class': 'wp-switch-editor switch-tmce'
                        }).text(w.tinymce ? w.tinymce.translate('Visual') : 'Visual'))
                        .append($button.attr({
                            id: id + '-html',
                            'class': 'wp-switch-editor switch-html'
                        }).text(w.tinymce ? w.tinymce.translate('Code|tab') : 'Code'))
                    ).append($editorContainer)
            );

            $textarea.after($wrap);
            $editorContainer.append($textarea);
        }

        if (w.tinymce && settings.tinymce) {
            if (typeof settings.tinymce !== 'object') {
                settings.tinymce = {};
            }

            init = $.extend({}, defaults.tinymce, settings.tinymce);
            init.selector = '#' + id;

            $(document).trigger('wp-before-tinymce-init', init);
            w.tinymce.init(init);

            if (!w.wpActiveEditor) {
                w.wpActiveEditor = id;
            }
        }

        if (w.quicktags && settings.quicktags) {
            if (typeof settings.quicktags !== 'object') {
                settings.quicktags = {};
            }

            init = $.extend({}, defaults.quicktags, settings.quicktags);
            init.id = id;

            $(document).trigger('wp-before-quicktags-init', init);
            w.quicktags(init);

            if (!w.wpActiveEditor) {
                w.wpActiveEditor = init.id;
            }
        }
    };

    wp.editor.remove = function (id) {
        var mceInstance, qtInstance,
            $wrap = $('#wp-' + id + '-wrap');

        if (w.tinymce) {
            mceInstance = w.tinymce.get(id);

            if (mceInstance) {
                if (!mceInstance.isHidden()) mceInstance.save();
                mceInstance.remove();
            }
        }

        if (w.quicktags) {
            qtInstance = w.QTags.getInstance(id);
            if (qtInstance) qtInstance.remove();
        }

        if ($wrap.length) {
            $wrap.after($('#' + id));
            $wrap.remove();
        }
    };

    wp.editor.getContent = function (id) {
        var editor;

        if (!$ || !id) return;

        if (w.tinymce) {
            editor = w.tinymce.get(id);
            if (editor && !editor.isHidden()) {
                editor.save();
            }
        }
        return $('#' + id).val();
    };

    // ====== КОНЕЦ изменений ======
});

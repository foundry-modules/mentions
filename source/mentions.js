// To increase comparession
var awaitingKeyup_ = "awaitingKeyup",
    insertBefore_ = "insertBefore";

// TODO: Put this elsewhere
$.fn.caret = function(start, end) {

    if (this.length == 0) return;
    if (typeof start == 'number')
    {
        end = (typeof end == 'number') ? end : start;
        return this.each(function ()
        {
            if (this.setSelectionRange)
            {
                this.setSelectionRange(start, end);
            } else if (this.createTextRange)
            {
                var range = this.createTextRange();
                range.collapse(true);
                range.moveEnd('character', end);
                range.moveStart('character', start);
                try { range.select(); } catch (ex) { }
            }
        });
    } else
    {
        if (this[0].setSelectionRange)
        {
            start = this[0].selectionStart;
            end = this[0].selectionEnd;
        } else if (document.selection && document.selection.createRange)
        {
            var range = document.selection.createRange();
            start = 0 - range.duplicate().moveStart('character', -100000);
            end = start + range.text.length;
        }
        return { start: start, end: end };
    }
}

// Constants
var KEYCODE = {
    BACKSPACE: 8, 
    TAB: 9, 
    ENTER: 13, 
    ESC: 27, 
    LEFT: 37, 
    UP: 38, 
    RIGHT: 39, 
    DOWN: 40, 
    SPACE: 32, 
    HOME: 36, 
    END: 35
};

// Templates
$.template("mentions/item", '<b>[%= value %]</b>');
$.template("mentions/inspector", '<div class="mentions-inspector" data-mentions-inspector><fieldset><b>Selection</b><hr/><label>Start</label><input type="text" data-mentions-selection-start/><hr/><label>End</label><input type="text" data-mentions-selection-end/><hr/><label>Length</label><input type="text" data-mentions-selection-length/><hr/></fieldset><fieldset><b>Trigger</b><hr/><label>Key</label><input type="text" data-mentions-trigger-key/><hr/><label>Type</label><input type="text" data-mentions-trigger-type/><hr/><label>Buffer</label><input type="text" data-mentions-trigger-buffer/><hr/></fieldset><hr/> <fieldset><b>Marker</b><hr/><label>Index</label><input type="text" data-mentions-marker-index/><hr/><label>Start</label><input type="text" data-mentions-marker-start/><hr/><label>End</label><input type="text" data-mentions-marker-end/><hr/><label>Length</label><input type="text" data-mentions-marker-length/><hr/><label>Text</label><input type="text" data-mentions-marker-text/><hr/></fieldset><fieldset><b>Block</b><hr/><label>Html</label><input type="text" data-mentions-block-html/><hr/><label>Text</label><input type="text" data-mentions-block-text/><hr/><label>Type</label><input type="text" data-mentions-block-type/><hr/><label>Value</label><input type="text" data-mentions-block-value/><hr/></fieldset></div>');

/*
<div class="mentions-inspector" data-mentions-inspector>
    <fieldset>
        <b>Selection</b>
        <hr/>
        <label>Start</label>
        <input type="text" data-mentions-selection-start/>
        <hr/>
        <label>End</label>
        <input type="text" data-mentions-selection-end/>
        <hr/>
        <label>Length</label>
        <input type="text" data-mentions-selection-length/>
        <hr/>
    </fieldset>
    <fieldset>
        <b>Trigger</b>
        <hr/>
        <label>Key</label>
        <input type="text" data-mentions-trigger-key/>
        <hr/>
        <label>Type</label>
        <input type="text" data-mentions-trigger-type/>
        <hr/>
        <label>Buffer</label>
        <input type="text" data-mentions-trigger-buffer/>
        <hr/>
    </fieldset>
    <hr/> 
    <fieldset>
        <b>Marker</b>
        <hr/>
        <label>Index</label>
        <input type="text" data-mentions-marker-index/>
        <hr/>
        <label>Start</label>
        <input type="text" data-mentions-marker-start/>
        <hr/>
        <label>End</label>
        <input type="text" data-mentions-marker-end/>
        <hr/>
        <label>Length</label>
        <input type="text" data-mentions-marker-length/>
        <hr/>
        <label>Text</label>
        <input type="text" data-mentions-marker-text/>
        <hr/>
    </fieldset>
    <fieldset>
        <b>Block</b>
        <hr/>
        <label>Html</label>
        <input type="text" data-mentions-block-html/>
        <hr/>
        <label>Text</label>
        <input type="text" data-mentions-block-text/>
        <hr/>
        <label>Type</label>
        <input type="text" data-mentions-block-type/>
        <hr/>
        <label>Value</label>
        <input type="text" data-mentions-block-value/>
        <hr/>
    </fieldset>
</div>
*/

var Marker = function(options) {
    $.extend(this, options);
}

$.extend(Marker.prototype, {

    prepend: function(charCode, options) {
        this.insert(charCode, 0, options);
    },

    append: function(charCode, options) {
        this.insert(charCode, this.end - this.start, options);
    },

    insert: function(charCode, pos, options) {

        // Marker
        var marker = this,

            // Character
            char      = String.fromCharCode(charCode),
            backspace = charCode===8,
            newline   = charCode===13,
            space     = charCode===32,

            // Text
            text   = marker.text,
            start  = 0,
            end    = marker.end - marker.start,
            val    = text.nodeValue,

            // Nodes
            parent = marker.parent,
            block  = marker.block,
            before = marker.before,
            after  = marker.after,
            next   = block ? block.nextSibling : text.nextSibling,
            br     = (newline) ? document.createElement("BR") : null,
            nbsp   = document.createTextNode("\u00a0"); // String.fromCharCode(160)

        // console.log(start, marker.start);
        // console.log(newline, start===marker.start, overlay, br, block || text); 
        // We use different text manipulation techniques for
        // different text change cases to achieve better speed.            

        // If cursor is at the start of a marker
        if (pos===start) {

            space && block ? 

                // Add space to the beginning of the previous marker
                before ? before.append(charCode, options) : 

                // Add space text node before the marker
                parent.insertBefore(nbsp, block)

            // Prepend br tag
            :newline ? parent.insertBefore(br, block || text)

            // Remove last character from previous marker
            :backspace ? before && before.append(charCode)

            // Prepend character
            :text.nodeValue = char + val;

        // If cursor is at the end of a marker
        } else if (pos===end) {

            space && block ?

                // Add space to the beginning of the next marker
                after ? after.prepend(charCode, options)

                // Add space text node after the marker
                : parent.insertBefore(nbsp, next)

            // Append br tag
            : newline ? parent.insertBefore(br, next) 

            // Remove last character
            : backspace ? text.nodeValue = val.substr(start, end - 1) 

            // Append character
            : text.nodeValue = val + char; 
            
        // If cursor is in the middle of the marker
        } else {

            var rep;

            newline ? 

                // If this is a block marker
                block ?

                    // Original: <span>hey</span>
                    // Result  : <span>h</span><br>ey
                    options.mutable ? 
                        parent.insertBefore(rep = text.splitText(pos), block) &&
                        parent.insertBefore(br, rep)

                    // Original: <span>hey</span>
                    // Result : hey
                    : marker.toTextMarker()

                // Add br in between
                // Original: h<br/>ey
                : parent.insertBefore(br, text.splitText(pos))

            // Remove character in between
            // Original: hey
            // Result  : h<br/>ey
            : backspace ? text.nodeValue = val.substr(0, pos-1) + val.substr(pos, end)

            // Append character in between
            // Original: hey
            // Result  : hley
            : text.nodeValue = val.substr(0, pos) + char + val.substr(pos, end);

            space && block && !options.allowSpace ? 
                options.mutable ? parent.insertBefore(text.splitText(pos), next)
                : marker.toTextMarker() : null;
        }
    },

    toTextMarker: function() {

        var marker = this,
            block  = marker.block,
            parent = marker.parent;

        if (!block) return;

        var nodes = block.childNodes,
            i = nodes.length;

        while(i--) parent.insertBefore(nodes[i], block.nextSibling);

        parent.removeChild(block);

        parent.normalize();

        delete marker.block;

        // TODO: Trigger markerDestroy event.
    },

    toBlockMarker: function() {



    }
});


$.Controller("Mentions",
{
    pluginName: "mentions",
    hostname: "mentions",

    defaultOptions: {

        view: {
            item: "mentions/item",
            inspector: "mentions/inspector"
        },

        cssCloneProps: [
            'lineHeight', 'textDecoration', 'letterSpacing',
            'fontSize', 'fontFamily', 'fontStyle', 
            'fontWeight', 'textTransform', 'textAlign', 
            'direction', 'wordSpacing', 'fontSizeAdjust'
        ],

        triggers: {
            "@": {
                type: 'entity',
                allowSpace: true
            },
            "#": {
                type: 'hashtag',
                allowSpace: false
            }
        },

        inspector: false,

        "{inspector}": "[data-mentions-inspector]",

        "{selectionStart}" : "[data-mentions-selection-start]",
        "{selectionEnd}"   : "[data-mentions-selection-end]",
        "{selectionLength}": "[data-mentions-selection-length]",

        "{markerIndex}" : "[data-mentions-marker-index]",
        "{markerStart}" : "[data-mentions-marker-start]",
        "{markerEnd}"   : "[data-mentions-marker-end]",
        "{markerLength}": "[data-mentions-marker-length]",
        "{markerText}"  : "[data-mentions-marker-text]",

        "{blockText}" : "[data-mentions-block-text]",
        "{blockHtml}" : "[data-mentions-block-html]",
        "{blockType}" : "[data-mentions-block-type]",
        "{blockValue}": "[data-mentions-block-value]",

        "{triggerKey}" : "[data-mentions-trigger-key]",
        "{triggerType}" : "[data-mentions-trigger-type]",
        "{triggerBuffer}" : "[data-mentions-trigger-buffer]",

        "{textarea}": "[data-mentions-textarea]",
        "{overlay}" : "[data-mentions-overlay]",
        "{block}"   : "[data-mentions-overlay] > span"
    }
},
function(self){ return {

    init: function() {

        self.cloneLayout();

        // Temporarily set to true
        self.options.inspector = true;
        self.showInspector();

        // Speed up access to overlay
        self._overlay = self.overlay()[0];
    },

    setLayout: function() {

    },

    cloneLayout: function() {

        var textarea = self.textarea(),
            overlay  = self.overlay();

        $.each(self.options.cssCloneProps, function() {
            overlay.css(this, textarea.css(this));
        });

        overlay.css('opacity', 1);
    },

    showInspector: function() {

        // If inspector hasn't been created yet
        if (self.inspector().length < 1) {

            // Create inspector and append to textfield
            self.view.inspector()
                .appendTo(self.element);
        }

        self.inspector().show();
    },

    hideInspector: function() {

        self.inspector().hide();
    },

    inspect: $.debounce(function() {

        // Selection
        var caret = self.textarea().caret();

        self.selectionStart().val(caret.start);
        self.selectionEnd().val(caret.end);
        self.selectionLength().val(caret.end - caret.start);

        // Trigger
        var triggerKey = self.triggered;

        if (triggerKey) {
            var trigger = self.options.triggers[triggerKey];
            self.triggerKey().val(triggerKey);
            self.triggerType().val(trigger.type);
            self.triggerBuffer().val(self.buffer);
        } else {
            self.triggerKey().val('');
            self.triggerType().val('');
            self.triggerBuffer().val('');
        }

        // Marker
        var marker = self.getMarkerAt(caret.start);

        if (marker) {
            self.markerIndex().val(marker.index).data('marker', marker);
            self.markerStart().val(marker.start);
            self.markerEnd().val(marker.end);
            self.markerLength().val(marker.length);
            self.markerText().val(marker.text.nodeValue);
        } else {
            self.markerIndex().val('').data('marker', null);
            self.markerStart().val('');
            self.markerEnd().val('');
            self.markerLength().val('');
            self.markerText().val('');
        }

        // Block
        var block = (marker || {}).block;

        if (block) {
            self.blockText().val(marker.text.nodeValue);
            self.blockHtml().val($(block).clone().toHTML());
            // TODO: Retrieve block type & value 
        } else {
            self.blockText().val('');
            self.blockHtml().val('');
        }

    }, 25),

    "{markerIndex} click": function(el) {
        console.dir(el.data("marker"));
    },

    forEachMarker: function(callback) {

        var nodes = self._overlay.childNodes,
            i = 0,
            start = 0,
            before = null,
            result = [];

        for (; i < nodes.length; i++) {

            var node = nodes[i],
                nodeType = node.nodeType,
                text = block = null, ret, end, length;

            switch (nodeType) {

                case 3: // Text node
                    text = node;
                    break;

                case 1: // Block node
                    text = node.childNodes[0]; // Get immediate text node
                    if (!text || text.nodeType!==3) continue; // Skip if invalid block format detected
                    block = node; // Store a reference to this node
                    break;

                default: continue;
            }

            // Create marker object
            var marker = new Marker({
                index : i,
                start : start,
                end   : (end = start + (length = text.length)),
                length: length,
                text  : text,
                block : block,
                before: before,
                parent: self._overlay
            });

            // Execute callback while passing in marker object
            if (callback) ret = callback.apply(marker, [marker]);            

            // If callback returned:
            // false     - stop the loop
            // null      - don't add anything to the result list
            // undefined - add the same marker object to the result list
            // value     - add the value to the result list
            if (ret===false) break;
            if (ret!==null) result.push(ret===undefined ? ret : marker);

            // Else reset start position and
            // continue with next child node.
            before = marker;
            start = end;
        }

        return result;
    },

    getMarkerAt: function(at) {

        if (at===undefined) return;

        var marker;

        self.forEachMarker(function(){

            // If position is inside current node,
            // stop and return marker.
            if (at >= this.start && at < this.end) {
                marker = this;
                return false;
            }
        });

        return marker;
    },

    getMarkerBetween: function(start, end) {

    },

    buffer: '',

    triggered: null,

    getTrigger: function(triggerKey) {

        return self.options.triggers[triggerKey || self.triggered];
    },

    resetBuffer: function() {

        self.buffer = '';
        self.triggered = null;
    },

    insert: function(charCode) {

        // Get chracter, caret, and flags for backspace & new lines.
        var caret = self.caret;

        // If we are inserting character
        if (caret.start===caret.end) {

            // Get marker
            var overlay = self._overlay,
                marker  = self.getMarkerAt(caret.start),
                pos     = caret.start - marker.start,
                options = self.getTrigger(block) || {};

            // Insert character
            marker.insert(charCode, pos, options);

        // If we are replacing a range of characters
        } else {

            // Identify affected markers
        }
    },

    "{textarea} beforecut": function() {

        console.log("BEFORECUT", arguments);
    },

    "{textarea} beforepaste": function() {

        console.log("BEFOREPASTE", arguments);cut
    },

    "{textarea} cut": function(el, event) {

        console.log("CUT", arguments);

        // console.log(event.originalEvent.clipboardData.i)
    },

    "{textarea} paste": function() {

        console.log("PASTE", arguments);
    },

    "{textarea} keydown": function(textarea, event) {

        // See "{textarea} input" for explanation.
        self[awaitingKeyup_] = true;

        // Unicode characters in OSX requires a user
        // to hold down the key while pressing a number
        // from the selection.

        console.log("keydown", event.which || event.keyCode, textarea.caret());

        // Store position of caret before the
        // character was added to the textarea.
        var caret = self.caret = textarea.caret(),
            marker = self.marker = self.getMarkerAt(caret.start);
    },


    // The role of inserting characters is given to keypress
    // because keypress event will not trigger when non-a
    "{textarea} keypress": function(textarea, event) {

        // Keypress do not get triggered when a user
        // selects an accented character from the candidate window in Chrome + OSX.

        var charCode = $.getChar(event);

        console.log("keypress", charCode, textarea.caret());

        if (charCode===false) return;

        self.insert(charCode);

        return;

        var _char = self.currentCharacter = String.fromCharCode(event.which || event.keyCode);


        // If a mention has been triggered
        if (self.triggered) {

            // Push character to trigger buffer
            self.buffer += _char;

        // Determine if this character is a trigger chracter
        } else {

            var triggers = self.options.triggers;

            if (triggers.hasOwnProperty(_char)) {

                // If this character is a trigger character,
                // set triggered to the trigger key;
                self.triggered = _char;
            }
        }
    },

    lastInput: {},

    candidateWindow: {},

    "{textarea} input": function(textarea) {

        // When a person presses keydown and releases, keyup will be triggered,
        // e.g.
        // 
        // keydown
        // input
        // keyup

        // However, when a person presses keydown and goes into candidate window,
        // keyup event will not be triggered until the user decides on the final word,
        // e.g.
        // 
        // keydown
        // input (user is typing inside candidate window)
        // input (..)
        // input (..) 
        // input (..)
        // keyup

        var lastInput = self.lastInput;

        // Determine if user is typing inside a candidate window
        if (self[awaitingKeyup_] && lastInput[awaitingKeyup_]) {

        }

        // first & last input = number of characters inserted
        // secondLastInput.caretEnd - firstInput.caretEnd + 1 = number of characters types
        // lastInput.caretEnd - firstInput.caretEnd + 1 = number of characters inserted (if 0, one character removed)

        var caret = textarea.caret(),
            val = textarea.val();



        console.log("INPUT", textarea.caret(), arguments);
    },    

    "{textarea} keyup": function(textarea, event) {

        // Every keydown event without keyup
        self.awaitingKeyup = 
        self.lastInput.awaitingKeyup = false;


        console.log("keyup", event.which || event.keyCode, textarea.caret());

        self.inspect();


        return;

        var _char = self.currentCharacter,
            start = self.caret.start,
            marker = self.getMarkerAt(start);
    }

}});

$.getChar = function(e) {

    // If CMD was pressed on mac
    if (e.metaKey) return false;

    /*** Convert to Char Code ***/
    var code = e.which;
    
    //Ignore Shift Key events & arrows
    var ignoredCodes = {
        0: true,
        16: true,
        37: true,
        38: true,
        39: true,
        40: true,
        20: true,
        17: true,
        18: true,
        91: true
    };
    
    if(ignoredCodes[code] === true) {
        return false;
    }

    // Return null for backspace
    // if (code===8) return null;
    
    //These are special cases that don't fit the ASCII mapping
    var exceptions = {
        186: 59, // ;
        187: 61, // =
        188: 44, // ,
        189: 45, // -
        190: 46, // .
        191: 47, // /
        192: 96, // `
        219: 91, // [
        220: 92, // \
        221: 93, // ]
        222: 39 // '
    };

    if(exceptions[code] !== undefined) {
        code = exceptions[code];
    }
    
    var ch = String.fromCharCode(code);
    
    /*** Handle Shift ***/
    if(e.shiftKey) {
        var special = {
            1: '!',
            2: '@',
            3: '#',
            4: '$',
            5: '%',
            6: '^',
            7: '&',
            8: '*',
            9: '(',
            0: ')',
            ',': '<',
            '.': '>',
            '/': '?',
            ';': ':',
            "'": '"',
            '[': '{',
            ']': '}',
            '\\': '|',
            '`': '~',
            '-': '_',
            '=': '+'
        };

        if(special[ch] !== undefined) {
            ch = special[ch];
        }
    }
    else {
        ch = ch.toLowerCase();
    }

    // return ch;
    return ch.charCodeAt(0);
}

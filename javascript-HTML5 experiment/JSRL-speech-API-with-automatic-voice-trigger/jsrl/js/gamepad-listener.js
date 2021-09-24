//-------------------//
//  Gamepad listener //
//-------------------//

var haveEvents = 'GamepadEvent' in window;
var haveWebkitEvents = 'WebKitGamepadEvent' in window;
var controllers = {};
var gamepad_listeners = [];
var rAF = window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.requestAnimationFrame;

function connectHandler(e) {
    addGamepad(e.gamepad);
}

function addGamepad(gamepad) {
    controllers[gamepad.index] = gamepad;
    rAF(updateStatus);
}

function disconnectHandler(e) {
    removeGamepad(e.gamepad);
}

function removeGamepad(gamepad) {
    delete controllers[gamepad.index];
}

function scanGamepads() {
    var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
    for (var i = 0; i < gamepads.length; i++) {
        if (gamepads[i]) {
            if (!(gamepads[i].index in controllers)) {
                addGamepad(gamepads[i]);
            } else {
                controllers[gamepads[i].index] = gamepads[i];
            }
        }
    }
}

// Automatically look for connected gamepads
if (haveEvents) {
    window.addEventListener("gamepadconnected", connectHandler);
    window.addEventListener("gamepaddisconnected", disconnectHandler);
} else if (haveWebkitEvents) {
    window.addEventListener("webkitgamepadconnected", connectHandler);
    window.addEventListener("webkitgamepaddisconnected", disconnectHandler);
} else {
    setInterval(scanGamepads, 500);
}


function getGamepadResponse(parameters) {
    var start_time = performance.now();

    var listener_id;

    var pressed_buttons = [];

    var listener_function = function (controllerID, button, button_time) {

        var valid_press = true;

        if (!parameters.persist && pressed_buttons.includes(controllerID + button)) {
            valid_press = false;
        }

        if (valid_press) {
            parameters.callback_function({
                id: controllerID,
                button: button,
                rt: button_time - start_time
            });

            pressed_buttons.push(controllerID + button);
        }
    };

    listener_id = {
        fn: listener_function
    };

    gamepad_listeners.push(listener_id);

    return listener_id;
}


function cancelGamepadResponse(listener_id) {
    if (gamepad_listeners.includes(listener_id)) {
        gamepad_listeners.splice(gamepad_listeners.indexOf(listener_id), 1);
    }
}


// Runs continuously
function updateStatus() {
    scanGamepads();

    for (i in controllers) {
        var controller = controllers[i];
        for (var j = 0; j < controller.buttons.length; j++) {
            var val = controller.buttons[j];
            var pressed = val == 1.0;
            if (typeof (val) == "object") {
                pressed = val.pressed;
                val = val.value;
            }
            if (pressed) {
                button_time = performance.now();
                handleButtonPress(controller.id, j, button_time);
            }
        }
    }

    rAF(updateStatus);
}


function handleButtonPress(controllerID, button, button_time) {
    for (var i = 0; i < gamepad_listeners.length; i++) {
        gamepad_listeners[i].fn(controllerID, button, button_time);
    }
}
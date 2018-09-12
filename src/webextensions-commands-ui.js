/**
 * WebExtensions Commands UI
 * @file webextensions-commands-ui.js
 * @author Roy Six
 * @license MIT
 */

var WebExtensionsCommandsUI = function () {

  const I18N = {
      "commandActivate":     "Activate the extension",
      "typeShortcut":        "Type a shortcut",
      "errorIncludeCtrlAlt": "Include either Ctrl or Alt",
      "errorUseCtrlAlt":     "Use either Ctrl or Alt",
      "errorTypeLetter":     "Type a letter"
    },
    RESET_INPUT_IMG_PATH = "img/material/baseline_cancel_black_18dp.png",
    DOM_ID = "webextensions-commands-ui",
    DOM = {},
    KEYBOARDEVENT_CODE_TO_COMMAND_KEYS = new Map([
      ["Digit0","0"],["Digit1","1"],["Digit2","2"],["Digit3","3"],["Digit4","4"],["Digit5","5"],["Digit6","6"],["Digit7","7"],["Digit8","8"],["Digit9","9"],
      ["KeyA","A"],["KeyB","B"],["KeyC","C"],["KeyD","D"],["KeyE","E"],["KeyF","F"],["KeyG","G"],["KeyH","H"],["KeyI","I"],["KeyJ","J"],["KeyK","K"],["KeyL","L"],["KeyM","M"],
      ["KeyN","N"],["KeyO","O"],["KeyP","P"],["KeyQ","Q"],["KeyR","R"],["KeyS","S"],["KeyT","T"],["KeyU","U"],["KeyV","V"],["KeyW","W"],["KeyX","X"],["KeyY","Y"],["KeyZ","Z"],
      ["F1","F1"],["F2","F2"],["F3","F3"],["F4","F4"],["F5","F5"],["F6","F6"],["F7","F7"],["F8","F8"],["F9","F9"],["F10","F10"],["F11","F11"],["F12","F12"],
      ["Comma","Comma"],["Period","Period"],["Home","Home"],["End","End"],["PageUp","PageUp"],["PageDown","PageDown"],["Space","Space"],["Insert","Insert"],["Delete","Delete"],
      ["ArrowUp", "Up"],["ArrowDown", "Down"],["ArrowLeft", "Left"],["ArrowRight", "Right"],
      ["MediaTrackNext", "MediaNextTrack"],["MediaTrackPrevious", "MediaPrevTrack"],["MediaPlayPause", "MediaPlayPause"],["MediaStop", "MediaStop"]
    ]);

  let error = "";

  function DOMContentLoaded() {
    DOM["#" + DOM_ID] = document.getElementById(DOM_ID);
    browser.commands.getAll(commands => {
      generateHTML(commands);
      cacheDOM();
      addEventListeners(commands);
    });
  }

  function generateHTML(commands) {
    const table = document.createElement("div");
    table.className = "table";
    for (const command of commands) {
      const row = document.createElement("div");
      row.className = "row";
      table.appendChild(row);
      const column1 = document.createElement("div");
      column1.className = "column";
      row.appendChild(column1);
      const label = document.createElement("label");
      label.id = DOM_ID + "-label-" + command.name;
      label.className = DOM_ID + "-label";
      label.textContent = (command.name === "_execute_browser_action" || !command.description) ? I18N.commandActivate : command.description;
      column1.appendChild(label);
      const column2 = document.createElement("div");
      column2.className = "column";
      row.appendChild(column2);
      const container = document.createElement("div");
      container.className = DOM_ID + "-container";
      column2.appendChild(container);
      const input = document.createElement("input");
      input.id = DOM_ID + "-input-" + command.name;
      input.className = DOM_ID + "-input";
      input.type = "text";
      input.value = command.shortcut ? command.shortcut.replace("+", " + ") : "";
      input.placeholder = "";
      input.dataset.name = command.name;
      input.dataset.shortcut = command.shortcut ? command.shortcut.replace("+", " + ") : "";
      container.appendChild(input);
      const underline = document.createElement("div");
      underline.id = DOM_ID + "-underline-" + command.name;
      underline.className = DOM_ID + "-underline";
      container.appendChild(underline);
      const error = document.createElement("div");
      error.id = DOM_ID + "-error-" + command.name;
      error.className = DOM_ID + "-error";
      column2.appendChild(error);
      const reset = document.createElement("input");
      reset.id = DOM_ID + "-reset-" + command.name;
      reset.className = DOM_ID + "-reset";
      reset.type = "image";
      reset.src = RESET_INPUT_IMG_PATH;
      reset.alt = "reset";
      reset.width = reset.height = "20";
      reset.dataset.name = command.name;
      column2.appendChild(reset);
    }
    DOM["#" + DOM_ID].appendChild(table);
  }

  function cacheDOM() {
    const elements = document.querySelectorAll("#" + DOM_ID + " [id]");
    for (let element of elements) {
      DOM["#" + element.id] = element;
    }
  }

  function addEventListeners(commands) {
    for (const command of commands) {
      DOM["#" + DOM_ID + "-input-" + command.name].addEventListener("focus", focus);
      DOM["#" + DOM_ID + "-input-" + command.name].addEventListener("blur", blur);
      DOM["#" + DOM_ID + "-input-" + command.name].addEventListener("keydown", keydown);
      DOM["#" + DOM_ID + "-input-" + command.name].addEventListener("keyup", keyup);
      DOM["#" + DOM_ID + "-reset-" + command.name].addEventListener("click", reset);
    }
  }

  function focus() {
    this.value = "";
    this.placeholder = I18N.typeShortcut;
  }

  function blur() {
    this.value = this.dataset.shortcut;
    this.placeholder = "";
    error = "";
    updateError(this);
  }

  function keydown(event) {
    event.preventDefault();
    // Set Key
    const key = {
      "modifiers": { "altKey": event.altKey, "ctrlKey": event.ctrlKey, "shiftKey": event.shiftKey, "metaKey": event.metaKey },
      "code": KEYBOARDEVENT_CODE_TO_COMMAND_KEYS.get(event.code)
    };
    // Validate Key - Key must either be a Media key or use modifier combinations: Alt, Ctrl, Alt+Shift, Ctrl+Shift (Firefox 63 will add extra valid combinations)
    if (key.code && key.code.startsWith("Media")) {
      error = "";
    } else if (!key.modifiers.altKey && !key.modifiers.ctrlKey) {
      error = I18N.errorIncludeCtrlAlt;
    } else if (key.modifiers.altKey && key.modifiers.ctrlKey) {
      error = I18N.errorUseCtrlAlt;
    } else if (!key.code) {
      error = I18N.errorTypeLetter;
    } else {
      error = "";
    }
    // Write Key to Input
    let text = "";
    if (key && error !== I18N.errorIncludeCtrlAlt && error !== I18N.errorUseCtrlAlt) {
      if (key.modifiers.altKey)   { text += (text ? " + " : "") + "Alt"; }
      if (key.modifiers.ctrlKey)  { text += (text ? " + " : "") + "Ctrl"; }
      if (key.modifiers.shiftKey) { text += (text ? " + " : "") + "Shift"; }
      // if (key.modifiers.metaKey)  { text += "Meta+";  } // TODO
      if (key.code)               { text += (text ? " + " : "") + key.code; }
    }
    this.value = text;
    updateError(this);
  }

  function keyup(event) {
    if (error || !this.value) {
      this.value = "";
      error = "";
      updateError(this);
      return;
    }
    if (browser.commands.update) {
      // browser.commands.getAll(commands => {
      //   // TODO reset the command collision
      // });
      browser.commands.update({
        name: this.dataset.name,
        shortcut: this.value.replace(" + ", "+")
      });
    }
    this.dataset.shortcut = this.value;
    this.blur();
  }

  function reset() {
    if (browser.commands.reset) {
      browser.commands.reset(this.dataset.name);
    }
    DOM["#" + DOM_ID + "-input-" + this.dataset.name].value = "";
    DOM["#" + DOM_ID + "-input-" + this.dataset.name].dataset.shortcut = "";
  }

  function updateError(input) {
    if (error) {
      DOM["#" + DOM_ID + "-underline-" + input.dataset.name].classList.add("error");
      DOM["#" + DOM_ID + "-error-" + input.dataset.name].textContent = error;
    } else {
      DOM["#" + DOM_ID + "-underline-" + input.dataset.name].classList.remove("error");
      DOM["#" + DOM_ID + "-error-" + input.dataset.name].textContent = "";
    }
  }

  return {
    DOMContentLoaded: DOMContentLoaded
  };
}();

// Chrome: Compatibility to recognize browser namespace
if (typeof browser === "undefined") {
  browser = chrome;
}

// Firefox Android: browser.commands is currently unsupported
if (typeof browser !== "undefined" && browser.commands) {
  document.addEventListener("DOMContentLoaded", WebExtensionsCommandsUI.DOMContentLoaded);
}
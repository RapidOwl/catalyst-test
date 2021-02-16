/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/@github/catalyst/lib/attr.js":
/*!***************************************************!*\
  !*** ./node_modules/@github/catalyst/lib/attr.js ***!
  \***************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "attr": () => (/* binding */ attr),
/* harmony export */   "initializeAttrs": () => (/* binding */ initializeAttrs),
/* harmony export */   "defineObservedAttributes": () => (/* binding */ defineObservedAttributes)
/* harmony export */ });
const attrs = new WeakMap();
/**
 * Attr is a decorator which tags a property as one to be initialized via
 * `initializeAttrs`.
 *
 * The signature is typed such that the property must be one of a String,
 * Number or Boolean. This matches the behavior of `initializeAttrs`.
 */
function attr(proto, key) {
    if (!attrs.has(proto))
        attrs.set(proto, []);
    attrs.get(proto).push(key);
}
/**
 * initializeAttrs is called with a set of class property names (if omitted, it
 * will look for any properties tagged with the `@attr` decorator). With this
 * list it defines property descriptors for each property that map to `data-*`
 * attributes on the HTMLElement instance.
 *
 * It works around Native Class Property semantics - which are equivalent to
 * calling `Object.defineProperty` on the instance upon creation, but before
 * `constructor()` is called.
 *
 * If a class property is assigned to the class body, it will infer the type
 * (using `typeof`) and define an appropriate getter/setter combo that aligns
 * to that type. This means class properties assigned to Numbers can only ever
 * be Numbers, assigned to Booleans can only ever be Booleans, and assigned to
 * Strings can only ever be Strings.
 *
 * This is automatically called as part of `@controller`. If a class uses the
 * `@controller` decorator it should not call this manually.
 */
function initializeAttrs(instance, names) {
    if (!names)
        names = attrs.get(Object.getPrototypeOf(instance)) || [];
    for (const key of names) {
        const value = instance[key];
        const name = attrToAttributeName(key);
        let descriptor = {
            get() {
                return this.getAttribute(name) || '';
            },
            set(newValue) {
                this.setAttribute(name, newValue || '');
            }
        };
        if (typeof value === 'number') {
            descriptor = {
                get() {
                    return Number(this.getAttribute(name) || 0);
                },
                set(newValue) {
                    this.setAttribute(name, newValue);
                }
            };
        }
        else if (typeof value === 'boolean') {
            descriptor = {
                get() {
                    return this.hasAttribute(name);
                },
                set(newValue) {
                    this.toggleAttribute(name, newValue);
                }
            };
        }
        Object.defineProperty(instance, key, descriptor);
        if (key in instance && !instance.hasAttribute(name)) {
            descriptor.set.call(instance, value);
        }
    }
}
function attrToAttributeName(name) {
    return `data-${name.replace(/([A-Z]($|[a-z]))/g, '-$1')}`.replace(/--/g, '-').toLowerCase();
}
function defineObservedAttributes(classObject) {
    let observed = classObject.observedAttributes || [];
    Object.defineProperty(classObject, 'observedAttributes', {
        get() {
            const attrMap = attrs.get(classObject.prototype);
            if (!attrMap)
                return observed;
            return attrMap.map(attrToAttributeName).concat(observed);
        },
        set(attributes) {
            observed = attributes;
        }
    });
}
//# sourceMappingURL=attr.js.map

/***/ }),

/***/ "./node_modules/@github/catalyst/lib/auto-shadow-root.js":
/*!***************************************************************!*\
  !*** ./node_modules/@github/catalyst/lib/auto-shadow-root.js ***!
  \***************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "autoShadowRoot": () => (/* binding */ autoShadowRoot)
/* harmony export */ });
function autoShadowRoot(element) {
    for (const template of element.querySelectorAll('template[data-shadowroot]')) {
        if (template.parentElement === element) {
            element
                .attachShadow({
                mode: template.getAttribute('data-shadowroot') === 'closed' ? 'closed' : 'open'
            })
                .append(template.content.cloneNode(true));
        }
    }
}
//# sourceMappingURL=auto-shadow-root.js.map

/***/ }),

/***/ "./node_modules/@github/catalyst/lib/bind.js":
/*!***************************************************!*\
  !*** ./node_modules/@github/catalyst/lib/bind.js ***!
  \***************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "bind": () => (/* binding */ bind),
/* harmony export */   "listenForBind": () => (/* binding */ listenForBind)
/* harmony export */ });
const controllers = new WeakSet();
/*
 * Bind `[data-action]` elements from the DOM to their actions.
 *
 */
function bind(controller) {
    controllers.add(controller);
    if (controller.shadowRoot) {
        bindElements(controller.shadowRoot);
        listenForBind(controller.shadowRoot);
    }
    bindElements(controller);
    listenForBind(controller.ownerDocument);
}
const observers = new WeakMap();
/**
 * Set up observer that will make sure any actions that are dynamically
 * injected into `el` will be bound to it's controller.
 *
 * This returns a Subscription object which you can call `unsubscribe()` on to
 * stop further live updates.
 */
function listenForBind(el = document) {
    if (observers.has(el))
        return observers.get(el);
    let closed = false;
    const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            if (mutation.type === 'attributes' && mutation.target instanceof Element) {
                bindActions(mutation.target);
            }
            else if (mutation.type === 'childList' && mutation.addedNodes.length) {
                for (const node of mutation.addedNodes) {
                    if (node instanceof Element) {
                        bindElements(node);
                    }
                }
            }
        }
    });
    observer.observe(el, { childList: true, subtree: true, attributeFilter: ['data-action'] });
    const subscription = {
        get closed() {
            return closed;
        },
        unsubscribe() {
            closed = true;
            observers.delete(el);
            observer.disconnect();
        }
    };
    observers.set(el, subscription);
    return subscription;
}
function bindElements(root) {
    for (const el of root.querySelectorAll('[data-action]')) {
        bindActions(el);
    }
    // Also bind the controller to itself
    if (root instanceof Element && root.hasAttribute('data-action')) {
        bindActions(root);
    }
}
// Bind a single function to all events to avoid anonymous closure performance penalty.
function handleEvent(event) {
    const el = event.currentTarget;
    for (const binding of bindings(el)) {
        if (event.type === binding.type) {
            const controller = el.closest(binding.tag);
            if (controllers.has(controller) && typeof controller[binding.method] === 'function') {
                controller[binding.method](event);
            }
            const root = el.getRootNode();
            if (root instanceof ShadowRoot && controllers.has(root.host) && root.host.matches(binding.tag)) {
                const shadowController = root.host;
                if (typeof shadowController[binding.method] === 'function') {
                    shadowController[binding.method](event);
                }
            }
        }
    }
}
function* bindings(el) {
    for (const action of (el.getAttribute('data-action') || '').trim().split(/\s+/)) {
        const eventSep = action.lastIndexOf(':');
        const methodSep = action.lastIndexOf('#');
        yield {
            type: action.slice(0, eventSep),
            tag: action.slice(eventSep + 1, methodSep),
            method: action.slice(methodSep + 1)
        };
    }
}
function bindActions(el) {
    for (const binding of bindings(el)) {
        el.addEventListener(binding.type, handleEvent);
    }
}
//# sourceMappingURL=bind.js.map

/***/ }),

/***/ "./node_modules/@github/catalyst/lib/controller.js":
/*!*********************************************************!*\
  !*** ./node_modules/@github/catalyst/lib/controller.js ***!
  \*********************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "controller": () => (/* binding */ controller)
/* harmony export */ });
/* harmony import */ var _register__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./register */ "./node_modules/@github/catalyst/lib/register.js");
/* harmony import */ var _bind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./bind */ "./node_modules/@github/catalyst/lib/bind.js");
/* harmony import */ var _auto_shadow_root__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./auto-shadow-root */ "./node_modules/@github/catalyst/lib/auto-shadow-root.js");
/* harmony import */ var _attr__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./attr */ "./node_modules/@github/catalyst/lib/attr.js");




/**
 * Controller is a decorator to be used over a class that extends HTMLElement.
 * It will automatically `register()` the component in the customElement
 * registry, as well as ensuring `bind(this)` is called on `connectedCallback`,
 * wrapping the classes `connectedCallback` method if needed.
 */
function controller(classObject) {
    const connect = classObject.prototype.connectedCallback;
    classObject.prototype.connectedCallback = function () {
        this.toggleAttribute('data-catalyst', true);
        (0,_auto_shadow_root__WEBPACK_IMPORTED_MODULE_2__.autoShadowRoot)(this);
        (0,_attr__WEBPACK_IMPORTED_MODULE_3__.initializeAttrs)(this);
        if (connect)
            connect.call(this);
        (0,_bind__WEBPACK_IMPORTED_MODULE_1__.bind)(this);
    };
    (0,_attr__WEBPACK_IMPORTED_MODULE_3__.defineObservedAttributes)(classObject);
    (0,_register__WEBPACK_IMPORTED_MODULE_0__.register)(classObject);
}
//# sourceMappingURL=controller.js.map

/***/ }),

/***/ "./node_modules/@github/catalyst/lib/findtarget.js":
/*!*********************************************************!*\
  !*** ./node_modules/@github/catalyst/lib/findtarget.js ***!
  \*********************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "findTarget": () => (/* binding */ findTarget),
/* harmony export */   "findTargets": () => (/* binding */ findTargets)
/* harmony export */ });
/**
 * findTarget will run `querySelectorAll` against the given controller, plus
 * its shadowRoot, returning any the first child that:
 *
 *  - Matches the selector of `[data-target~="tag.name"]` where tag is the
 *  tagName of the given HTMLElement, and `name` is the given `name` argument.
 *
 *  - Closest ascendant of the element, that matches the tagname of the
 *  controller, is the specific instance of the controller itself - in other
 *  words it is not nested in other controllers of the same type.
 *
 */
function findTarget(controller, name) {
    const tag = controller.tagName.toLowerCase();
    if (controller.shadowRoot) {
        for (const el of controller.shadowRoot.querySelectorAll(`[data-target~="${tag}.${name}"]`)) {
            if (!el.closest(tag))
                return el;
        }
    }
    for (const el of controller.querySelectorAll(`[data-target~="${tag}.${name}"]`)) {
        if (el.closest(tag) === controller)
            return el;
    }
}
function findTargets(controller, name) {
    const tag = controller.tagName.toLowerCase();
    const targets = [];
    if (controller.shadowRoot) {
        for (const el of controller.shadowRoot.querySelectorAll(`[data-targets~="${tag}.${name}"]`)) {
            if (!el.closest(tag))
                targets.push(el);
        }
    }
    for (const el of controller.querySelectorAll(`[data-targets~="${tag}.${name}"]`)) {
        if (el.closest(tag) === controller)
            targets.push(el);
    }
    return targets;
}
//# sourceMappingURL=findtarget.js.map

/***/ }),

/***/ "./node_modules/@github/catalyst/lib/index.js":
/*!****************************************************!*\
  !*** ./node_modules/@github/catalyst/lib/index.js ***!
  \****************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "bind": () => (/* reexport safe */ _bind__WEBPACK_IMPORTED_MODULE_0__.bind),
/* harmony export */   "listenForBind": () => (/* reexport safe */ _bind__WEBPACK_IMPORTED_MODULE_0__.listenForBind),
/* harmony export */   "register": () => (/* reexport safe */ _register__WEBPACK_IMPORTED_MODULE_1__.register),
/* harmony export */   "findTarget": () => (/* reexport safe */ _findtarget__WEBPACK_IMPORTED_MODULE_2__.findTarget),
/* harmony export */   "findTargets": () => (/* reexport safe */ _findtarget__WEBPACK_IMPORTED_MODULE_2__.findTargets),
/* harmony export */   "target": () => (/* reexport safe */ _target__WEBPACK_IMPORTED_MODULE_3__.target),
/* harmony export */   "targets": () => (/* reexport safe */ _target__WEBPACK_IMPORTED_MODULE_3__.targets),
/* harmony export */   "controller": () => (/* reexport safe */ _controller__WEBPACK_IMPORTED_MODULE_4__.controller),
/* harmony export */   "attr": () => (/* reexport safe */ _attr__WEBPACK_IMPORTED_MODULE_5__.attr)
/* harmony export */ });
/* harmony import */ var _bind__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./bind */ "./node_modules/@github/catalyst/lib/bind.js");
/* harmony import */ var _register__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./register */ "./node_modules/@github/catalyst/lib/register.js");
/* harmony import */ var _findtarget__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./findtarget */ "./node_modules/@github/catalyst/lib/findtarget.js");
/* harmony import */ var _target__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./target */ "./node_modules/@github/catalyst/lib/target.js");
/* harmony import */ var _controller__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./controller */ "./node_modules/@github/catalyst/lib/controller.js");
/* harmony import */ var _attr__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./attr */ "./node_modules/@github/catalyst/lib/attr.js");






//# sourceMappingURL=index.js.map

/***/ }),

/***/ "./node_modules/@github/catalyst/lib/register.js":
/*!*******************************************************!*\
  !*** ./node_modules/@github/catalyst/lib/register.js ***!
  \*******************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "register": () => (/* binding */ register)
/* harmony export */ });
/**
 * Register the controller as a custom element.
 *
 * The classname is converted to a approriate tag name.
 *
 * Example: HelloController => hello-controller
 */
function register(classObject) {
    const name = classObject.name
        .replace(/([A-Z]($|[a-z]))/g, '-$1')
        .replace(/(^-|-Element$)/g, '')
        .toLowerCase();
    if (!window.customElements.get(name)) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        window[classObject.name] = classObject;
        window.customElements.define(name, classObject);
    }
}
//# sourceMappingURL=register.js.map

/***/ }),

/***/ "./node_modules/@github/catalyst/lib/target.js":
/*!*****************************************************!*\
  !*** ./node_modules/@github/catalyst/lib/target.js ***!
  \*****************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "target": () => (/* binding */ target),
/* harmony export */   "targets": () => (/* binding */ targets)
/* harmony export */ });
/* harmony import */ var _findtarget__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./findtarget */ "./node_modules/@github/catalyst/lib/findtarget.js");

/**
 * Target is a decorator which - when assigned to a property field on the
 * class - will override that class field, turning it into a Getter which
 * returns a call to `findTarget(this, key)` where `key` is the name of the
 * property field. In other words, `@target foo` becomes a getter for
 * `findTarget(this, 'foo')`.
 */
function target(proto, key) {
    return Object.defineProperty(proto, key, {
        configurable: true,
        get() {
            return (0,_findtarget__WEBPACK_IMPORTED_MODULE_0__.findTarget)(this, key);
        }
    });
}
/**
 * Targets is a decorator which - when assigned to a property field on the
 * class - will override that class field, turning it into a Getter which
 * returns a call to `findTargets(this, key)` where `key` is the name of the
 * property field. In other words, `@targets foo` becomes a getter for
 * `findTargets(this, 'foo')`.
 */
function targets(proto, key) {
    return Object.defineProperty(proto, key, {
        configurable: true,
        get() {
            return (0,_findtarget__WEBPACK_IMPORTED_MODULE_0__.findTargets)(this, key);
        }
    });
}
//# sourceMappingURL=target.js.map

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		if(__webpack_module_cache__[moduleId]) {
/******/ 			return __webpack_module_cache__[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _github_catalyst__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @github/catalyst */ "./node_modules/@github/catalyst/lib/index.js");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};

let HelloWorldElement = class HelloWorldElement extends HTMLElement {
    greet() {
        this.outputTarget.textContent =
            `Hello, ${this.nameTarget.value}!`;
    }
};
__decorate([
    _github_catalyst__WEBPACK_IMPORTED_MODULE_0__.target
], HelloWorldElement.prototype, "nameTarget", void 0);
__decorate([
    _github_catalyst__WEBPACK_IMPORTED_MODULE_0__.target
], HelloWorldElement.prototype, "outputTarget", void 0);
HelloWorldElement = __decorate([
    _github_catalyst__WEBPACK_IMPORTED_MODULE_0__.controller
], HelloWorldElement);

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9jYXRhbHlzdC10ZXN0Ly4vbm9kZV9tb2R1bGVzL0BnaXRodWIvY2F0YWx5c3QvbGliL2F0dHIuanMiLCJ3ZWJwYWNrOi8vY2F0YWx5c3QtdGVzdC8uL25vZGVfbW9kdWxlcy9AZ2l0aHViL2NhdGFseXN0L2xpYi9hdXRvLXNoYWRvdy1yb290LmpzIiwid2VicGFjazovL2NhdGFseXN0LXRlc3QvLi9ub2RlX21vZHVsZXMvQGdpdGh1Yi9jYXRhbHlzdC9saWIvYmluZC5qcyIsIndlYnBhY2s6Ly9jYXRhbHlzdC10ZXN0Ly4vbm9kZV9tb2R1bGVzL0BnaXRodWIvY2F0YWx5c3QvbGliL2NvbnRyb2xsZXIuanMiLCJ3ZWJwYWNrOi8vY2F0YWx5c3QtdGVzdC8uL25vZGVfbW9kdWxlcy9AZ2l0aHViL2NhdGFseXN0L2xpYi9maW5kdGFyZ2V0LmpzIiwid2VicGFjazovL2NhdGFseXN0LXRlc3QvLi9ub2RlX21vZHVsZXMvQGdpdGh1Yi9jYXRhbHlzdC9saWIvaW5kZXguanMiLCJ3ZWJwYWNrOi8vY2F0YWx5c3QtdGVzdC8uL25vZGVfbW9kdWxlcy9AZ2l0aHViL2NhdGFseXN0L2xpYi9yZWdpc3Rlci5qcyIsIndlYnBhY2s6Ly9jYXRhbHlzdC10ZXN0Ly4vbm9kZV9tb2R1bGVzL0BnaXRodWIvY2F0YWx5c3QvbGliL3RhcmdldC5qcyIsIndlYnBhY2s6Ly9jYXRhbHlzdC10ZXN0L3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL2NhdGFseXN0LXRlc3Qvd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL2NhdGFseXN0LXRlc3Qvd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9jYXRhbHlzdC10ZXN0L3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vY2F0YWx5c3QtdGVzdC8uL3NyYy9pbmRleC50cyJdLCJu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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9DOzs7Ozs7Ozs7Ozs7Ozs7O0FDbkJ1RDtBQUN2RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNPO0FBQ1A7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CLHVEQUFVO0FBQzdCO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDTztBQUNQO0FBQ0E7QUFDQTtBQUNBLG1CQUFtQix3REFBVztBQUM5QjtBQUNBLEtBQUs7QUFDTDtBQUNBLGtDOzs7Ozs7VUMvQkE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7O1dDckJBO1dBQ0E7V0FDQTtXQUNBO1dBQ0Esd0NBQXdDLHlDQUF5QztXQUNqRjtXQUNBO1dBQ0EsRTs7Ozs7V0NQQSx3Rjs7Ozs7V0NBQTtXQUNBO1dBQ0E7V0FDQSxzREFBc0Qsa0JBQWtCO1dBQ3hFO1dBQ0EsK0NBQStDLGNBQWM7V0FDN0QsRTs7Ozs7Ozs7Ozs7O0FDTkEsa0JBQWtCLFNBQUksSUFBSSxTQUFJO0FBQzlCO0FBQ0E7QUFDQSw0Q0FBNEMsUUFBUTtBQUNwRDtBQUNBO0FBQ3NEO0FBQ3REO0FBQ0E7QUFDQTtBQUNBLHNCQUFzQixzQkFBc0I7QUFDNUM7QUFDQTtBQUNBO0FBQ0EsSUFBSSxvREFBTTtBQUNWO0FBQ0E7QUFDQSxJQUFJLG9EQUFNO0FBQ1Y7QUFDQTtBQUNBLElBQUksd0RBQVU7QUFDZCIsImZpbGUiOiJidW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBhdHRycyA9IG5ldyBXZWFrTWFwKCk7XG4vKipcbiAqIEF0dHIgaXMgYSBkZWNvcmF0b3Igd2hpY2ggdGFncyBhIHByb3BlcnR5IGFzIG9uZSB0byBiZSBpbml0aWFsaXplZCB2aWFcbiAqIGBpbml0aWFsaXplQXR0cnNgLlxuICpcbiAqIFRoZSBzaWduYXR1cmUgaXMgdHlwZWQgc3VjaCB0aGF0IHRoZSBwcm9wZXJ0eSBtdXN0IGJlIG9uZSBvZiBhIFN0cmluZyxcbiAqIE51bWJlciBvciBCb29sZWFuLiBUaGlzIG1hdGNoZXMgdGhlIGJlaGF2aW9yIG9mIGBpbml0aWFsaXplQXR0cnNgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXR0cihwcm90bywga2V5KSB7XG4gICAgaWYgKCFhdHRycy5oYXMocHJvdG8pKVxuICAgICAgICBhdHRycy5zZXQocHJvdG8sIFtdKTtcbiAgICBhdHRycy5nZXQocHJvdG8pLnB1c2goa2V5KTtcbn1cbi8qKlxuICogaW5pdGlhbGl6ZUF0dHJzIGlzIGNhbGxlZCB3aXRoIGEgc2V0IG9mIGNsYXNzIHByb3BlcnR5IG5hbWVzIChpZiBvbWl0dGVkLCBpdFxuICogd2lsbCBsb29rIGZvciBhbnkgcHJvcGVydGllcyB0YWdnZWQgd2l0aCB0aGUgYEBhdHRyYCBkZWNvcmF0b3IpLiBXaXRoIHRoaXNcbiAqIGxpc3QgaXQgZGVmaW5lcyBwcm9wZXJ0eSBkZXNjcmlwdG9ycyBmb3IgZWFjaCBwcm9wZXJ0eSB0aGF0IG1hcCB0byBgZGF0YS0qYFxuICogYXR0cmlidXRlcyBvbiB0aGUgSFRNTEVsZW1lbnQgaW5zdGFuY2UuXG4gKlxuICogSXQgd29ya3MgYXJvdW5kIE5hdGl2ZSBDbGFzcyBQcm9wZXJ0eSBzZW1hbnRpY3MgLSB3aGljaCBhcmUgZXF1aXZhbGVudCB0b1xuICogY2FsbGluZyBgT2JqZWN0LmRlZmluZVByb3BlcnR5YCBvbiB0aGUgaW5zdGFuY2UgdXBvbiBjcmVhdGlvbiwgYnV0IGJlZm9yZVxuICogYGNvbnN0cnVjdG9yKClgIGlzIGNhbGxlZC5cbiAqXG4gKiBJZiBhIGNsYXNzIHByb3BlcnR5IGlzIGFzc2lnbmVkIHRvIHRoZSBjbGFzcyBib2R5LCBpdCB3aWxsIGluZmVyIHRoZSB0eXBlXG4gKiAodXNpbmcgYHR5cGVvZmApIGFuZCBkZWZpbmUgYW4gYXBwcm9wcmlhdGUgZ2V0dGVyL3NldHRlciBjb21ibyB0aGF0IGFsaWduc1xuICogdG8gdGhhdCB0eXBlLiBUaGlzIG1lYW5zIGNsYXNzIHByb3BlcnRpZXMgYXNzaWduZWQgdG8gTnVtYmVycyBjYW4gb25seSBldmVyXG4gKiBiZSBOdW1iZXJzLCBhc3NpZ25lZCB0byBCb29sZWFucyBjYW4gb25seSBldmVyIGJlIEJvb2xlYW5zLCBhbmQgYXNzaWduZWQgdG9cbiAqIFN0cmluZ3MgY2FuIG9ubHkgZXZlciBiZSBTdHJpbmdzLlxuICpcbiAqIFRoaXMgaXMgYXV0b21hdGljYWxseSBjYWxsZWQgYXMgcGFydCBvZiBgQGNvbnRyb2xsZXJgLiBJZiBhIGNsYXNzIHVzZXMgdGhlXG4gKiBgQGNvbnRyb2xsZXJgIGRlY29yYXRvciBpdCBzaG91bGQgbm90IGNhbGwgdGhpcyBtYW51YWxseS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluaXRpYWxpemVBdHRycyhpbnN0YW5jZSwgbmFtZXMpIHtcbiAgICBpZiAoIW5hbWVzKVxuICAgICAgICBuYW1lcyA9IGF0dHJzLmdldChPYmplY3QuZ2V0UHJvdG90eXBlT2YoaW5zdGFuY2UpKSB8fCBbXTtcbiAgICBmb3IgKGNvbnN0IGtleSBvZiBuYW1lcykge1xuICAgICAgICBjb25zdCB2YWx1ZSA9IGluc3RhbmNlW2tleV07XG4gICAgICAgIGNvbnN0IG5hbWUgPSBhdHRyVG9BdHRyaWJ1dGVOYW1lKGtleSk7XG4gICAgICAgIGxldCBkZXNjcmlwdG9yID0ge1xuICAgICAgICAgICAgZ2V0KCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmdldEF0dHJpYnV0ZShuYW1lKSB8fCAnJztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZXQobmV3VmFsdWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShuYW1lLCBuZXdWYWx1ZSB8fCAnJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICBkZXNjcmlwdG9yID0ge1xuICAgICAgICAgICAgICAgIGdldCgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE51bWJlcih0aGlzLmdldEF0dHJpYnV0ZShuYW1lKSB8fCAwKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHNldChuZXdWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShuYW1lLCBuZXdWYWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT09ICdib29sZWFuJykge1xuICAgICAgICAgICAgZGVzY3JpcHRvciA9IHtcbiAgICAgICAgICAgICAgICBnZXQoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmhhc0F0dHJpYnV0ZShuYW1lKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHNldChuZXdWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZUF0dHJpYnV0ZShuYW1lLCBuZXdWYWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoaW5zdGFuY2UsIGtleSwgZGVzY3JpcHRvcik7XG4gICAgICAgIGlmIChrZXkgaW4gaW5zdGFuY2UgJiYgIWluc3RhbmNlLmhhc0F0dHJpYnV0ZShuYW1lKSkge1xuICAgICAgICAgICAgZGVzY3JpcHRvci5zZXQuY2FsbChpbnN0YW5jZSwgdmFsdWUpO1xuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gYXR0clRvQXR0cmlidXRlTmFtZShuYW1lKSB7XG4gICAgcmV0dXJuIGBkYXRhLSR7bmFtZS5yZXBsYWNlKC8oW0EtWl0oJHxbYS16XSkpL2csICctJDEnKX1gLnJlcGxhY2UoLy0tL2csICctJykudG9Mb3dlckNhc2UoKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBkZWZpbmVPYnNlcnZlZEF0dHJpYnV0ZXMoY2xhc3NPYmplY3QpIHtcbiAgICBsZXQgb2JzZXJ2ZWQgPSBjbGFzc09iamVjdC5vYnNlcnZlZEF0dHJpYnV0ZXMgfHwgW107XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGNsYXNzT2JqZWN0LCAnb2JzZXJ2ZWRBdHRyaWJ1dGVzJywge1xuICAgICAgICBnZXQoKSB7XG4gICAgICAgICAgICBjb25zdCBhdHRyTWFwID0gYXR0cnMuZ2V0KGNsYXNzT2JqZWN0LnByb3RvdHlwZSk7XG4gICAgICAgICAgICBpZiAoIWF0dHJNYXApXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9ic2VydmVkO1xuICAgICAgICAgICAgcmV0dXJuIGF0dHJNYXAubWFwKGF0dHJUb0F0dHJpYnV0ZU5hbWUpLmNvbmNhdChvYnNlcnZlZCk7XG4gICAgICAgIH0sXG4gICAgICAgIHNldChhdHRyaWJ1dGVzKSB7XG4gICAgICAgICAgICBvYnNlcnZlZCA9IGF0dHJpYnV0ZXM7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWF0dHIuanMubWFwIiwiZXhwb3J0IGZ1bmN0aW9uIGF1dG9TaGFkb3dSb290KGVsZW1lbnQpIHtcbiAgICBmb3IgKGNvbnN0IHRlbXBsYXRlIG9mIGVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgndGVtcGxhdGVbZGF0YS1zaGFkb3dyb290XScpKSB7XG4gICAgICAgIGlmICh0ZW1wbGF0ZS5wYXJlbnRFbGVtZW50ID09PSBlbGVtZW50KSB7XG4gICAgICAgICAgICBlbGVtZW50XG4gICAgICAgICAgICAgICAgLmF0dGFjaFNoYWRvdyh7XG4gICAgICAgICAgICAgICAgbW9kZTogdGVtcGxhdGUuZ2V0QXR0cmlidXRlKCdkYXRhLXNoYWRvd3Jvb3QnKSA9PT0gJ2Nsb3NlZCcgPyAnY2xvc2VkJyA6ICdvcGVuJ1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuYXBwZW5kKHRlbXBsYXRlLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWF1dG8tc2hhZG93LXJvb3QuanMubWFwIiwiY29uc3QgY29udHJvbGxlcnMgPSBuZXcgV2Vha1NldCgpO1xuLypcbiAqIEJpbmQgYFtkYXRhLWFjdGlvbl1gIGVsZW1lbnRzIGZyb20gdGhlIERPTSB0byB0aGVpciBhY3Rpb25zLlxuICpcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJpbmQoY29udHJvbGxlcikge1xuICAgIGNvbnRyb2xsZXJzLmFkZChjb250cm9sbGVyKTtcbiAgICBpZiAoY29udHJvbGxlci5zaGFkb3dSb290KSB7XG4gICAgICAgIGJpbmRFbGVtZW50cyhjb250cm9sbGVyLnNoYWRvd1Jvb3QpO1xuICAgICAgICBsaXN0ZW5Gb3JCaW5kKGNvbnRyb2xsZXIuc2hhZG93Um9vdCk7XG4gICAgfVxuICAgIGJpbmRFbGVtZW50cyhjb250cm9sbGVyKTtcbiAgICBsaXN0ZW5Gb3JCaW5kKGNvbnRyb2xsZXIub3duZXJEb2N1bWVudCk7XG59XG5jb25zdCBvYnNlcnZlcnMgPSBuZXcgV2Vha01hcCgpO1xuLyoqXG4gKiBTZXQgdXAgb2JzZXJ2ZXIgdGhhdCB3aWxsIG1ha2Ugc3VyZSBhbnkgYWN0aW9ucyB0aGF0IGFyZSBkeW5hbWljYWxseVxuICogaW5qZWN0ZWQgaW50byBgZWxgIHdpbGwgYmUgYm91bmQgdG8gaXQncyBjb250cm9sbGVyLlxuICpcbiAqIFRoaXMgcmV0dXJucyBhIFN1YnNjcmlwdGlvbiBvYmplY3Qgd2hpY2ggeW91IGNhbiBjYWxsIGB1bnN1YnNjcmliZSgpYCBvbiB0b1xuICogc3RvcCBmdXJ0aGVyIGxpdmUgdXBkYXRlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxpc3RlbkZvckJpbmQoZWwgPSBkb2N1bWVudCkge1xuICAgIGlmIChvYnNlcnZlcnMuaGFzKGVsKSlcbiAgICAgICAgcmV0dXJuIG9ic2VydmVycy5nZXQoZWwpO1xuICAgIGxldCBjbG9zZWQgPSBmYWxzZTtcbiAgICBjb25zdCBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKG11dGF0aW9ucyA9PiB7XG4gICAgICAgIGZvciAoY29uc3QgbXV0YXRpb24gb2YgbXV0YXRpb25zKSB7XG4gICAgICAgICAgICBpZiAobXV0YXRpb24udHlwZSA9PT0gJ2F0dHJpYnV0ZXMnICYmIG11dGF0aW9uLnRhcmdldCBpbnN0YW5jZW9mIEVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICBiaW5kQWN0aW9ucyhtdXRhdGlvbi50YXJnZXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAobXV0YXRpb24udHlwZSA9PT0gJ2NoaWxkTGlzdCcgJiYgbXV0YXRpb24uYWRkZWROb2Rlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IG5vZGUgb2YgbXV0YXRpb24uYWRkZWROb2Rlcykge1xuICAgICAgICAgICAgICAgICAgICBpZiAobm9kZSBpbnN0YW5jZW9mIEVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJpbmRFbGVtZW50cyhub2RlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuICAgIG9ic2VydmVyLm9ic2VydmUoZWwsIHsgY2hpbGRMaXN0OiB0cnVlLCBzdWJ0cmVlOiB0cnVlLCBhdHRyaWJ1dGVGaWx0ZXI6IFsnZGF0YS1hY3Rpb24nXSB9KTtcbiAgICBjb25zdCBzdWJzY3JpcHRpb24gPSB7XG4gICAgICAgIGdldCBjbG9zZWQoKSB7XG4gICAgICAgICAgICByZXR1cm4gY2xvc2VkO1xuICAgICAgICB9LFxuICAgICAgICB1bnN1YnNjcmliZSgpIHtcbiAgICAgICAgICAgIGNsb3NlZCA9IHRydWU7XG4gICAgICAgICAgICBvYnNlcnZlcnMuZGVsZXRlKGVsKTtcbiAgICAgICAgICAgIG9ic2VydmVyLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgb2JzZXJ2ZXJzLnNldChlbCwgc3Vic2NyaXB0aW9uKTtcbiAgICByZXR1cm4gc3Vic2NyaXB0aW9uO1xufVxuZnVuY3Rpb24gYmluZEVsZW1lbnRzKHJvb3QpIHtcbiAgICBmb3IgKGNvbnN0IGVsIG9mIHJvb3QucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtYWN0aW9uXScpKSB7XG4gICAgICAgIGJpbmRBY3Rpb25zKGVsKTtcbiAgICB9XG4gICAgLy8gQWxzbyBiaW5kIHRoZSBjb250cm9sbGVyIHRvIGl0c2VsZlxuICAgIGlmIChyb290IGluc3RhbmNlb2YgRWxlbWVudCAmJiByb290Lmhhc0F0dHJpYnV0ZSgnZGF0YS1hY3Rpb24nKSkge1xuICAgICAgICBiaW5kQWN0aW9ucyhyb290KTtcbiAgICB9XG59XG4vLyBCaW5kIGEgc2luZ2xlIGZ1bmN0aW9uIHRvIGFsbCBldmVudHMgdG8gYXZvaWQgYW5vbnltb3VzIGNsb3N1cmUgcGVyZm9ybWFuY2UgcGVuYWx0eS5cbmZ1bmN0aW9uIGhhbmRsZUV2ZW50KGV2ZW50KSB7XG4gICAgY29uc3QgZWwgPSBldmVudC5jdXJyZW50VGFyZ2V0O1xuICAgIGZvciAoY29uc3QgYmluZGluZyBvZiBiaW5kaW5ncyhlbCkpIHtcbiAgICAgICAgaWYgKGV2ZW50LnR5cGUgPT09IGJpbmRpbmcudHlwZSkge1xuICAgICAgICAgICAgY29uc3QgY29udHJvbGxlciA9IGVsLmNsb3Nlc3QoYmluZGluZy50YWcpO1xuICAgICAgICAgICAgaWYgKGNvbnRyb2xsZXJzLmhhcyhjb250cm9sbGVyKSAmJiB0eXBlb2YgY29udHJvbGxlcltiaW5kaW5nLm1ldGhvZF0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyW2JpbmRpbmcubWV0aG9kXShldmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCByb290ID0gZWwuZ2V0Um9vdE5vZGUoKTtcbiAgICAgICAgICAgIGlmIChyb290IGluc3RhbmNlb2YgU2hhZG93Um9vdCAmJiBjb250cm9sbGVycy5oYXMocm9vdC5ob3N0KSAmJiByb290Lmhvc3QubWF0Y2hlcyhiaW5kaW5nLnRhZykpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzaGFkb3dDb250cm9sbGVyID0gcm9vdC5ob3N0O1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygc2hhZG93Q29udHJvbGxlcltiaW5kaW5nLm1ldGhvZF0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgc2hhZG93Q29udHJvbGxlcltiaW5kaW5nLm1ldGhvZF0oZXZlbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uKiBiaW5kaW5ncyhlbCkge1xuICAgIGZvciAoY29uc3QgYWN0aW9uIG9mIChlbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtYWN0aW9uJykgfHwgJycpLnRyaW0oKS5zcGxpdCgvXFxzKy8pKSB7XG4gICAgICAgIGNvbnN0IGV2ZW50U2VwID0gYWN0aW9uLmxhc3RJbmRleE9mKCc6Jyk7XG4gICAgICAgIGNvbnN0IG1ldGhvZFNlcCA9IGFjdGlvbi5sYXN0SW5kZXhPZignIycpO1xuICAgICAgICB5aWVsZCB7XG4gICAgICAgICAgICB0eXBlOiBhY3Rpb24uc2xpY2UoMCwgZXZlbnRTZXApLFxuICAgICAgICAgICAgdGFnOiBhY3Rpb24uc2xpY2UoZXZlbnRTZXAgKyAxLCBtZXRob2RTZXApLFxuICAgICAgICAgICAgbWV0aG9kOiBhY3Rpb24uc2xpY2UobWV0aG9kU2VwICsgMSlcbiAgICAgICAgfTtcbiAgICB9XG59XG5mdW5jdGlvbiBiaW5kQWN0aW9ucyhlbCkge1xuICAgIGZvciAoY29uc3QgYmluZGluZyBvZiBiaW5kaW5ncyhlbCkpIHtcbiAgICAgICAgZWwuYWRkRXZlbnRMaXN0ZW5lcihiaW5kaW5nLnR5cGUsIGhhbmRsZUV2ZW50KTtcbiAgICB9XG59XG4vLyMgc291cmNlTWFwcGluZ1VSTD1iaW5kLmpzLm1hcCIsImltcG9ydCB7IHJlZ2lzdGVyIH0gZnJvbSAnLi9yZWdpc3Rlcic7XG5pbXBvcnQgeyBiaW5kIH0gZnJvbSAnLi9iaW5kJztcbmltcG9ydCB7IGF1dG9TaGFkb3dSb290IH0gZnJvbSAnLi9hdXRvLXNoYWRvdy1yb290JztcbmltcG9ydCB7IGRlZmluZU9ic2VydmVkQXR0cmlidXRlcywgaW5pdGlhbGl6ZUF0dHJzIH0gZnJvbSAnLi9hdHRyJztcbi8qKlxuICogQ29udHJvbGxlciBpcyBhIGRlY29yYXRvciB0byBiZSB1c2VkIG92ZXIgYSBjbGFzcyB0aGF0IGV4dGVuZHMgSFRNTEVsZW1lbnQuXG4gKiBJdCB3aWxsIGF1dG9tYXRpY2FsbHkgYHJlZ2lzdGVyKClgIHRoZSBjb21wb25lbnQgaW4gdGhlIGN1c3RvbUVsZW1lbnRcbiAqIHJlZ2lzdHJ5LCBhcyB3ZWxsIGFzIGVuc3VyaW5nIGBiaW5kKHRoaXMpYCBpcyBjYWxsZWQgb24gYGNvbm5lY3RlZENhbGxiYWNrYCxcbiAqIHdyYXBwaW5nIHRoZSBjbGFzc2VzIGBjb25uZWN0ZWRDYWxsYmFja2AgbWV0aG9kIGlmIG5lZWRlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbnRyb2xsZXIoY2xhc3NPYmplY3QpIHtcbiAgICBjb25zdCBjb25uZWN0ID0gY2xhc3NPYmplY3QucHJvdG90eXBlLmNvbm5lY3RlZENhbGxiYWNrO1xuICAgIGNsYXNzT2JqZWN0LnByb3RvdHlwZS5jb25uZWN0ZWRDYWxsYmFjayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy50b2dnbGVBdHRyaWJ1dGUoJ2RhdGEtY2F0YWx5c3QnLCB0cnVlKTtcbiAgICAgICAgYXV0b1NoYWRvd1Jvb3QodGhpcyk7XG4gICAgICAgIGluaXRpYWxpemVBdHRycyh0aGlzKTtcbiAgICAgICAgaWYgKGNvbm5lY3QpXG4gICAgICAgICAgICBjb25uZWN0LmNhbGwodGhpcyk7XG4gICAgICAgIGJpbmQodGhpcyk7XG4gICAgfTtcbiAgICBkZWZpbmVPYnNlcnZlZEF0dHJpYnV0ZXMoY2xhc3NPYmplY3QpO1xuICAgIHJlZ2lzdGVyKGNsYXNzT2JqZWN0KTtcbn1cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWNvbnRyb2xsZXIuanMubWFwIiwiLyoqXG4gKiBmaW5kVGFyZ2V0IHdpbGwgcnVuIGBxdWVyeVNlbGVjdG9yQWxsYCBhZ2FpbnN0IHRoZSBnaXZlbiBjb250cm9sbGVyLCBwbHVzXG4gKiBpdHMgc2hhZG93Um9vdCwgcmV0dXJuaW5nIGFueSB0aGUgZmlyc3QgY2hpbGQgdGhhdDpcbiAqXG4gKiAgLSBNYXRjaGVzIHRoZSBzZWxlY3RvciBvZiBgW2RhdGEtdGFyZ2V0fj1cInRhZy5uYW1lXCJdYCB3aGVyZSB0YWcgaXMgdGhlXG4gKiAgdGFnTmFtZSBvZiB0aGUgZ2l2ZW4gSFRNTEVsZW1lbnQsIGFuZCBgbmFtZWAgaXMgdGhlIGdpdmVuIGBuYW1lYCBhcmd1bWVudC5cbiAqXG4gKiAgLSBDbG9zZXN0IGFzY2VuZGFudCBvZiB0aGUgZWxlbWVudCwgdGhhdCBtYXRjaGVzIHRoZSB0YWduYW1lIG9mIHRoZVxuICogIGNvbnRyb2xsZXIsIGlzIHRoZSBzcGVjaWZpYyBpbnN0YW5jZSBvZiB0aGUgY29udHJvbGxlciBpdHNlbGYgLSBpbiBvdGhlclxuICogIHdvcmRzIGl0IGlzIG5vdCBuZXN0ZWQgaW4gb3RoZXIgY29udHJvbGxlcnMgb2YgdGhlIHNhbWUgdHlwZS5cbiAqXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaW5kVGFyZ2V0KGNvbnRyb2xsZXIsIG5hbWUpIHtcbiAgICBjb25zdCB0YWcgPSBjb250cm9sbGVyLnRhZ05hbWUudG9Mb3dlckNhc2UoKTtcbiAgICBpZiAoY29udHJvbGxlci5zaGFkb3dSb290KSB7XG4gICAgICAgIGZvciAoY29uc3QgZWwgb2YgY29udHJvbGxlci5zaGFkb3dSb290LnF1ZXJ5U2VsZWN0b3JBbGwoYFtkYXRhLXRhcmdldH49XCIke3RhZ30uJHtuYW1lfVwiXWApKSB7XG4gICAgICAgICAgICBpZiAoIWVsLmNsb3Nlc3QodGFnKSlcbiAgICAgICAgICAgICAgICByZXR1cm4gZWw7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZm9yIChjb25zdCBlbCBvZiBjb250cm9sbGVyLnF1ZXJ5U2VsZWN0b3JBbGwoYFtkYXRhLXRhcmdldH49XCIke3RhZ30uJHtuYW1lfVwiXWApKSB7XG4gICAgICAgIGlmIChlbC5jbG9zZXN0KHRhZykgPT09IGNvbnRyb2xsZXIpXG4gICAgICAgICAgICByZXR1cm4gZWw7XG4gICAgfVxufVxuZXhwb3J0IGZ1bmN0aW9uIGZpbmRUYXJnZXRzKGNvbnRyb2xsZXIsIG5hbWUpIHtcbiAgICBjb25zdCB0YWcgPSBjb250cm9sbGVyLnRhZ05hbWUudG9Mb3dlckNhc2UoKTtcbiAgICBjb25zdCB0YXJnZXRzID0gW107XG4gICAgaWYgKGNvbnRyb2xsZXIuc2hhZG93Um9vdCkge1xuICAgICAgICBmb3IgKGNvbnN0IGVsIG9mIGNvbnRyb2xsZXIuc2hhZG93Um9vdC5xdWVyeVNlbGVjdG9yQWxsKGBbZGF0YS10YXJnZXRzfj1cIiR7dGFnfS4ke25hbWV9XCJdYCkpIHtcbiAgICAgICAgICAgIGlmICghZWwuY2xvc2VzdCh0YWcpKVxuICAgICAgICAgICAgICAgIHRhcmdldHMucHVzaChlbCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZm9yIChjb25zdCBlbCBvZiBjb250cm9sbGVyLnF1ZXJ5U2VsZWN0b3JBbGwoYFtkYXRhLXRhcmdldHN+PVwiJHt0YWd9LiR7bmFtZX1cIl1gKSkge1xuICAgICAgICBpZiAoZWwuY2xvc2VzdCh0YWcpID09PSBjb250cm9sbGVyKVxuICAgICAgICAgICAgdGFyZ2V0cy5wdXNoKGVsKTtcbiAgICB9XG4gICAgcmV0dXJuIHRhcmdldHM7XG59XG4vLyMgc291cmNlTWFwcGluZ1VSTD1maW5kdGFyZ2V0LmpzLm1hcCIsImV4cG9ydCB7IGJpbmQsIGxpc3RlbkZvckJpbmQgfSBmcm9tICcuL2JpbmQnO1xuZXhwb3J0IHsgcmVnaXN0ZXIgfSBmcm9tICcuL3JlZ2lzdGVyJztcbmV4cG9ydCB7IGZpbmRUYXJnZXQsIGZpbmRUYXJnZXRzIH0gZnJvbSAnLi9maW5kdGFyZ2V0JztcbmV4cG9ydCB7IHRhcmdldCwgdGFyZ2V0cyB9IGZyb20gJy4vdGFyZ2V0JztcbmV4cG9ydCB7IGNvbnRyb2xsZXIgfSBmcm9tICcuL2NvbnRyb2xsZXInO1xuZXhwb3J0IHsgYXR0ciB9IGZyb20gJy4vYXR0cic7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLCIvKipcbiAqIFJlZ2lzdGVyIHRoZSBjb250cm9sbGVyIGFzIGEgY3VzdG9tIGVsZW1lbnQuXG4gKlxuICogVGhlIGNsYXNzbmFtZSBpcyBjb252ZXJ0ZWQgdG8gYSBhcHByb3JpYXRlIHRhZyBuYW1lLlxuICpcbiAqIEV4YW1wbGU6IEhlbGxvQ29udHJvbGxlciA9PiBoZWxsby1jb250cm9sbGVyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlcihjbGFzc09iamVjdCkge1xuICAgIGNvbnN0IG5hbWUgPSBjbGFzc09iamVjdC5uYW1lXG4gICAgICAgIC5yZXBsYWNlKC8oW0EtWl0oJHxbYS16XSkpL2csICctJDEnKVxuICAgICAgICAucmVwbGFjZSgvKF4tfC1FbGVtZW50JCkvZywgJycpXG4gICAgICAgIC50b0xvd2VyQ2FzZSgpO1xuICAgIGlmICghd2luZG93LmN1c3RvbUVsZW1lbnRzLmdldChuYW1lKSkge1xuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L2Jhbi10cy1jb21tZW50XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgd2luZG93W2NsYXNzT2JqZWN0Lm5hbWVdID0gY2xhc3NPYmplY3Q7XG4gICAgICAgIHdpbmRvdy5jdXN0b21FbGVtZW50cy5kZWZpbmUobmFtZSwgY2xhc3NPYmplY3QpO1xuICAgIH1cbn1cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXJlZ2lzdGVyLmpzLm1hcCIsImltcG9ydCB7IGZpbmRUYXJnZXQsIGZpbmRUYXJnZXRzIH0gZnJvbSAnLi9maW5kdGFyZ2V0Jztcbi8qKlxuICogVGFyZ2V0IGlzIGEgZGVjb3JhdG9yIHdoaWNoIC0gd2hlbiBhc3NpZ25lZCB0byBhIHByb3BlcnR5IGZpZWxkIG9uIHRoZVxuICogY2xhc3MgLSB3aWxsIG92ZXJyaWRlIHRoYXQgY2xhc3MgZmllbGQsIHR1cm5pbmcgaXQgaW50byBhIEdldHRlciB3aGljaFxuICogcmV0dXJucyBhIGNhbGwgdG8gYGZpbmRUYXJnZXQodGhpcywga2V5KWAgd2hlcmUgYGtleWAgaXMgdGhlIG5hbWUgb2YgdGhlXG4gKiBwcm9wZXJ0eSBmaWVsZC4gSW4gb3RoZXIgd29yZHMsIGBAdGFyZ2V0IGZvb2AgYmVjb21lcyBhIGdldHRlciBmb3JcbiAqIGBmaW5kVGFyZ2V0KHRoaXMsICdmb28nKWAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0YXJnZXQocHJvdG8sIGtleSkge1xuICAgIHJldHVybiBPYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG8sIGtleSwge1xuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIGdldCgpIHtcbiAgICAgICAgICAgIHJldHVybiBmaW5kVGFyZ2V0KHRoaXMsIGtleSk7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cbi8qKlxuICogVGFyZ2V0cyBpcyBhIGRlY29yYXRvciB3aGljaCAtIHdoZW4gYXNzaWduZWQgdG8gYSBwcm9wZXJ0eSBmaWVsZCBvbiB0aGVcbiAqIGNsYXNzIC0gd2lsbCBvdmVycmlkZSB0aGF0IGNsYXNzIGZpZWxkLCB0dXJuaW5nIGl0IGludG8gYSBHZXR0ZXIgd2hpY2hcbiAqIHJldHVybnMgYSBjYWxsIHRvIGBmaW5kVGFyZ2V0cyh0aGlzLCBrZXkpYCB3aGVyZSBga2V5YCBpcyB0aGUgbmFtZSBvZiB0aGVcbiAqIHByb3BlcnR5IGZpZWxkLiBJbiBvdGhlciB3b3JkcywgYEB0YXJnZXRzIGZvb2AgYmVjb21lcyBhIGdldHRlciBmb3JcbiAqIGBmaW5kVGFyZ2V0cyh0aGlzLCAnZm9vJylgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdGFyZ2V0cyhwcm90bywga2V5KSB7XG4gICAgcmV0dXJuIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90bywga2V5LCB7XG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgZ2V0KCkge1xuICAgICAgICAgICAgcmV0dXJuIGZpbmRUYXJnZXRzKHRoaXMsIGtleSk7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXRhcmdldC5qcy5tYXAiLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHRpZihfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdKSB7XG5cdFx0cmV0dXJuIF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0uZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJ2YXIgX19kZWNvcmF0ZSA9ICh0aGlzICYmIHRoaXMuX19kZWNvcmF0ZSkgfHwgZnVuY3Rpb24gKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XHJcbiAgICB2YXIgYyA9IGFyZ3VtZW50cy5sZW5ndGgsIHIgPSBjIDwgMyA/IHRhcmdldCA6IGRlc2MgPT09IG51bGwgPyBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIGtleSkgOiBkZXNjLCBkO1xyXG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcclxuICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XHJcbiAgICByZXR1cm4gYyA+IDMgJiYgciAmJiBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHIpLCByO1xyXG59O1xyXG5pbXBvcnQgeyBjb250cm9sbGVyLCB0YXJnZXQgfSBmcm9tIFwiQGdpdGh1Yi9jYXRhbHlzdFwiO1xyXG5sZXQgSGVsbG9Xb3JsZEVsZW1lbnQgPSBjbGFzcyBIZWxsb1dvcmxkRWxlbWVudCBleHRlbmRzIEhUTUxFbGVtZW50IHtcclxuICAgIGdyZWV0KCkge1xyXG4gICAgICAgIHRoaXMub3V0cHV0VGFyZ2V0LnRleHRDb250ZW50ID1cclxuICAgICAgICAgICAgYEhlbGxvLCAke3RoaXMubmFtZVRhcmdldC52YWx1ZX0hYDtcclxuICAgIH1cclxufTtcclxuX19kZWNvcmF0ZShbXHJcbiAgICB0YXJnZXRcclxuXSwgSGVsbG9Xb3JsZEVsZW1lbnQucHJvdG90eXBlLCBcIm5hbWVUYXJnZXRcIiwgdm9pZCAwKTtcclxuX19kZWNvcmF0ZShbXHJcbiAgICB0YXJnZXRcclxuXSwgSGVsbG9Xb3JsZEVsZW1lbnQucHJvdG90eXBlLCBcIm91dHB1dFRhcmdldFwiLCB2b2lkIDApO1xyXG5IZWxsb1dvcmxkRWxlbWVudCA9IF9fZGVjb3JhdGUoW1xyXG4gICAgY29udHJvbGxlclxyXG5dLCBIZWxsb1dvcmxkRWxlbWVudCk7XHJcbiJdLCJzb3VyY2VSb290IjoiIn0=
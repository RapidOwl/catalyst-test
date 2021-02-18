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
        this.output.textContent = `Hello, ${this.name.value}!`;
    }
};
__decorate([
    _github_catalyst__WEBPACK_IMPORTED_MODULE_0__.target
], HelloWorldElement.prototype, "name", void 0);
__decorate([
    _github_catalyst__WEBPACK_IMPORTED_MODULE_0__.target
], HelloWorldElement.prototype, "output", void 0);
HelloWorldElement = __decorate([
    _github_catalyst__WEBPACK_IMPORTED_MODULE_0__.controller
], HelloWorldElement);

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9jYXRhbHlzdC10ZXN0Ly4vbm9kZV9tb2R1bGVzL0BnaXRodWIvY2F0YWx5c3QvbGliL2F0dHIuanMiLCJ3ZWJwYWNrOi8vY2F0YWx5c3QtdGVzdC8uL25vZGVfbW9kdWxlcy9AZ2l0aHViL2NhdGFseXN0L2xpYi9hdXRvLXNoYWRvdy1yb290LmpzIiwid2VicGFjazovL2NhdGFseXN0LXRlc3QvLi9ub2RlX21vZHVsZXMvQGdpdGh1Yi9jYXRhbHlzdC9saWIvYmluZC5qcyIsIndlYnBhY2s6Ly9jYXRhbHlzdC10ZXN0Ly4vbm9kZV9tb2R1bGVzL0BnaXRodWIvY2F0YWx5c3QvbGliL2NvbnRyb2xsZXIuanMiLCJ3ZWJwYWNrOi8vY2F0YWx5c3QtdGVzdC8uL25vZGVfbW9kdWxlcy9AZ2l0aHViL2NhdGFseXN0L2xpYi9maW5kdGFyZ2V0LmpzIiwid2VicGFjazovL2NhdGFseXN0LXRlc3QvLi9ub2RlX21vZHVsZXMvQGdpdGh1Yi9jYXRhbHlzdC9saWIvaW5kZXguanMiLCJ3ZWJwYWNrOi8vY2F0YWx5c3QtdGVzdC8uL25vZGVfbW9kdWxlcy9AZ2l0aHViL2NhdGFseXN0L2xpYi9yZWdpc3Rlci5qcyIsIndlYnBhY2s6Ly9jYXRhbHlzdC10ZXN0Ly4vbm9kZV9tb2R1bGVzL0BnaXRodWIvY2F0YWx5c3QvbGliL3RhcmdldC5qcyIsIndlYnBhY2s6Ly9jYXRhbHlzdC10ZXN0L3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL2NhdGFseXN0LXRlc3Qvd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL2NhdGFseXN0LXRlc3Qvd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9jYXRhbHlzdC10ZXN0L3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vY2F0YWx5c3QtdGVzdC8uL3NyYy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBbUIseUNBQXlDO0FBQzVEO0FBQ087QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQSxnQzs7Ozs7Ozs7Ozs7Ozs7QUN6Rk87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNEM7Ozs7Ozs7Ozs7Ozs7OztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ087QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTCwwQkFBMEIsbUVBQW1FO0FBQzdGO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0M7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ2xHc0M7QUFDUjtBQUNzQjtBQUNlO0FBQ25FO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNPO0FBQ1A7QUFDQTtBQUNBO0FBQ0EsUUFBUSxpRUFBYztBQUN0QixRQUFRLHNEQUFlO0FBQ3ZCO0FBQ0E7QUFDQSxRQUFRLDJDQUFJO0FBQ1o7QUFDQSxJQUFJLCtEQUF3QjtBQUM1QixJQUFJLG1EQUFRO0FBQ1o7QUFDQSxzQzs7Ozs7Ozs7Ozs7Ozs7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNPO0FBQ1A7QUFDQTtBQUNBLGtGQUFrRixJQUFJLEdBQUcsS0FBSztBQUM5RjtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1FQUFtRSxJQUFJLEdBQUcsS0FBSztBQUMvRTtBQUNBO0FBQ0E7QUFDQTtBQUNPO0FBQ1A7QUFDQTtBQUNBO0FBQ0EsbUZBQW1GLElBQUksR0FBRyxLQUFLO0FBQy9GO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0VBQW9FLElBQUksR0FBRyxLQUFLO0FBQ2hGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxzQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ3hDNkM7QUFDUDtBQUNpQjtBQUNaO0FBQ0Q7QUFDWjtBQUM5QixpQzs7Ozs7Ozs7Ozs7Ozs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9DOzs7Ozs7Ozs7Ozs7Ozs7O0FDbkJ1RDtBQUN2RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNPO0FBQ1A7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CLHVEQUFVO0FBQzdCO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDTztBQUNQO0FBQ0E7QUFDQTtBQUNBLG1CQUFtQix3REFBVztBQUM5QjtBQUNBLEtBQUs7QUFDTDtBQUNBLGtDOzs7Ozs7VUMvQkE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7O1dDckJBO1dBQ0E7V0FDQTtXQUNBO1dBQ0Esd0NBQXdDLHlDQUF5QztXQUNqRjtXQUNBO1dBQ0EsRTs7Ozs7V0NQQSx3Rjs7Ozs7V0NBQTtXQUNBO1dBQ0E7V0FDQSxzREFBc0Qsa0JBQWtCO1dBQ3hFO1dBQ0EsK0NBQStDLGNBQWM7V0FDN0QsRTs7Ozs7Ozs7Ozs7O0FDTkEsa0JBQWtCLFNBQUksSUFBSSxTQUFJO0FBQzlCO0FBQ0E7QUFDQSw0Q0FBNEMsUUFBUTtBQUNwRDtBQUNBO0FBQ3NEO0FBQ3REO0FBQ0E7QUFDQSw0Q0FBNEMsZ0JBQWdCO0FBQzVEO0FBQ0E7QUFDQTtBQUNBLElBQUksb0RBQU07QUFDVjtBQUNBO0FBQ0EsSUFBSSxvREFBTTtBQUNWO0FBQ0E7QUFDQSxJQUFJLHdEQUFVO0FBQ2QiLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgYXR0cnMgPSBuZXcgV2Vha01hcCgpO1xuLyoqXG4gKiBBdHRyIGlzIGEgZGVjb3JhdG9yIHdoaWNoIHRhZ3MgYSBwcm9wZXJ0eSBhcyBvbmUgdG8gYmUgaW5pdGlhbGl6ZWQgdmlhXG4gKiBgaW5pdGlhbGl6ZUF0dHJzYC5cbiAqXG4gKiBUaGUgc2lnbmF0dXJlIGlzIHR5cGVkIHN1Y2ggdGhhdCB0aGUgcHJvcGVydHkgbXVzdCBiZSBvbmUgb2YgYSBTdHJpbmcsXG4gKiBOdW1iZXIgb3IgQm9vbGVhbi4gVGhpcyBtYXRjaGVzIHRoZSBiZWhhdmlvciBvZiBgaW5pdGlhbGl6ZUF0dHJzYC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGF0dHIocHJvdG8sIGtleSkge1xuICAgIGlmICghYXR0cnMuaGFzKHByb3RvKSlcbiAgICAgICAgYXR0cnMuc2V0KHByb3RvLCBbXSk7XG4gICAgYXR0cnMuZ2V0KHByb3RvKS5wdXNoKGtleSk7XG59XG4vKipcbiAqIGluaXRpYWxpemVBdHRycyBpcyBjYWxsZWQgd2l0aCBhIHNldCBvZiBjbGFzcyBwcm9wZXJ0eSBuYW1lcyAoaWYgb21pdHRlZCwgaXRcbiAqIHdpbGwgbG9vayBmb3IgYW55IHByb3BlcnRpZXMgdGFnZ2VkIHdpdGggdGhlIGBAYXR0cmAgZGVjb3JhdG9yKS4gV2l0aCB0aGlzXG4gKiBsaXN0IGl0IGRlZmluZXMgcHJvcGVydHkgZGVzY3JpcHRvcnMgZm9yIGVhY2ggcHJvcGVydHkgdGhhdCBtYXAgdG8gYGRhdGEtKmBcbiAqIGF0dHJpYnV0ZXMgb24gdGhlIEhUTUxFbGVtZW50IGluc3RhbmNlLlxuICpcbiAqIEl0IHdvcmtzIGFyb3VuZCBOYXRpdmUgQ2xhc3MgUHJvcGVydHkgc2VtYW50aWNzIC0gd2hpY2ggYXJlIGVxdWl2YWxlbnQgdG9cbiAqIGNhbGxpbmcgYE9iamVjdC5kZWZpbmVQcm9wZXJ0eWAgb24gdGhlIGluc3RhbmNlIHVwb24gY3JlYXRpb24sIGJ1dCBiZWZvcmVcbiAqIGBjb25zdHJ1Y3RvcigpYCBpcyBjYWxsZWQuXG4gKlxuICogSWYgYSBjbGFzcyBwcm9wZXJ0eSBpcyBhc3NpZ25lZCB0byB0aGUgY2xhc3MgYm9keSwgaXQgd2lsbCBpbmZlciB0aGUgdHlwZVxuICogKHVzaW5nIGB0eXBlb2ZgKSBhbmQgZGVmaW5lIGFuIGFwcHJvcHJpYXRlIGdldHRlci9zZXR0ZXIgY29tYm8gdGhhdCBhbGlnbnNcbiAqIHRvIHRoYXQgdHlwZS4gVGhpcyBtZWFucyBjbGFzcyBwcm9wZXJ0aWVzIGFzc2lnbmVkIHRvIE51bWJlcnMgY2FuIG9ubHkgZXZlclxuICogYmUgTnVtYmVycywgYXNzaWduZWQgdG8gQm9vbGVhbnMgY2FuIG9ubHkgZXZlciBiZSBCb29sZWFucywgYW5kIGFzc2lnbmVkIHRvXG4gKiBTdHJpbmdzIGNhbiBvbmx5IGV2ZXIgYmUgU3RyaW5ncy5cbiAqXG4gKiBUaGlzIGlzIGF1dG9tYXRpY2FsbHkgY2FsbGVkIGFzIHBhcnQgb2YgYEBjb250cm9sbGVyYC4gSWYgYSBjbGFzcyB1c2VzIHRoZVxuICogYEBjb250cm9sbGVyYCBkZWNvcmF0b3IgaXQgc2hvdWxkIG5vdCBjYWxsIHRoaXMgbWFudWFsbHkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbml0aWFsaXplQXR0cnMoaW5zdGFuY2UsIG5hbWVzKSB7XG4gICAgaWYgKCFuYW1lcylcbiAgICAgICAgbmFtZXMgPSBhdHRycy5nZXQoT2JqZWN0LmdldFByb3RvdHlwZU9mKGluc3RhbmNlKSkgfHwgW107XG4gICAgZm9yIChjb25zdCBrZXkgb2YgbmFtZXMpIHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBpbnN0YW5jZVtrZXldO1xuICAgICAgICBjb25zdCBuYW1lID0gYXR0clRvQXR0cmlidXRlTmFtZShrZXkpO1xuICAgICAgICBsZXQgZGVzY3JpcHRvciA9IHtcbiAgICAgICAgICAgIGdldCgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRBdHRyaWJ1dGUobmFtZSkgfHwgJyc7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2V0KG5ld1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUobmFtZSwgbmV3VmFsdWUgfHwgJycpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgZGVzY3JpcHRvciA9IHtcbiAgICAgICAgICAgICAgICBnZXQoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBOdW1iZXIodGhpcy5nZXRBdHRyaWJ1dGUobmFtZSkgfHwgMCk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBzZXQobmV3VmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUobmFtZSwgbmV3VmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodHlwZW9mIHZhbHVlID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICAgIGRlc2NyaXB0b3IgPSB7XG4gICAgICAgICAgICAgICAgZ2V0KCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5oYXNBdHRyaWJ1dGUobmFtZSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBzZXQobmV3VmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50b2dnbGVBdHRyaWJ1dGUobmFtZSwgbmV3VmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGluc3RhbmNlLCBrZXksIGRlc2NyaXB0b3IpO1xuICAgICAgICBpZiAoa2V5IGluIGluc3RhbmNlICYmICFpbnN0YW5jZS5oYXNBdHRyaWJ1dGUobmFtZSkpIHtcbiAgICAgICAgICAgIGRlc2NyaXB0b3Iuc2V0LmNhbGwoaW5zdGFuY2UsIHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIGF0dHJUb0F0dHJpYnV0ZU5hbWUobmFtZSkge1xuICAgIHJldHVybiBgZGF0YS0ke25hbWUucmVwbGFjZSgvKFtBLVpdKCR8W2Etel0pKS9nLCAnLSQxJyl9YC5yZXBsYWNlKC8tLS9nLCAnLScpLnRvTG93ZXJDYXNlKCk7XG59XG5leHBvcnQgZnVuY3Rpb24gZGVmaW5lT2JzZXJ2ZWRBdHRyaWJ1dGVzKGNsYXNzT2JqZWN0KSB7XG4gICAgbGV0IG9ic2VydmVkID0gY2xhc3NPYmplY3Qub2JzZXJ2ZWRBdHRyaWJ1dGVzIHx8IFtdO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjbGFzc09iamVjdCwgJ29ic2VydmVkQXR0cmlidXRlcycsIHtcbiAgICAgICAgZ2V0KCkge1xuICAgICAgICAgICAgY29uc3QgYXR0ck1hcCA9IGF0dHJzLmdldChjbGFzc09iamVjdC5wcm90b3R5cGUpO1xuICAgICAgICAgICAgaWYgKCFhdHRyTWFwKVxuICAgICAgICAgICAgICAgIHJldHVybiBvYnNlcnZlZDtcbiAgICAgICAgICAgIHJldHVybiBhdHRyTWFwLm1hcChhdHRyVG9BdHRyaWJ1dGVOYW1lKS5jb25jYXQob2JzZXJ2ZWQpO1xuICAgICAgICB9LFxuICAgICAgICBzZXQoYXR0cmlidXRlcykge1xuICAgICAgICAgICAgb2JzZXJ2ZWQgPSBhdHRyaWJ1dGVzO1xuICAgICAgICB9XG4gICAgfSk7XG59XG4vLyMgc291cmNlTWFwcGluZ1VSTD1hdHRyLmpzLm1hcCIsImV4cG9ydCBmdW5jdGlvbiBhdXRvU2hhZG93Um9vdChlbGVtZW50KSB7XG4gICAgZm9yIChjb25zdCB0ZW1wbGF0ZSBvZiBlbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ3RlbXBsYXRlW2RhdGEtc2hhZG93cm9vdF0nKSkge1xuICAgICAgICBpZiAodGVtcGxhdGUucGFyZW50RWxlbWVudCA9PT0gZWxlbWVudCkge1xuICAgICAgICAgICAgZWxlbWVudFxuICAgICAgICAgICAgICAgIC5hdHRhY2hTaGFkb3coe1xuICAgICAgICAgICAgICAgIG1vZGU6IHRlbXBsYXRlLmdldEF0dHJpYnV0ZSgnZGF0YS1zaGFkb3dyb290JykgPT09ICdjbG9zZWQnID8gJ2Nsb3NlZCcgOiAnb3BlbidcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmFwcGVuZCh0ZW1wbGF0ZS5jb250ZW50LmNsb25lTm9kZSh0cnVlKSk7XG4gICAgICAgIH1cbiAgICB9XG59XG4vLyMgc291cmNlTWFwcGluZ1VSTD1hdXRvLXNoYWRvdy1yb290LmpzLm1hcCIsImNvbnN0IGNvbnRyb2xsZXJzID0gbmV3IFdlYWtTZXQoKTtcbi8qXG4gKiBCaW5kIGBbZGF0YS1hY3Rpb25dYCBlbGVtZW50cyBmcm9tIHRoZSBET00gdG8gdGhlaXIgYWN0aW9ucy5cbiAqXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiaW5kKGNvbnRyb2xsZXIpIHtcbiAgICBjb250cm9sbGVycy5hZGQoY29udHJvbGxlcik7XG4gICAgaWYgKGNvbnRyb2xsZXIuc2hhZG93Um9vdCkge1xuICAgICAgICBiaW5kRWxlbWVudHMoY29udHJvbGxlci5zaGFkb3dSb290KTtcbiAgICAgICAgbGlzdGVuRm9yQmluZChjb250cm9sbGVyLnNoYWRvd1Jvb3QpO1xuICAgIH1cbiAgICBiaW5kRWxlbWVudHMoY29udHJvbGxlcik7XG4gICAgbGlzdGVuRm9yQmluZChjb250cm9sbGVyLm93bmVyRG9jdW1lbnQpO1xufVxuY29uc3Qgb2JzZXJ2ZXJzID0gbmV3IFdlYWtNYXAoKTtcbi8qKlxuICogU2V0IHVwIG9ic2VydmVyIHRoYXQgd2lsbCBtYWtlIHN1cmUgYW55IGFjdGlvbnMgdGhhdCBhcmUgZHluYW1pY2FsbHlcbiAqIGluamVjdGVkIGludG8gYGVsYCB3aWxsIGJlIGJvdW5kIHRvIGl0J3MgY29udHJvbGxlci5cbiAqXG4gKiBUaGlzIHJldHVybnMgYSBTdWJzY3JpcHRpb24gb2JqZWN0IHdoaWNoIHlvdSBjYW4gY2FsbCBgdW5zdWJzY3JpYmUoKWAgb24gdG9cbiAqIHN0b3AgZnVydGhlciBsaXZlIHVwZGF0ZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsaXN0ZW5Gb3JCaW5kKGVsID0gZG9jdW1lbnQpIHtcbiAgICBpZiAob2JzZXJ2ZXJzLmhhcyhlbCkpXG4gICAgICAgIHJldHVybiBvYnNlcnZlcnMuZ2V0KGVsKTtcbiAgICBsZXQgY2xvc2VkID0gZmFsc2U7XG4gICAgY29uc3Qgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihtdXRhdGlvbnMgPT4ge1xuICAgICAgICBmb3IgKGNvbnN0IG11dGF0aW9uIG9mIG11dGF0aW9ucykge1xuICAgICAgICAgICAgaWYgKG11dGF0aW9uLnR5cGUgPT09ICdhdHRyaWJ1dGVzJyAmJiBtdXRhdGlvbi50YXJnZXQgaW5zdGFuY2VvZiBFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgYmluZEFjdGlvbnMobXV0YXRpb24udGFyZ2V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKG11dGF0aW9uLnR5cGUgPT09ICdjaGlsZExpc3QnICYmIG11dGF0aW9uLmFkZGVkTm9kZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBub2RlIG9mIG11dGF0aW9uLmFkZGVkTm9kZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGUgaW5zdGFuY2VvZiBFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBiaW5kRWxlbWVudHMobm9kZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBvYnNlcnZlci5vYnNlcnZlKGVsLCB7IGNoaWxkTGlzdDogdHJ1ZSwgc3VidHJlZTogdHJ1ZSwgYXR0cmlidXRlRmlsdGVyOiBbJ2RhdGEtYWN0aW9uJ10gfSk7XG4gICAgY29uc3Qgc3Vic2NyaXB0aW9uID0ge1xuICAgICAgICBnZXQgY2xvc2VkKCkge1xuICAgICAgICAgICAgcmV0dXJuIGNsb3NlZDtcbiAgICAgICAgfSxcbiAgICAgICAgdW5zdWJzY3JpYmUoKSB7XG4gICAgICAgICAgICBjbG9zZWQgPSB0cnVlO1xuICAgICAgICAgICAgb2JzZXJ2ZXJzLmRlbGV0ZShlbCk7XG4gICAgICAgICAgICBvYnNlcnZlci5kaXNjb25uZWN0KCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIG9ic2VydmVycy5zZXQoZWwsIHN1YnNjcmlwdGlvbik7XG4gICAgcmV0dXJuIHN1YnNjcmlwdGlvbjtcbn1cbmZ1bmN0aW9uIGJpbmRFbGVtZW50cyhyb290KSB7XG4gICAgZm9yIChjb25zdCBlbCBvZiByb290LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLWFjdGlvbl0nKSkge1xuICAgICAgICBiaW5kQWN0aW9ucyhlbCk7XG4gICAgfVxuICAgIC8vIEFsc28gYmluZCB0aGUgY29udHJvbGxlciB0byBpdHNlbGZcbiAgICBpZiAocm9vdCBpbnN0YW5jZW9mIEVsZW1lbnQgJiYgcm9vdC5oYXNBdHRyaWJ1dGUoJ2RhdGEtYWN0aW9uJykpIHtcbiAgICAgICAgYmluZEFjdGlvbnMocm9vdCk7XG4gICAgfVxufVxuLy8gQmluZCBhIHNpbmdsZSBmdW5jdGlvbiB0byBhbGwgZXZlbnRzIHRvIGF2b2lkIGFub255bW91cyBjbG9zdXJlIHBlcmZvcm1hbmNlIHBlbmFsdHkuXG5mdW5jdGlvbiBoYW5kbGVFdmVudChldmVudCkge1xuICAgIGNvbnN0IGVsID0gZXZlbnQuY3VycmVudFRhcmdldDtcbiAgICBmb3IgKGNvbnN0IGJpbmRpbmcgb2YgYmluZGluZ3MoZWwpKSB7XG4gICAgICAgIGlmIChldmVudC50eXBlID09PSBiaW5kaW5nLnR5cGUpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbnRyb2xsZXIgPSBlbC5jbG9zZXN0KGJpbmRpbmcudGFnKTtcbiAgICAgICAgICAgIGlmIChjb250cm9sbGVycy5oYXMoY29udHJvbGxlcikgJiYgdHlwZW9mIGNvbnRyb2xsZXJbYmluZGluZy5tZXRob2RdID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgY29udHJvbGxlcltiaW5kaW5nLm1ldGhvZF0oZXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3Qgcm9vdCA9IGVsLmdldFJvb3ROb2RlKCk7XG4gICAgICAgICAgICBpZiAocm9vdCBpbnN0YW5jZW9mIFNoYWRvd1Jvb3QgJiYgY29udHJvbGxlcnMuaGFzKHJvb3QuaG9zdCkgJiYgcm9vdC5ob3N0Lm1hdGNoZXMoYmluZGluZy50YWcpKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2hhZG93Q29udHJvbGxlciA9IHJvb3QuaG9zdDtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHNoYWRvd0NvbnRyb2xsZXJbYmluZGluZy5tZXRob2RdID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIHNoYWRvd0NvbnRyb2xsZXJbYmluZGluZy5tZXRob2RdKGV2ZW50KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5mdW5jdGlvbiogYmluZGluZ3MoZWwpIHtcbiAgICBmb3IgKGNvbnN0IGFjdGlvbiBvZiAoZWwuZ2V0QXR0cmlidXRlKCdkYXRhLWFjdGlvbicpIHx8ICcnKS50cmltKCkuc3BsaXQoL1xccysvKSkge1xuICAgICAgICBjb25zdCBldmVudFNlcCA9IGFjdGlvbi5sYXN0SW5kZXhPZignOicpO1xuICAgICAgICBjb25zdCBtZXRob2RTZXAgPSBhY3Rpb24ubGFzdEluZGV4T2YoJyMnKTtcbiAgICAgICAgeWllbGQge1xuICAgICAgICAgICAgdHlwZTogYWN0aW9uLnNsaWNlKDAsIGV2ZW50U2VwKSxcbiAgICAgICAgICAgIHRhZzogYWN0aW9uLnNsaWNlKGV2ZW50U2VwICsgMSwgbWV0aG9kU2VwKSxcbiAgICAgICAgICAgIG1ldGhvZDogYWN0aW9uLnNsaWNlKG1ldGhvZFNlcCArIDEpXG4gICAgICAgIH07XG4gICAgfVxufVxuZnVuY3Rpb24gYmluZEFjdGlvbnMoZWwpIHtcbiAgICBmb3IgKGNvbnN0IGJpbmRpbmcgb2YgYmluZGluZ3MoZWwpKSB7XG4gICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoYmluZGluZy50eXBlLCBoYW5kbGVFdmVudCk7XG4gICAgfVxufVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YmluZC5qcy5tYXAiLCJpbXBvcnQgeyByZWdpc3RlciB9IGZyb20gJy4vcmVnaXN0ZXInO1xuaW1wb3J0IHsgYmluZCB9IGZyb20gJy4vYmluZCc7XG5pbXBvcnQgeyBhdXRvU2hhZG93Um9vdCB9IGZyb20gJy4vYXV0by1zaGFkb3ctcm9vdCc7XG5pbXBvcnQgeyBkZWZpbmVPYnNlcnZlZEF0dHJpYnV0ZXMsIGluaXRpYWxpemVBdHRycyB9IGZyb20gJy4vYXR0cic7XG4vKipcbiAqIENvbnRyb2xsZXIgaXMgYSBkZWNvcmF0b3IgdG8gYmUgdXNlZCBvdmVyIGEgY2xhc3MgdGhhdCBleHRlbmRzIEhUTUxFbGVtZW50LlxuICogSXQgd2lsbCBhdXRvbWF0aWNhbGx5IGByZWdpc3RlcigpYCB0aGUgY29tcG9uZW50IGluIHRoZSBjdXN0b21FbGVtZW50XG4gKiByZWdpc3RyeSwgYXMgd2VsbCBhcyBlbnN1cmluZyBgYmluZCh0aGlzKWAgaXMgY2FsbGVkIG9uIGBjb25uZWN0ZWRDYWxsYmFja2AsXG4gKiB3cmFwcGluZyB0aGUgY2xhc3NlcyBgY29ubmVjdGVkQ2FsbGJhY2tgIG1ldGhvZCBpZiBuZWVkZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb250cm9sbGVyKGNsYXNzT2JqZWN0KSB7XG4gICAgY29uc3QgY29ubmVjdCA9IGNsYXNzT2JqZWN0LnByb3RvdHlwZS5jb25uZWN0ZWRDYWxsYmFjaztcbiAgICBjbGFzc09iamVjdC5wcm90b3R5cGUuY29ubmVjdGVkQ2FsbGJhY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMudG9nZ2xlQXR0cmlidXRlKCdkYXRhLWNhdGFseXN0JywgdHJ1ZSk7XG4gICAgICAgIGF1dG9TaGFkb3dSb290KHRoaXMpO1xuICAgICAgICBpbml0aWFsaXplQXR0cnModGhpcyk7XG4gICAgICAgIGlmIChjb25uZWN0KVxuICAgICAgICAgICAgY29ubmVjdC5jYWxsKHRoaXMpO1xuICAgICAgICBiaW5kKHRoaXMpO1xuICAgIH07XG4gICAgZGVmaW5lT2JzZXJ2ZWRBdHRyaWJ1dGVzKGNsYXNzT2JqZWN0KTtcbiAgICByZWdpc3RlcihjbGFzc09iamVjdCk7XG59XG4vLyMgc291cmNlTWFwcGluZ1VSTD1jb250cm9sbGVyLmpzLm1hcCIsIi8qKlxuICogZmluZFRhcmdldCB3aWxsIHJ1biBgcXVlcnlTZWxlY3RvckFsbGAgYWdhaW5zdCB0aGUgZ2l2ZW4gY29udHJvbGxlciwgcGx1c1xuICogaXRzIHNoYWRvd1Jvb3QsIHJldHVybmluZyBhbnkgdGhlIGZpcnN0IGNoaWxkIHRoYXQ6XG4gKlxuICogIC0gTWF0Y2hlcyB0aGUgc2VsZWN0b3Igb2YgYFtkYXRhLXRhcmdldH49XCJ0YWcubmFtZVwiXWAgd2hlcmUgdGFnIGlzIHRoZVxuICogIHRhZ05hbWUgb2YgdGhlIGdpdmVuIEhUTUxFbGVtZW50LCBhbmQgYG5hbWVgIGlzIHRoZSBnaXZlbiBgbmFtZWAgYXJndW1lbnQuXG4gKlxuICogIC0gQ2xvc2VzdCBhc2NlbmRhbnQgb2YgdGhlIGVsZW1lbnQsIHRoYXQgbWF0Y2hlcyB0aGUgdGFnbmFtZSBvZiB0aGVcbiAqICBjb250cm9sbGVyLCBpcyB0aGUgc3BlY2lmaWMgaW5zdGFuY2Ugb2YgdGhlIGNvbnRyb2xsZXIgaXRzZWxmIC0gaW4gb3RoZXJcbiAqICB3b3JkcyBpdCBpcyBub3QgbmVzdGVkIGluIG90aGVyIGNvbnRyb2xsZXJzIG9mIHRoZSBzYW1lIHR5cGUuXG4gKlxuICovXG5leHBvcnQgZnVuY3Rpb24gZmluZFRhcmdldChjb250cm9sbGVyLCBuYW1lKSB7XG4gICAgY29uc3QgdGFnID0gY29udHJvbGxlci50YWdOYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgaWYgKGNvbnRyb2xsZXIuc2hhZG93Um9vdCkge1xuICAgICAgICBmb3IgKGNvbnN0IGVsIG9mIGNvbnRyb2xsZXIuc2hhZG93Um9vdC5xdWVyeVNlbGVjdG9yQWxsKGBbZGF0YS10YXJnZXR+PVwiJHt0YWd9LiR7bmFtZX1cIl1gKSkge1xuICAgICAgICAgICAgaWYgKCFlbC5jbG9zZXN0KHRhZykpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZvciAoY29uc3QgZWwgb2YgY29udHJvbGxlci5xdWVyeVNlbGVjdG9yQWxsKGBbZGF0YS10YXJnZXR+PVwiJHt0YWd9LiR7bmFtZX1cIl1gKSkge1xuICAgICAgICBpZiAoZWwuY2xvc2VzdCh0YWcpID09PSBjb250cm9sbGVyKVxuICAgICAgICAgICAgcmV0dXJuIGVsO1xuICAgIH1cbn1cbmV4cG9ydCBmdW5jdGlvbiBmaW5kVGFyZ2V0cyhjb250cm9sbGVyLCBuYW1lKSB7XG4gICAgY29uc3QgdGFnID0gY29udHJvbGxlci50YWdOYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgY29uc3QgdGFyZ2V0cyA9IFtdO1xuICAgIGlmIChjb250cm9sbGVyLnNoYWRvd1Jvb3QpIHtcbiAgICAgICAgZm9yIChjb25zdCBlbCBvZiBjb250cm9sbGVyLnNoYWRvd1Jvb3QucXVlcnlTZWxlY3RvckFsbChgW2RhdGEtdGFyZ2V0c349XCIke3RhZ30uJHtuYW1lfVwiXWApKSB7XG4gICAgICAgICAgICBpZiAoIWVsLmNsb3Nlc3QodGFnKSlcbiAgICAgICAgICAgICAgICB0YXJnZXRzLnB1c2goZWwpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZvciAoY29uc3QgZWwgb2YgY29udHJvbGxlci5xdWVyeVNlbGVjdG9yQWxsKGBbZGF0YS10YXJnZXRzfj1cIiR7dGFnfS4ke25hbWV9XCJdYCkpIHtcbiAgICAgICAgaWYgKGVsLmNsb3Nlc3QodGFnKSA9PT0gY29udHJvbGxlcilcbiAgICAgICAgICAgIHRhcmdldHMucHVzaChlbCk7XG4gICAgfVxuICAgIHJldHVybiB0YXJnZXRzO1xufVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZmluZHRhcmdldC5qcy5tYXAiLCJleHBvcnQgeyBiaW5kLCBsaXN0ZW5Gb3JCaW5kIH0gZnJvbSAnLi9iaW5kJztcbmV4cG9ydCB7IHJlZ2lzdGVyIH0gZnJvbSAnLi9yZWdpc3Rlcic7XG5leHBvcnQgeyBmaW5kVGFyZ2V0LCBmaW5kVGFyZ2V0cyB9IGZyb20gJy4vZmluZHRhcmdldCc7XG5leHBvcnQgeyB0YXJnZXQsIHRhcmdldHMgfSBmcm9tICcuL3RhcmdldCc7XG5leHBvcnQgeyBjb250cm9sbGVyIH0gZnJvbSAnLi9jb250cm9sbGVyJztcbmV4cG9ydCB7IGF0dHIgfSBmcm9tICcuL2F0dHInO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIiwiLyoqXG4gKiBSZWdpc3RlciB0aGUgY29udHJvbGxlciBhcyBhIGN1c3RvbSBlbGVtZW50LlxuICpcbiAqIFRoZSBjbGFzc25hbWUgaXMgY29udmVydGVkIHRvIGEgYXBwcm9yaWF0ZSB0YWcgbmFtZS5cbiAqXG4gKiBFeGFtcGxlOiBIZWxsb0NvbnRyb2xsZXIgPT4gaGVsbG8tY29udHJvbGxlclxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXIoY2xhc3NPYmplY3QpIHtcbiAgICBjb25zdCBuYW1lID0gY2xhc3NPYmplY3QubmFtZVxuICAgICAgICAucmVwbGFjZSgvKFtBLVpdKCR8W2Etel0pKS9nLCAnLSQxJylcbiAgICAgICAgLnJlcGxhY2UoLyheLXwtRWxlbWVudCQpL2csICcnKVxuICAgICAgICAudG9Mb3dlckNhc2UoKTtcbiAgICBpZiAoIXdpbmRvdy5jdXN0b21FbGVtZW50cy5nZXQobmFtZSkpIHtcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9iYW4tdHMtY29tbWVudFxuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIHdpbmRvd1tjbGFzc09iamVjdC5uYW1lXSA9IGNsYXNzT2JqZWN0O1xuICAgICAgICB3aW5kb3cuY3VzdG9tRWxlbWVudHMuZGVmaW5lKG5hbWUsIGNsYXNzT2JqZWN0KTtcbiAgICB9XG59XG4vLyMgc291cmNlTWFwcGluZ1VSTD1yZWdpc3Rlci5qcy5tYXAiLCJpbXBvcnQgeyBmaW5kVGFyZ2V0LCBmaW5kVGFyZ2V0cyB9IGZyb20gJy4vZmluZHRhcmdldCc7XG4vKipcbiAqIFRhcmdldCBpcyBhIGRlY29yYXRvciB3aGljaCAtIHdoZW4gYXNzaWduZWQgdG8gYSBwcm9wZXJ0eSBmaWVsZCBvbiB0aGVcbiAqIGNsYXNzIC0gd2lsbCBvdmVycmlkZSB0aGF0IGNsYXNzIGZpZWxkLCB0dXJuaW5nIGl0IGludG8gYSBHZXR0ZXIgd2hpY2hcbiAqIHJldHVybnMgYSBjYWxsIHRvIGBmaW5kVGFyZ2V0KHRoaXMsIGtleSlgIHdoZXJlIGBrZXlgIGlzIHRoZSBuYW1lIG9mIHRoZVxuICogcHJvcGVydHkgZmllbGQuIEluIG90aGVyIHdvcmRzLCBgQHRhcmdldCBmb29gIGJlY29tZXMgYSBnZXR0ZXIgZm9yXG4gKiBgZmluZFRhcmdldCh0aGlzLCAnZm9vJylgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdGFyZ2V0KHByb3RvLCBrZXkpIHtcbiAgICByZXR1cm4gT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvLCBrZXksIHtcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICBnZXQoKSB7XG4gICAgICAgICAgICByZXR1cm4gZmluZFRhcmdldCh0aGlzLCBrZXkpO1xuICAgICAgICB9XG4gICAgfSk7XG59XG4vKipcbiAqIFRhcmdldHMgaXMgYSBkZWNvcmF0b3Igd2hpY2ggLSB3aGVuIGFzc2lnbmVkIHRvIGEgcHJvcGVydHkgZmllbGQgb24gdGhlXG4gKiBjbGFzcyAtIHdpbGwgb3ZlcnJpZGUgdGhhdCBjbGFzcyBmaWVsZCwgdHVybmluZyBpdCBpbnRvIGEgR2V0dGVyIHdoaWNoXG4gKiByZXR1cm5zIGEgY2FsbCB0byBgZmluZFRhcmdldHModGhpcywga2V5KWAgd2hlcmUgYGtleWAgaXMgdGhlIG5hbWUgb2YgdGhlXG4gKiBwcm9wZXJ0eSBmaWVsZC4gSW4gb3RoZXIgd29yZHMsIGBAdGFyZ2V0cyBmb29gIGJlY29tZXMgYSBnZXR0ZXIgZm9yXG4gKiBgZmluZFRhcmdldHModGhpcywgJ2ZvbycpYC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRhcmdldHMocHJvdG8sIGtleSkge1xuICAgIHJldHVybiBPYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG8sIGtleSwge1xuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIGdldCgpIHtcbiAgICAgICAgICAgIHJldHVybiBmaW5kVGFyZ2V0cyh0aGlzLCBrZXkpO1xuICAgICAgICB9XG4gICAgfSk7XG59XG4vLyMgc291cmNlTWFwcGluZ1VSTD10YXJnZXQuanMubWFwIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0aWYoX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSkge1xuXHRcdHJldHVybiBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwidmFyIF9fZGVjb3JhdGUgPSAodGhpcyAmJiB0aGlzLl9fZGVjb3JhdGUpIHx8IGZ1bmN0aW9uIChkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xyXG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcclxuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5kZWNvcmF0ZSA9PT0gXCJmdW5jdGlvblwiKSByID0gUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYyk7XHJcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xyXG4gICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcclxufTtcclxuaW1wb3J0IHsgY29udHJvbGxlciwgdGFyZ2V0IH0gZnJvbSBcIkBnaXRodWIvY2F0YWx5c3RcIjtcclxubGV0IEhlbGxvV29ybGRFbGVtZW50ID0gY2xhc3MgSGVsbG9Xb3JsZEVsZW1lbnQgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XHJcbiAgICBncmVldCgpIHtcclxuICAgICAgICB0aGlzLm91dHB1dC50ZXh0Q29udGVudCA9IGBIZWxsbywgJHt0aGlzLm5hbWUudmFsdWV9IWA7XHJcbiAgICB9XHJcbn07XHJcbl9fZGVjb3JhdGUoW1xyXG4gICAgdGFyZ2V0XHJcbl0sIEhlbGxvV29ybGRFbGVtZW50LnByb3RvdHlwZSwgXCJuYW1lXCIsIHZvaWQgMCk7XHJcbl9fZGVjb3JhdGUoW1xyXG4gICAgdGFyZ2V0XHJcbl0sIEhlbGxvV29ybGRFbGVtZW50LnByb3RvdHlwZSwgXCJvdXRwdXRcIiwgdm9pZCAwKTtcclxuSGVsbG9Xb3JsZEVsZW1lbnQgPSBfX2RlY29yYXRlKFtcclxuICAgIGNvbnRyb2xsZXJcclxuXSwgSGVsbG9Xb3JsZEVsZW1lbnQpO1xyXG4iXSwic291cmNlUm9vdCI6IiJ9

(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.43.1' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\Saymyname.svelte generated by Svelte v3.43.1 */

    const file$4 = "src\\Saymyname.svelte";

    function create_fragment$4(ctx) {
    	let h2;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "Say my name!!!";
    			attr_dev(h2, "class", "svelte-pphz5e");
    			add_location(h2, file$4, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Saymyname', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Saymyname> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Saymyname extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Saymyname",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\Progressbar.svelte generated by Svelte v3.43.1 */

    const file$3 = "src\\Progressbar.svelte";

    function create_fragment$3(ctx) {
    	let div1;
    	let div0;
    	let span;
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			span = element("span");
    			t0 = text(/*prog*/ ctx[0]);
    			t1 = text("%");
    			attr_dev(span, "class", "svelte-jioacb");
    			add_location(span, file$3, 6, 4, 134);
    			attr_dev(div0, "class", "progress svelte-jioacb");
    			set_style(div0, "width", /*prog*/ ctx[0] + "%");
    			add_location(div0, file$3, 5, 2, 84);
    			attr_dev(div1, "class", "progress-container svelte-jioacb");
    			add_location(div1, file$3, 4, 0, 48);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, span);
    			append_dev(span, t0);
    			append_dev(span, t1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*prog*/ 1) set_data_dev(t0, /*prog*/ ctx[0]);

    			if (dirty & /*prog*/ 1) {
    				set_style(div0, "width", /*prog*/ ctx[0] + "%");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Progressbar', slots, []);
    	let { prog = 30 } = $$props;
    	const writable_props = ['prog'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Progressbar> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('prog' in $$props) $$invalidate(0, prog = $$props.prog);
    	};

    	$$self.$capture_state = () => ({ prog });

    	$$self.$inject_state = $$props => {
    		if ('prog' in $$props) $$invalidate(0, prog = $$props.prog);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [prog];
    }

    class Progressbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { prog: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Progressbar",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get prog() {
    		throw new Error("<Progressbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prog(value) {
    		throw new Error("<Progressbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Timer.svelte generated by Svelte v3.43.1 */

    const { console: console_1$1 } = globals;
    const file$2 = "src\\Timer.svelte";

    function create_fragment$2(ctx) {
    	let h3;
    	let t0;
    	let t1;
    	let t2;
    	let progressbar;
    	let t3;
    	let form;
    	let input_1;
    	let t4;
    	let button;
    	let current;
    	let mounted;
    	let dispose;

    	progressbar = new Progressbar({
    			props: { prog: /*prog*/ ctx[2] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			t0 = text("time left: ");
    			t1 = text(/*secondsLeft*/ ctx[0]);
    			t2 = space();
    			create_component(progressbar.$$.fragment);
    			t3 = space();
    			form = element("form");
    			input_1 = element("input");
    			t4 = space();
    			button = element("button");
    			button.textContent = "ENTER";
    			attr_dev(h3, "class", "svelte-68tbmz");
    			add_location(h3, file$2, 33, 0, 731);
    			attr_dev(input_1, "type", "text");
    			attr_dev(input_1, "class", "svelte-68tbmz");
    			add_location(input_1, file$2, 36, 2, 835);
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "svelte-68tbmz");
    			add_location(button, file$2, 37, 2, 879);
    			attr_dev(form, "class", "svelte-68tbmz");
    			add_location(form, file$2, 35, 0, 790);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			append_dev(h3, t0);
    			append_dev(h3, t1);
    			insert_dev(target, t2, anchor);
    			mount_component(progressbar, target, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, form, anchor);
    			append_dev(form, input_1);
    			set_input_value(input_1, /*input*/ ctx[1]);
    			append_dev(form, t4);
    			append_dev(form, button);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input_1, "input", /*input_1_input_handler*/ ctx[4]),
    					listen_dev(form, "submit", /*submit_handler*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*secondsLeft*/ 1) set_data_dev(t1, /*secondsLeft*/ ctx[0]);
    			const progressbar_changes = {};
    			if (dirty & /*prog*/ 4) progressbar_changes.prog = /*prog*/ ctx[2];
    			progressbar.$set(progressbar_changes);

    			if (dirty & /*input*/ 2 && input_1.value !== /*input*/ ctx[1]) {
    				set_input_value(input_1, /*input*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(progressbar.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(progressbar.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t2);
    			destroy_component(progressbar, detaching);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(form);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const totalSec = 10;

    function instance$2($$self, $$props, $$invalidate) {
    	let prog;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Timer', slots, []);
    	let input;
    	const dispatch = createEventDispatcher();
    	let secondsLeft = totalSec;

    	let timer = setInterval(
    		() => {
    			$$invalidate(0, secondsLeft--, secondsLeft);

    			if (secondsLeft == 0) {
    				clearInterval(timer);
    			}
    		},
    		1000
    	);

    	const eventHandler = e => {
    		e.preventDefault();

    		if (input.toUpperCase() == "HEISENBERG") {
    			console.log("true");
    			dispatch("end", "true");
    		} else {
    			console.log("f");
    			dispatch("end", "false");
    		}

    		clearInterval(timer);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<Timer> was created with unknown prop '${key}'`);
    	});

    	function input_1_input_handler() {
    		input = this.value;
    		$$invalidate(1, input);
    	}

    	const submit_handler = e => eventHandler(e);

    	$$self.$capture_state = () => ({
    		Progressbar,
    		createEventDispatcher,
    		input,
    		dispatch,
    		totalSec,
    		secondsLeft,
    		timer,
    		eventHandler,
    		prog
    	});

    	$$self.$inject_state = $$props => {
    		if ('input' in $$props) $$invalidate(1, input = $$props.input);
    		if ('secondsLeft' in $$props) $$invalidate(0, secondsLeft = $$props.secondsLeft);
    		if ('timer' in $$props) timer = $$props.timer;
    		if ('prog' in $$props) $$invalidate(2, prog = $$props.prog);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*secondsLeft*/ 1) {
    			$$invalidate(2, prog = (totalSec - secondsLeft) / totalSec * 100);
    		}
    	};

    	return [secondsLeft, input, prog, eventHandler, input_1_input_handler, submit_handler];
    }

    class Timer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Timer",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\Image.svelte generated by Svelte v3.43.1 */

    const file$1 = "src\\Image.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "content\\Walterwhite.jpg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "walter");
    			attr_dev(img, "class", "svelte-en0mpy");
    			add_location(img, file$1, 1, 2, 9);
    			add_location(div, file$1, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Image', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Image> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Image extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Image",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.43.1 */

    const { console: console_1 } = globals;
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let div0;
    	let saymyname;
    	let t0;
    	let timer;
    	let t1;
    	let image;
    	let t2;
    	let div1;
    	let main;
    	let span;
    	let t3;
    	let current;
    	saymyname = new Saymyname({ $$inline: true });
    	timer = new Timer({ $$inline: true });
    	timer.$on("end", /*timerEnds*/ ctx[1]);
    	image = new Image({ $$inline: true });

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			create_component(saymyname.$$.fragment);
    			t0 = space();
    			create_component(timer.$$.fragment);
    			t1 = space();
    			create_component(image.$$.fragment);
    			t2 = space();
    			div1 = element("div");
    			main = element("main");
    			span = element("span");
    			t3 = text(/*result*/ ctx[0]);
    			attr_dev(div0, "class", "svelte-1cc5vz5");
    			add_location(div0, file, 16, 0, 337);
    			add_location(span, file, 24, 8, 482);
    			attr_dev(main, "class", "svelte-1cc5vz5");
    			add_location(main, file, 24, 2, 476);
    			attr_dev(div1, "class", "modal svelte-1cc5vz5");
    			set_style(div1, "display", /*result*/ ctx[0] ? 'flex' : 'none');
    			add_location(div1, file, 23, 0, 411);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			mount_component(saymyname, div0, null);
    			append_dev(div0, t0);
    			mount_component(timer, div0, null);
    			append_dev(div0, t1);
    			mount_component(image, div0, null);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, main);
    			append_dev(main, span);
    			append_dev(span, t3);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*result*/ 1) set_data_dev(t3, /*result*/ ctx[0]);

    			if (!current || dirty & /*result*/ 1) {
    				set_style(div1, "display", /*result*/ ctx[0] ? 'flex' : 'none');
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(saymyname.$$.fragment, local);
    			transition_in(timer.$$.fragment, local);
    			transition_in(image.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(saymyname.$$.fragment, local);
    			transition_out(timer.$$.fragment, local);
    			transition_out(image.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			destroy_component(saymyname);
    			destroy_component(timer);
    			destroy_component(image);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let result;
    	console.log(Timer);

    	const timerEnds = e => {
    		if (e.detail == "true") {
    			$$invalidate(0, result = `you're goddamn right`);
    		} else {
    			$$invalidate(0, result = "you fucking idiot");
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Saymyname,
    		Timer,
    		Image,
    		result,
    		timerEnds
    	});

    	$$self.$inject_state = $$props => {
    		if ('result' in $$props) $$invalidate(0, result = $$props.result);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [result, timerEnds];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
      target: document.body,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map

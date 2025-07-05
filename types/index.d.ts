// types.d.ts - Complete Juris Framework Type Definitions
// Juris Object VDOM IntelliSense Support

// Juris Object VDOM namespace to handle circular references properly
export namespace JurisVDOM {
  // Base element properties that all elements can have
  export interface BaseElementProps {
    // Standard HTML attributes
    id?: string;
    className?: string;
    role?: string;
    tabIndex?: number | (() => number);
    hidden?: boolean | (() => boolean);
    title?: string | (() => string);
    lang?: string;
    dir?: 'ltr' | 'rtl' | 'auto';
    draggable?: boolean;
    contentEditable?: boolean | 'true' | 'false' | 'inherit';
    spellcheck?: boolean;
    translate?: boolean | 'yes' | 'no';
    
    // ARIA attributes
    'aria-label'?: string | (() => string);
    'aria-labelledby'?: string;
    'aria-describedby'?: string;
    'aria-controls'?: string;
    'aria-selected'?: string | boolean | (() => string | boolean);
    'aria-expanded'?: string | boolean | (() => string | boolean);
    'aria-pressed'?: string | boolean | (() => string | boolean);
    'aria-checked'?: string | boolean | (() => string | boolean);
    'aria-disabled'?: string | boolean | (() => string | boolean);
    'aria-hidden'?: string | boolean | (() => string | boolean);
    'aria-live'?: 'off' | 'polite' | 'assertive';
    'aria-orientation'?: 'horizontal' | 'vertical';
    'aria-current'?: string | boolean;
    'aria-haspopup'?: boolean | 'false' | 'true' | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
    'aria-level'?: number;
    'aria-owns'?: string;
    'aria-posinset'?: number;
    'aria-setsize'?: number;
    'aria-sort'?: 'none' | 'ascending' | 'descending' | 'other';
    'aria-valuemax'?: number;
    'aria-valuemin'?: number;
    'aria-valuenow'?: number;
    'aria-valuetext'?: string;
    
    // Data attributes (commonly used)
    'data-testid'?: string;
    'data-id'?: string;
    'data-name'?: string;
    'data-value'?: string;
    
    // Style and classes
    style?: Record<string, string | number> | (() => Record<string, string | number>);
    
    // Global event handlers
    onClick?: () => void;
    onDoubleClick?: () => void;
    onMouseDown?: (e: MouseEvent) => void;
    onMouseUp?: (e: MouseEvent) => void;
    onMouseOver?: (e: MouseEvent) => void;
    onMouseOut?: (e: MouseEvent) => void;
    onMouseMove?: (e: MouseEvent) => void;
    onMouseEnter?: (e: MouseEvent) => void;
    onMouseLeave?: (e: MouseEvent) => void;
    onContextMenu?: (e: MouseEvent) => void;
    
    onKeyDown?: (e: KeyboardEvent) => void;
    onKeyUp?: (e: KeyboardEvent) => void;
    onKeyPress?: (e: KeyboardEvent) => void;
    
    onFocus?: (e: FocusEvent) => void;
    onBlur?: (e: FocusEvent) => void;
    onFocusIn?: (e: FocusEvent) => void;
    onFocusOut?: (e: FocusEvent) => void;
    
    onLoad?: (e: Event) => void;
    onError?: (e: ErrorEvent) => void;
    onResize?: (e: Event) => void;
    onScroll?: (e: Event) => void;
    
    onDragStart?: (e: DragEvent) => void;
    onDrag?: (e: DragEvent) => void;
    onDragEnd?: (e: DragEvent) => void;
    onDragEnter?: (e: DragEvent) => void;
    onDragLeave?: (e: DragEvent) => void;
    onDragOver?: (e: DragEvent) => void;
    onDrop?: (e: DragEvent) => void;
    
    onTouchStart?: (e: TouchEvent) => void;
    onTouchMove?: (e: TouchEvent) => void;
    onTouchEnd?: (e: TouchEvent) => void;
    onTouchCancel?: (e: TouchEvent) => void;
  }

  // Void elements (self-closing)
  export interface VoidElement extends BaseElementProps {
    // These elements cannot have children or text
  }

  // Text-only elements (cannot have children)
  export interface TextElement extends BaseElementProps {
    text: string | (() => string);
  }

  // Container elements (children only, no text)
  export interface ContainerElement extends BaseElementProps {
    innerHTML?: string | (() => string);
    children?: Element[] | (() => Element[]);
  }

  // Elements that can have EITHER text OR children OR innerHTML (mutually exclusive)
  export type ContainerWithTextElement = BaseElementProps & (
    | { text: string | (() => string); children?: never; innerHTML?: never }
    | { children: Element[] | (() => Element[]); text?: never; innerHTML?: never }
    | { innerHTML: string | (() => string); text?: never; children?: never }
  );

  // Button can have either text, children, or innerHTML
  export type ButtonElement = BaseElementProps & {
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean | (() => boolean);
    name?: string;
    value?: string;
    form?: string;
    formAction?: string;
    formEncType?: string;
    formMethod?: 'get' | 'post';
    formNoValidate?: boolean;
    formTarget?: string;
    autofocus?: boolean;
  } & (
    | { text: string | (() => string); children?: never; innerHTML?: never }
    | { children: Element[] | (() => Element[]); text?: never; innerHTML?: never }
    | { innerHTML: string | (() => string); text?: never; children?: never }
  );

  // Label can have either text, children, or innerHTML
  export type LabelElement = BaseElementProps & {
    htmlFor?: string;
    form?: string;
  } & (
    | { text: string | (() => string); children?: never; innerHTML?: never }
    | { children: Element[] | (() => Element[]); text?: never; innerHTML?: never }
    | { innerHTML: string | (() => string); text?: never; children?: never }
  );

  // Form elements
  export interface InputElement extends BaseElementProps {
    type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date' | 'time' | 'datetime-local' | 'month' | 'week' | 'color' | 'file' | 'range' | 'checkbox' | 'radio' | 'submit' | 'reset' | 'button' | 'hidden';
    value?: string | number | boolean | (() => string | number | boolean);
    defaultValue?: string | number;
    placeholder?: string | (() => string);
    required?: boolean | (() => boolean);
    disabled?: boolean | (() => boolean);
    readonly?: boolean | (() => boolean);
    name?: string;
    min?: string | number;
    max?: string | number;
    step?: string | number;
    pattern?: string;
    size?: number;
    maxLength?: number;
    minLength?: number;
    multiple?: boolean;
    accept?: string;
    autocomplete?: string;
    autofocus?: boolean;
    checked?: boolean | (() => boolean);
    form?: string;
    formAction?: string;
    formEncType?: string;
    formMethod?: 'get' | 'post';
    formNoValidate?: boolean;
    formTarget?: string;
    list?: string;
    
    // Input-specific events
    onChange?: (e: Event) => void;
    onInput?: (e: Event) => void;
    onSelect?: (e: Event) => void;
    onInvalid?: (e: Event) => void;
  }

  export interface TextAreaElement extends BaseElementProps {
    value?: string | (() => string);
    defaultValue?: string;
    placeholder?: string | (() => string);
    required?: boolean | (() => boolean);
    disabled?: boolean | (() => boolean);
    readonly?: boolean | (() => boolean);
    name?: string;
    rows?: number;
    cols?: number;
    maxLength?: number;
    minLength?: number;
    wrap?: 'hard' | 'soft' | 'off';
    autofocus?: boolean;
    form?: string;
    
    onChange?: (e: Event) => void;
    onInput?: (e: Event) => void;
    onSelect?: (e: Event) => void;
  }

  export interface SelectElement extends BaseElementProps {
    value?: string | string[] | (() => string | string[]);
    defaultValue?: string | string[];
    required?: boolean | (() => boolean);
    disabled?: boolean | (() => boolean);
    name?: string;
    multiple?: boolean | (() => boolean);
    size?: number;
    autofocus?: boolean;
    form?: string;
    children?: Element[] | (() => Element[]);
    
    onChange?: (e: Event) => void;
  }

  export interface OptionElement extends BaseElementProps {
    value?: string | number;
    text?: string | (() => string);
    selected?: boolean | (() => boolean);
    disabled?: boolean | (() => boolean);
    label?: string;
  }

  export interface ButtonElement extends BaseElementProps {
    text?: string | (() => string);
    children?: Element[] | (() => Element[]);
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean | (() => boolean);
    name?: string;
    value?: string;
    form?: string;
    formAction?: string;
    formEncType?: string;
    formMethod?: 'get' | 'post';
    formNoValidate?: boolean;
    formTarget?: string;
    autofocus?: boolean;
  }

  export interface LabelElement extends BaseElementProps {
    text?: string | (() => string);
    children?: Element[] | (() => Element[]);
    htmlFor?: string;
    form?: string;
  }

  export interface FormElement extends BaseElementProps {
    children?: Element[] | (() => Element[]);
    action?: string | (() => string);
    method?: 'get' | 'post';
    encType?: 'application/x-www-form-urlencoded' | 'multipart/form-data' | 'text/plain';
    target?: '_blank' | '_self' | '_parent' | '_top' | string;
    noValidate?: boolean;
    acceptCharset?: string;
    autocomplete?: 'on' | 'off';
    name?: string;
    
    onSubmit?: (e: Event) => void;
    onReset?: (e: Event) => void;
  }

  export interface FieldSetElement extends BaseElementProps {
    children?: Element[] | (() => Element[]);
    disabled?: boolean | (() => boolean);
    form?: string;
    name?: string;
  }

  // Media elements
  export interface ImageElement extends BaseElementProps {
    src: string | (() => string);
    alt?: string | (() => string);
    width?: number | string;
    height?: number | string;
    loading?: 'lazy' | 'eager';
    decoding?: 'sync' | 'async' | 'auto';
    crossOrigin?: 'anonymous' | 'use-credentials';
    isMap?: boolean;
    useMap?: string;
    sizes?: string;
    srcSet?: string;
    referrerPolicy?: string;
  }

  export interface VideoElement extends BaseElementProps {
    src?: string | (() => string);
    controls?: boolean | (() => boolean);
    autoplay?: boolean | (() => boolean);
    loop?: boolean | (() => boolean);
    muted?: boolean | (() => boolean);
    width?: number | string;
    height?: number | string;
    poster?: string | (() => string);
    preload?: 'none' | 'metadata' | 'auto';
    crossOrigin?: 'anonymous' | 'use-credentials';
    children?: Element[] | (() => Element[]);
    
    onPlay?: (e: Event) => void;
    onPause?: (e: Event) => void;
    onEnded?: (e: Event) => void;
    onTimeUpdate?: (e: Event) => void;
    onVolumeChange?: (e: Event) => void;
    onLoadedData?: (e: Event) => void;
    onLoadedMetadata?: (e: Event) => void;
    onCanPlay?: (e: Event) => void;
    onCanPlayThrough?: (e: Event) => void;
  }

  export interface AudioElement extends BaseElementProps {
    src?: string | (() => string);
    controls?: boolean | (() => boolean);
    autoplay?: boolean | (() => boolean);
    loop?: boolean | (() => boolean);
    muted?: boolean | (() => boolean);
    preload?: 'none' | 'metadata' | 'auto';
    crossOrigin?: 'anonymous' | 'use-credentials';
    children?: Element[] | (() => Element[]);
    
    onPlay?: (e: Event) => void;
    onPause?: (e: Event) => void;
    onEnded?: (e: Event) => void;
    onTimeUpdate?: (e: Event) => void;
    onVolumeChange?: (e: Event) => void;
    onLoadedData?: (e: Event) => void;
    onLoadedMetadata?: (e: Event) => void;
    onCanPlay?: (e: Event) => void;
    onCanPlayThrough?: (e: Event) => void;
  }

  export interface CanvasElement extends BaseElementProps {
    width?: number;
    height?: number;
  }

  export interface IframeElement extends BaseElementProps {
    src?: string | (() => string);
    width?: number | string;
    height?: number | string;
    name?: string;
    sandbox?: string;
    allow?: string;
    allowFullscreen?: boolean;
    loading?: 'lazy' | 'eager';
    referrerPolicy?: string;
    srcdoc?: string;
  }

  // Link and navigation
  export interface LinkElement extends BaseElementProps {
    href: string | (() => string);
    text?: string | (() => string);
    children?: Element[] | (() => Element[]);
    target?: '_blank' | '_self' | '_parent' | '_top' | string;
    rel?: string;
    download?: string | boolean;
    hreflang?: string;
    type?: string;
    referrerPolicy?: string;
  }

  // List elements
  export interface ListElement extends BaseElementProps {
    children?: Element[] | (() => Element[]);
    type?: '1' | 'a' | 'A' | 'i' | 'I'; // For ol
    start?: number; // For ol
    reversed?: boolean; // For ol
  }

  export interface ListItemElement extends BaseElementProps {
    text?: string | (() => string);
    children?: Element[] | (() => Element[]);
    value?: number; // For li in ol
  }

  // Table elements
  export interface TableElement extends BaseElementProps {
    children?: Element[] | (() => Element[]);
  }

  export interface TableRowElement extends BaseElementProps {
    children?: Element[] | (() => Element[]);
  }

  export interface TableCellElement extends BaseElementProps {
    text?: string | (() => string);
    children?: Element[] | (() => Element[]);
    colspan?: number;
    rowspan?: number;
    headers?: string;
    scope?: 'row' | 'col' | 'rowgroup' | 'colgroup';
    abbr?: string;
  }

  export interface TableHeaderElement extends TableCellElement {
    scope?: 'row' | 'col' | 'rowgroup' | 'colgroup';
    abbr?: string;
    sorted?: 'ascending' | 'descending' | 'none' | 'other';
  }

  // Interactive elements
  export interface DetailsElement extends BaseElementProps {
    children?: Element[] | (() => Element[]);
    open?: boolean | (() => boolean);
    
    onToggle?: (e: Event) => void;
  }

  export interface DialogElement extends BaseElementProps {
    children?: Element[] | (() => Element[]);
    open?: boolean | (() => boolean);
    
    onClose?: (e: Event) => void;
    onCancel?: (e: Event) => void;
  }

  // Progress and meter
  export interface ProgressElement extends BaseElementProps {
    value?: number | (() => number);
    max?: number;
  }

  export interface MeterElement extends BaseElementProps {
    value: number | (() => number);
    min?: number;
    max?: number;
    low?: number;
    high?: number;
    optimum?: number;
    form?: string;
  }

  // Time element
  export interface TimeElement extends BaseElementProps {
    text?: string | (() => string);
    children?: Element[] | (() => Element[]);
    dateTime?: string | (() => string);
  }

  // Script and style
  export interface ScriptElement extends BaseElementProps {
    src?: string;
    type?: string;
    async?: boolean;
    defer?: boolean;
    crossOrigin?: 'anonymous' | 'use-credentials';
    integrity?: string;
    noModule?: boolean;
    referrerPolicy?: string;
    text?: string;
  }

  export interface StyleElement extends BaseElementProps {
    type?: string;
    media?: string;
    scoped?: boolean;
    text?: string;
  }

  // Meta and head elements
  export interface MetaElement extends BaseElementProps {
    name?: string;
    content?: string;
    httpEquiv?: string;
    charset?: string;
  }

  export interface LinkHeadElement extends BaseElementProps {
    href?: string;
    rel?: string;
    type?: string;
    media?: string;
    sizes?: string;
    as?: string;
    crossOrigin?: 'anonymous' | 'use-credentials';
    integrity?: string;
    referrerPolicy?: string;
    hreflang?: string;
  }

  // Element options for auto-complete
  export interface ElementOptions {
    // Document structure
    html?: ContainerElement;
    head?: ContainerElement;
    body?: ContainerElement;
    
    // Document metadata
    title?: TextElement;
    meta?: MetaElement;
    link?: LinkHeadElement;
    style?: StyleElement;
    script?: ScriptElement;
    
    // Sectioning elements
    main?: ContainerElement;
    header?: ContainerElement;
    footer?: ContainerElement;
    section?: ContainerElement;
    article?: ContainerElement;
    aside?: ContainerElement;
    nav?: ContainerElement;
    h1?: TextElement;
    h2?: TextElement;
    h3?: TextElement;
    h4?: TextElement;
    h5?: TextElement;
    h6?: TextElement;
    hgroup?: ContainerElement;
    address?: ContainerElement;
    
    // Text content
    div?: ContainerWithTextElement;
    p?: TextElement;
    blockquote?: TextElement;
    pre?: TextElement;
    hr?: VoidElement;
    
    // Inline text elements
    span?: ContainerWithTextElement;
    a?: LinkElement;
    strong?: ContainerWithTextElement;
    em?: ContainerWithTextElement;
    b?: ContainerWithTextElement;
    i?: ContainerWithTextElement;
    u?: ContainerWithTextElement;
    s?: ContainerWithTextElement;
    small?: ContainerWithTextElement;
    mark?: ContainerWithTextElement;
    del?: ContainerWithTextElement;
    ins?: ContainerWithTextElement;
    sub?: ContainerWithTextElement;
    sup?: ContainerWithTextElement;
    code?: ContainerWithTextElement;
    kbd?: ContainerWithTextElement;
    samp?: ContainerWithTextElement;
    var?: ContainerWithTextElement;
    cite?: ContainerWithTextElement;
    q?: ContainerWithTextElement;
    abbr?: ContainerWithTextElement;
    dfn?: ContainerWithTextElement;
    time?: TimeElement;
    data?: ContainerWithTextElement;
    
    // Line breaks
    br?: VoidElement;
    wbr?: VoidElement;
    
    // Lists
    ul?: ListElement;
    ol?: ListElement;
    li?: ListItemElement;
    dl?: ContainerElement;
    dt?: TextElement;
    dd?: ContainerElement;
    
    // Tables
    table?: TableElement;
    caption?: TextElement;
    colgroup?: ContainerElement;
    col?: VoidElement;
    thead?: ContainerElement;
    tbody?: ContainerElement;
    tfoot?: ContainerElement;
    tr?: TableRowElement;
    th?: TableHeaderElement;
    td?: TableCellElement;
    
    // Forms
    form?: FormElement;
    fieldset?: FieldSetElement;
    legend?: TextElement;
    label?: LabelElement;
    input?: InputElement;
    textarea?: TextAreaElement;
    select?: SelectElement;
    optgroup?: ContainerElement;
    option?: OptionElement;
    button?: ButtonElement;
    datalist?: ContainerElement;
    output?: TextElement;
    progress?: ProgressElement;
    meter?: MeterElement;
    
    // Media
    img?: ImageElement;
    picture?: ContainerElement;
    source?: VoidElement;
    video?: VideoElement;
    audio?: AudioElement;
    track?: VoidElement;
    
    // Embedded content
    iframe?: IframeElement;
    embed?: VoidElement;
    object?: ContainerElement;
    param?: VoidElement;
    canvas?: CanvasElement;
    map?: ContainerElement;
    area?: VoidElement;
    
    // Interactive elements
    details?: DetailsElement;
    summary?: TextElement;
    dialog?: DialogElement;
    
    // Ruby annotation
    ruby?: ContainerElement;
    rt?: TextElement;
    rp?: TextElement;
    
    // Figure
    figure?: ContainerElement;
    figcaption?: TextElement;
    
    // Template and slot
    template?: ContainerElement;
    slot?: ContainerElement;
    
    // Custom and unknown elements
    [key: string]: any;
  }

  // Element union type - defined after all interfaces to avoid circular references
  export type Element = 
    | { html: ContainerElement }
    | { head: ContainerElement }
    | { body: ContainerElement }
    | { title: TextElement }
    | { meta: MetaElement }
    | { link: LinkHeadElement }
    | { style: StyleElement }
    | { script: ScriptElement }
    | { main: ContainerElement }
    | { header: ContainerElement }
    | { footer: ContainerElement }
    | { section: ContainerElement }
    | { article: ContainerElement }
    | { aside: ContainerElement }
    | { nav: ContainerElement }
    | { h1: TextElement }
    | { h2: TextElement }
    | { h3: TextElement }
    | { h4: TextElement }
    | { h5: TextElement }
    | { h6: TextElement }
    | { hgroup: ContainerElement }
    | { address: ContainerElement }
    | { div: ContainerWithTextElement }
    | { p: TextElement }
    | { blockquote: TextElement }
    | { pre: TextElement }
    | { hr: VoidElement }
    | { span: ContainerWithTextElement }
    | { a: LinkElement }
    | { strong: ContainerWithTextElement }
    | { em: ContainerWithTextElement }
    | { b: ContainerWithTextElement }
    | { i: ContainerWithTextElement }
    | { u: ContainerWithTextElement }
    | { s: ContainerWithTextElement }
    | { small: ContainerWithTextElement }
    | { mark: ContainerWithTextElement }
    | { del: ContainerWithTextElement }
    | { ins: ContainerWithTextElement }
    | { sub: ContainerWithTextElement }
    | { sup: ContainerWithTextElement }
    | { code: ContainerWithTextElement }
    | { kbd: ContainerWithTextElement }
    | { samp: ContainerWithTextElement }
    | { var: ContainerWithTextElement }
    | { cite: ContainerWithTextElement }
    | { q: ContainerWithTextElement }
    | { abbr: ContainerWithTextElement }
    | { dfn: ContainerWithTextElement }
    | { time: TimeElement }
    | { data: ContainerWithTextElement }
    | { br: VoidElement }
    | { wbr: VoidElement }
    | { ul: ListElement }
    | { ol: ListElement }
    | { li: ListItemElement }
    | { dl: ContainerElement }
    | { dt: TextElement }
    | { dd: ContainerElement }
    | { table: TableElement }
    | { caption: TextElement }
    | { colgroup: ContainerElement }
    | { col: VoidElement }
    | { thead: ContainerElement }
    | { tbody: ContainerElement }
    | { tfoot: ContainerElement }
    | { tr: TableRowElement }
    | { th: TableHeaderElement }
    | { td: TableCellElement }
    | { form: FormElement }
    | { fieldset: FieldSetElement }
    | { legend: TextElement }
    | { label: LabelElement }
    | { input: InputElement }
    | { textarea: TextAreaElement }
    | { select: SelectElement }
    | { optgroup: ContainerElement }
    | { option: OptionElement }
    | { button: ButtonElement }
    | { datalist: ContainerElement }
    | { output: TextElement }
    | { progress: ProgressElement }
    | { meter: MeterElement }
    | { img: ImageElement }
    | { picture: ContainerElement }
    | { source: VoidElement }
    | { video: VideoElement }
    | { audio: AudioElement }
    | { track: VoidElement }
    | { iframe: IframeElement }
    | { embed: VoidElement }
    | { object: ContainerElement }
    | { param: VoidElement }
    | { canvas: CanvasElement }
    | { map: ContainerElement }
    | { area: VoidElement }
    | { details: DetailsElement }
    | { summary: TextElement }
    | { dialog: DialogElement }
    | { ruby: ContainerElement }
    | { rt: TextElement }
    | { rp: TextElement }
    | { figure: ContainerElement }
    | { figcaption: TextElement }
    | { template: ContainerElement }
    | { slot: ContainerElement };
}

// Export the main types from the namespace with proper typing
export type JurisVDOMElement = JurisVDOM.Element;
export type JurisElementOptions = JurisVDOM.ElementOptions;

// Also export individual element types for advanced usage
export type JurisContainerElement = JurisVDOM.ContainerElement;
export type JurisTextElement = JurisVDOM.TextElement;
export type JurisInputElement = JurisVDOM.InputElement;
export type JurisButtonElement = JurisVDOM.ButtonElement;
export type JurisImageElement = JurisVDOM.ImageElement;
export type JurisVideoElement = JurisVDOM.VideoElement;
export type JurisAudioElement = JurisVDOM.AudioElement;
export type JurisTableElement = JurisVDOM.TableElement;
export type JurisFormElement = JurisVDOM.FormElement;

// Component state and context interfaces
export interface ComponentState {
  getState: <T>(key: string, defaultValue?: T, track?: boolean) => T;
  setState: <T>(key: string, value: T) => void;
}

export interface JurisContext extends ComponentState {
  services?: Record<string, any>;
  headless?: Record<string, any>;
  isSSR?: boolean;
  element?: HTMLElement;
  newState?: <T>(key: string, initialValue: T) => [() => T, (value: T) => void];
  subscribe?: (path: string, callback: (newValue: any, oldValue: any, path: string) => void) => () => void;
  components?: {
    register: (name: string, component: JurisComponentFunction) => void;
    registerHeadless: (name: string, component: any, options?: any) => void;
    get: (name: string) => JurisComponentFunction | undefined;
    getHeadless: (name: string) => any;
    initHeadless: (name: string, props?: any) => any;
    reinitHeadless: (name: string, props?: any) => any;
    getHeadlessAPI: (name: string) => any;
    getAllHeadlessAPIs: () => Record<string, any>;
  };
  utils?: {
    render: (container?: string | HTMLElement) => void;
    cleanup: () => void;
    forceRender: () => void;
    setRenderMode: (mode: 'fine-grained' | 'batch') => void;
    getRenderMode: () => string;
    isFineGrained: () => boolean;
    isBatchMode: () => boolean;
    getHeadlessStatus: () => any;
  };
  juris?: any;
  logger?: {
    log: any;
    warn: any;
    error: any;
    info: any;
    debug: any;
    subscribe: any;
    unsubscribe: any;
  };
}

// Component function signature for Juris Object VDOM
export type JurisComponentFunction = (
  props: Record<string, any>,
  context: JurisContext
) => JurisVDOMElement | { render: () => JurisVDOMElement | Promise<JurisVDOMElement> };

// Lifecycle hooks
export interface ComponentHooks {
  onMount?: () => void | Promise<void>;
  onUpdate?: (oldProps: any, newProps: any) => void | Promise<void>;
  onUnmount?: () => void | Promise<void>;
}

// Component with lifecycle
export interface JurisLifecycleComponent {
  render: () => JurisVDOMElement | Promise<JurisVDOMElement>;
  hooks?: ComponentHooks;
  api?: Record<string, any>;
}

// Headless component
export interface HeadlessComponent {
  api?: Record<string, any>;
  hooks?: {
    onRegister?: () => void;
    onUnregister?: () => void;
  };
}

// Juris framework instance
export interface JurisInstance {
  // State management
  getState: <T>(path: string, defaultValue?: T, track?: boolean) => T;
  setState: <T>(path: string, value: T, context?: any) => void;
  subscribe: (path: string, callback: (newValue: any, oldValue: any, path: string) => void, hierarchical?: boolean) => () => void;
  subscribeExact: (path: string, callback: (newValue: any, oldValue: any, path: string) => void) => () => void;
  
  // Component management
  registerComponent: (name: string, component: JurisComponentFunction) => void;
  registerHeadlessComponent: (name: string, component: (props: any, context: any) => HeadlessComponent, options?: any) => void;
  getComponent: (name: string) => JurisComponentFunction | undefined;
  getHeadlessComponent: (name: string) => any;
  initializeHeadlessComponent: (name: string, props?: any) => any;
  
  // Rendering
  render: (container?: string | HTMLElement) => void;
  setRenderMode: (mode: 'fine-grained' | 'batch') => void;
  getRenderMode: () => string;
  isFineGrained: () => boolean;
  isBatchMode: () => boolean;
  
  // Enhancement
  enhance: (selector: string, definition: any, options?: any) => () => void;
  configureEnhancement: (options: any) => void;
  getEnhancementStats: () => any;
  
  // Utilities
  cleanup: () => void;
  destroy: () => void;
  createContext: (element?: HTMLElement) => JurisContext;
  createHeadlessContext: (element?: HTMLElement) => JurisContext;
  objectToHtml: (vnode: JurisVDOMElement) => HTMLElement | null;
  getHeadlessStatus: () => any;
}

// Export everything for Juris Object VDOM IntelliSense
export {
  JurisComponentFunction,
  JurisVDOMElement,
  JurisElementOptions,
  JurisContext,
  JurisInstance,
  ComponentHooks,
  JurisLifecycleComponent,
  HeadlessComponent
};
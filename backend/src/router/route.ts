type RegexNode<T> = {
  name: string;
  regexp: RegExp;
  router: TreeRouter<T>;
};

type SimpleParamNode<T> = {
  name: string;
  router: TreeRouter<T>;
};

type NodeType = "static" | "simple" | "regex";

export interface MatchContext {
  [key: string]: string;
}

type SingleRouteOutput<T> = {
  nodeType: NodeType;
  name: string;
  node: TreeRouter<T>;
};

export interface Router<T> {
  /**
   * match a path to a route
   * @param path path to match
   * @param ctx context to store the match
   */
  match(path: string, ctx: MatchContext): T | null;
}

type regElem<T> = { isRouter: false; elem: T } | {
  isRouter: true;
  elem: Router<T>;
};

/**
 * TreeRouter class
 * @param T type of the value to be returned by the route
 *
 * @example
 * ```ts
 * const r = new Router<number>();
 * r.register("/", 1);
 * r.register("/users", 2);
 * r.register("/users/:id(\\d)", 3);
 * r.register("/users/:id(\\d)/:name", 4);
 *
 * console.log(r.match("/")); // 1
 * console.log(r.match("/users")); // 2
 * console.log(r.match("/users/3")); // 3
 * console.log(r.match("/users/3/jonh")); // 4
 *
 * console.log(r.match("/users/jonh")); // null
 * console.log(r.match("/a")); // null
 * ```
 */
export class TreeRouter<T> implements Router<T> {
  private staticNode: Record<string, TreeRouter<T>>;
  private simpleParamNode?: SimpleParamNode<T>;
  private regexParamNodes: Map<string, RegexNode<T>>;
  private fallbackNode?: Router<T>;
  private elem?: T;

  constructor() {
    this.regexParamNodes = new Map();
    this.simpleParamNode = undefined;
    this.staticNode = {};
    this.elem = undefined;
  }

  private findRouter(path: string, ctx: MatchContext): [TreeRouter<T>, string] {
    const pathes = path.split("/");
    // deno-lint-ignore no-this-alias
    let cur: TreeRouter<T> = this;
    for (;;) {
      let p = pathes.shift();
      if (typeof p === "undefined") {
        return [cur, ""];
      } else if (p === "") {
        continue;
      }
      p = decodeURIComponent(p);
      const result = cur.singleRoute(p);
      if (result === null) {
        return [cur, [p, ...pathes].join("/")];
      }
      if (result.nodeType !== "static") {
        ctx[result.name] = p;
      }
      cur = result.node;
    }
  }

  /**
   * match router with path
   * if could not found, throw error
   * @returns matching element
   * @example ```
   *   const book = match("/books/35");
   *   console.log("books"+ book);
   * ```
   */
  match(path: string, ctx: MatchContext = {}): T | null {
    const [node, rest] = this.findRouter(path, ctx);
    if (rest === "" && node.elem !== undefined) {
      return node.elem;
    }
    if (node.fallbackNode === undefined) {
      return null;
    }
    return node.fallbackNode.match(rest, ctx);
  }
  /**
   * register path to router
   * @example ```
   *  const book = new Router();
   *  book.register("/books/:id",(ctx)=>{console.log("books",ctx.id)});
   * ```
   */
  register(path: string, elem: T) {
    this.registerPath(path, {
      isRouter: false,
      elem: elem,
    });
    return this;
  }
  registerRouter(path: string, router: Router<T>): void {
    this.registerPath(path, {
      isRouter: true,
      elem: router,
    });
  }
  private setOrMerge(elem: regElem<T>) {
    if (elem.isRouter) {
      this.fallbackNode = elem.elem;
    } else {
      this.elem = elem.elem;
    }
  }
  private registerPath(path: string, elem: regElem<T>): void {
    // deno-lint-ignore no-this-alias
    let cur: TreeRouter<T> = this;
    const pathes = path.split("/");
    for (;;) {
      const p = pathes.shift();
      if (typeof p === "undefined") {
        cur.setOrMerge(elem);
        return;
      } else if (p === "") {
        continue;
      }
      if (p.startsWith(":")) {
        const expr = p.slice(1);
        if (expr.includes("(") && expr.includes(")")) {
          const m = /([A-Za-z0-9_]+)\((.*)\)/.exec(expr);
          if (!m) {
            throw new Error("Invalid Parameter");
          }
          const name = m[1];
          const regexp = new RegExp(m[2]);
          const next = cur.regexParamNodes.get(name);
          if (next) {
            if (next.regexp.toString() !== regexp.toString()) {
              throw new Error("Parameter name is duplicated");
            }
            cur = next.router;
          } else {
            const router = new TreeRouter<T>();
            cur.regexParamNodes.set(name, {
              name,
              regexp,
              router,
            });
            cur = router;
          }
        } else {
          const name = expr;
          const next = cur.simpleParamNode;
          if (next) {
            if (next.name !== name) {
              throw new Error("Parameter name is duplicated");
            }
            cur = next.router;
          } else {
            const router = new TreeRouter<T>();
            cur.simpleParamNode = {
              name,
              router,
            };
            cur = router;
          }
        }
      } else {
        const next = cur.staticNode[p];
        if (next) {
          cur = next;
        } else {
          const router = new TreeRouter<T>();
          cur.staticNode[p] = router;
          cur = router;
        }
      }
    }
  }
  private singleRoute(p: string): SingleRouteOutput<T> | null {
    if (p in this.staticNode) {
      return {
        nodeType: "static",
        node: this.staticNode[p],
        name: p,
      };
    }
    for (const rn of this.regexParamNodes.values()) {
      if (rn.regexp.test(p)) {
        return {
          nodeType: "regex",
          name: rn.name,
          node: rn.router,
        };
      }
    }
    if (typeof this.simpleParamNode !== "undefined") {
      return {
        nodeType: "simple",
        node: this.simpleParamNode.router,
        name: this.simpleParamNode.name,
      };
    }
    return null;
  }
}

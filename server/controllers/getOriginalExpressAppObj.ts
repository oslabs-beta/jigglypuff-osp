import { Express } from 'express';

module.exports = (req, res, next) => {
  console.log("IN GET ORIGNIAL EXPRESS APP OBJ");
  //require Express
  const e = require("express");
  const fs = require("fs");
  //**** NEED TO MAKE THIS DYNAMIC ****
  const copiedServer = "../process/copiedServer";
  const expressApp: Express = require(copiedServer + req.body.serverpath.replace(req.body.filepath, ""));
  // const expressApp = require("../copiedServer/app.js");
  // const expressApp = require('../copiedServerNamed/server.js')

  const app: Express = expressApp;
  // console.log('app is ', app)
  // console.log('expressApp is ', expressApp)

  //NODES NEEDED

  // CLASS DEFINITIONS
  // APP TREE
  // Beginning of tree, this holds the entirety of the app and initializes empty arrays for the routers and bound dispatchers (explained below)
  class AppTree {
    app: Express;
    routers: any[];
    boundDispatchers: any[];
    constructor(app: object) {
      this.app = app;
      this.routers = [];
      this.boundDispatchers = [];
    }
  }

  // BOUND DISPATCHER
  // a bound dispatcher is a simple route
  //
  // file: server.js
  // // app.get('/topLevelRoute', (req, res) => {
  // //   res.status(200).json({message : "hello!"})
  // // })
  // //
  class BoundDispatcher {
    path: string = "";
    bd: object = {};
    methods: any = null;
    stack: any[] = [];
    constructor(boundDispatch: object) {
      this.path = boundDispatch.route.path;
      this.bd = boundDispatch;
      this.methods = boundDispatch.route.methods;
      this.stack = boundDispatch.route.stack;
    }
  }

  // ROUTER
  // a router is a router that the app uses for handling requests to a certain route
  //
  // file: server.js
  // // app.use('/topLevelRoute', apiRouter)
  class Router {
    pathRegex: string;
    endpoints: object;
    router: object;
    stack: object[];
    constructor(router: object) {
      this.pathRegex = router.regexp;
      this.endpoints = this.listAllEndpoints(router);
      this.router = router;
      this.stack = router.handle.stack;
    }

    // This method creates an object of endpoints and their associated middleware
    // it does not yet handle multiple methods for the same route (eg. GET and POST), but should be simple to implement
    listAllEndpoints = (r: object) => {
      //make general endpoint obj
      const endpoints = {};

      const recursiveStackDive = (root, ogHandle) => {
        console.log("root")
        console.log(root)
        console.log("root.handle")
        console.log(root.handle)
        console.log("ogHandle")
        console.log(ogHandle)
        root.handle.stack.forEach((el) => {
          console.log("IN FOR EACH of HANDLE STACK")
          console.log(el)
          console.log(el.handle)
          // console.log(el.handle)
          if (el?.route?.stack.length === 1) {
            endpoints[el.route.path] = {};
            endpoints[el.route.path] = new middlewareLL(el.route);
          } else if (!el?.route?.path) {
              recursiveStackDive(el, el.handle)
              // el = el.handle
              // el.stack.forEach(subEl => {
              //     console.log(subEl)
              // }
          // )
          } else {
            console.log("el.name")
            console.log(el.name)
            console.log("el.route?.stack")
            console.log(el.route?.stack)
            // make endpoint-specific key in obj
            endpoints[el.route.path] = {};
            // make LLs of middleware functions for each specific endpoint
            endpoints[el.route.path] = new middlewareLL(el.route);
          }
        })
      }
      recursiveStackDive(r, 'NA')


      // r.handle.stack.forEach((el) => {
      //   // make endpoint-specific key in obj
      //   endpoints[el.route.path] = {};
      //   // make LLs of middleware functions for each specific endpoint
      //   endpoints[el.route.path] = new middlewareLL(el.route);
      // });
      // return
      return endpoints;
    };
  }

  // MIDDLEWARE LINKED LIST
  // Stores a bunch of general info about the route as well as the start of the middleware chain
  // Also has methods for creating the LL out of the submitted route's stack and a callable method to log every LL node
  class middlewareLL {
    methods: any;
    path: string;
    stack: any[];
    middlewareChain: object;
    constructor(subRoute: object) {
      //this method is HTTP method, not js method
      this.methods = subRoute.methods;
      //this is currently always indefined
      this.path = subRoute.path;
      this.stack = subRoute.stack;
      // this is basically the head node
      this.middlewareChain = this.makeMiddlewareChain(subRoute.stack);
    }

    // This method iterates through the "stack" (which holds all the middleware functions in an array) and makes them into middleware nodes
    makeMiddlewareChain = (stack: any[]): object => {
      //make sure stack exists
      if (stack.length) {
        //make the first node
        const firstNode: object = new middlewareLLNode(stack[0]);
        //iterate through the stack, adding middleware nodes to the chain
        let curr: any = firstNode;
        for (let i = 1; i < stack.length; i++) {
          curr.nextFunc = new middlewareLLNode(stack[i]);
          curr = curr.nextFunc;
        }
        return firstNode;
      } else return {};
    };

    // this function, when invoked, iterates through the LL to list out all the functions definitions in the middleware chain
    listMiddlewareFuncs = () => {
      // start at head
      let current: object = this.middlewareChain;
      // set an index
      let indexInChain: number = 0;
      // iterate through ll and log the fucnction position, route, and function definition
      while (current) {
        console.log(
          `\n Function #${indexInChain} in ${this.path}:`.bold.green,
          `\n ${current.funcString} \n`
        );
        indexInChain++;
        current = current.nextFunc;
      }
    };
  }

  // MIDDLEWARE NODE
  // Basic LL node constructor
  class middlewareLLNode {
    func: any;
    path: string;
    funcString: string;
    nextFunc: any;
    constructor(func: object) {
      this.func = func.handle;
      // this is undefined, ideally it would hold the path of the file that holds the function
      this.path = func.handle.file;
      this.funcString = func.handle.toString();
      // this will get reassigned if it is not the last LL node
      this.nextFunc = null;
    }
  }

  // create app node
  const appTree: AppTree = new AppTree(app);

  // look at the routers stack
  appTree.app._router.stack.forEach((router) => {
    // console.log('router is ', router);
    console.log('router name is ', router.name);
    // if route is a bound dispatcher, create a new boundDispatcher
    if (router.name === "bound dispatch") {
      const newBD: object = new BoundDispatcher(router);
      appTree.boundDispatchers.push(newBD);
    }
    // if the route is a router, create a new router
    if (router.name === "router") {
      const newRouter: object = new Router(router);
      console.log('newRouter is ', newRouter);
      appTree.routers.push(newRouter);
    }
  });

  // //no apptree.boundDispatchers yet

  // // console.log(appTree);
  // appTree.routers.forEach((el) => {
  //   for (let endpoint in el.endpoints) {
  //     // console.log(el.endpoints[endpoint].stack)
  //     // console.log("THIS IS ENDPOINT: ", endpoint);
  //     // console.log("THIS IS ENDPOINT MW STACK: ", el.endpoints[endpoint].stack);
  //   }
  //   // // el.endpoints.forEach(elEnd => {
  //   //   console.log(elEnd.middlewareChain)
  //   // })
  // });
  const originalAppTree = appTree;
  console.log('appTree before writeFileSync is ', originalAppTree);
  fs.writeFileSync(
    "originalAppTree.json",
    JSON.stringify(originalAppTree),
    (error) => {
      if (error) throw error;
    }
  );
  // setTimeout(() => next(), 5000)
  next();

  //
};

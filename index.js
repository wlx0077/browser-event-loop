window.browserEventLoop = (function () {
  // =====S 模拟浏览器事件循环 =====
  const DELAY_TIME = 100; // 延迟时间
  const JS_TIME_THRESHOLD = DELAY_TIME + 60;  // js线程工作时间阈值

  let macroTasks = [];
  let microTasks = [];
  let animationFrameTasks = [];
  let idleTasks = [];

  let status = '0';  // '0': 停止，'1': 检查， '2': js线程工作， '3': 渲染线程工作， '9': 异常
  let jsWorkTime = 0; // js线程工作的时间

  // 开启浏览器调度
  function startBrowserSchedule() {

    // 循环工作
    function runWork() {
      if (status === '9') {
        status = '0';
        return;
      }
      status = '1';
      // 所有的任务经过浏览器微任务队列，模拟调度过程，延迟100ms防止线程卡死（影响不大）
      run(oneWork)
        .then(runWork)
        .catch((err) => {
          status = '9';
          onError(err);
        });
    }

    runWork();
  }

  // 一次工作内容
  function oneWork() {
    // 检查宏任务，并且在允许执行时间内
    while (has(macroTasks) && jsWorkTime < JS_TIME_THRESHOLD) {
      status = '2';
      jsWorkTime += measureTime(startJsWork);
    }
    // 重置状态
    status = '1';
    jsWorkTime = 0;

    // 检查animationFrameTasks
    if (has(animationFrameTasks)) {
      status = '2';
      startRenderWork();
    }

    // 浏览器渲染
    status = '3';
    render();

    // 检查是否空闲（其他task队列为空）
    if (isIdle()) {
      if (has(idleTasks)) { // 存在空闲任务
        status = '2';
        startIdleWork();
      }
    }

    status = '0'; // 完成
  }

  // 开始js线程工作
  function startJsWork() {
    macroTasks.shift()();
    flush(microTasks);
  }

  // 开始渲染相关的前置工作
  function startRenderWork() {
    if (animationFrameTasks.length) {
      const tasks = animationFrameTasks;
      animationFrameTasks = [];
      tasks.forEach((task) => {
        task();
        flush(microTasks);
      });
    }
  }

  // 开始空闲工作
  function startIdleWork() {
    idleTasks.shift()?.();
    flush(microTasks);
  }

  // 浏览器渲染视图
  function render() {
    // 浏览器页面渲染...
    console.log('浏览器页面渲染！！！');
  }

  function onError(err) {
    // 处理异常...
  }

  // 检查js线程是否空闲
  const isIdle = () => {
    return !(has(macroTasks) || has(microTasks) || has(animationFrameTasks));
  };

  const has = (tasks) => {
    return tasks.length > 0;
  };

  // 计算任务用时
  function measureTime(task) {
    const startTime = Date.now();
    task();
    return Date.now() - startTime;
  }

  // 运行task
  const run = (task) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          task();
          resolve();
        } catch (e) {
          reject(e);
        }
      }, DELAY_TIME); // 防止浏览器卡死，这里每次我们延迟100秒来模拟
    });
  };

  // 执行并清空任务
  function flush(tasks = []) {
    while (tasks.length) {
      tasks.shift()();
    }
  }

  // 提供模拟window的相关api
  const windowLike = {
    requestMarcoTask(task) {
      macroTasks.push(task);
    },
    requestMicroTask(task) {
      microTasks.push(task);
    },
    setTimeout(cb, time) {
      // 这里我们借助浏览器本身的定时器线程来模拟我们的定时器
      setTimeout(() => {
        windowLike.requestMarcoTask(cb);
      }, time);
    },
    requestAnimationFrame(task) {
      animationFrameTasks.push(task);
    },
    requestIdleCallback(task) {
      idleTasks.push(task);
    },
    proxyEvent(handler) {
      return (...args) => {
        windowLike.requestMarcoTask(() => {
          handler(...args);
        });
      };
    },
  };
  return {
    start: startBrowserSchedule,
    runMain: (main) => {
      windowLike.requestMarcoTask(() => {
        main(windowLike);
      });
    },
    window: windowLike,
  };
  // =====E 模拟浏览器事件循环 =====
})();
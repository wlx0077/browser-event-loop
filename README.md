# browserEventLoop-event-loop

简易代码，模拟浏览器时间循环

## 动机

由于浏览器的事件队列是封闭的，我们无法直接操作

例如我们想直接排入一个宏任务，这是无法做到的

所以我们基于浏览器的能力来模拟浏览器的调度过程，也就是事件循环

本次模拟旨在加深对浏览器事件循环的理解

## 准备

1. 我们借助浏览器的主线程以及微任务队列来作为代码执行的入口。
   - 为什么使用微任务队列呢，因为这个队列是我们可以操作的


2. 维护自己的队列，分为4类:
    - 宏任务队列
    - 微任务队列
    - 动画帧队列
    - 空闲队列
    

3. 提供模拟window的方法，提供基本方法，用来操作队列：
    - requestMarcoTask
    - requestMicroTask
    - requestAnimationFrame
    - requestIdleCallback
    

4. 借助定时器线程API setTimeout 实现自己的定时器以及事件代理，将所有js任务都由我们调度
    - setTimeout
    - proxyEvent
    
## 说明

由于我们借助主线程模拟事件循环，事件循环需要反复检查，并且主线程也需要执行代码，所以一直反复检查会造成主线程卡死。

这里使用setTimeout延迟每100ms检查一次，留给主线程执行任务的时间, 对我们的模拟无影响

## 其他
代码中有部分注释，具体可以参考源码

## 使用及测试

```html
<script src="https://unpkg.com/browserEventLoop-event-loop"></script> 

<script >
  window.onload = function () {
    // 开启浏览器调度工作
    browserEventLoop.start();
    // 执行主函数
    browserEventLoop.runMain(main);

    function main(window) {
      // 我们的代码...

      // 注册事件时加上proxyEvent
      btn.onclick = window.proxyEvent((e) => {
        // ...
      })
    }
  }
</script>
```

### 例一
```js
// 开启浏览器调度工作
browserEventLoop.start();
// 执行主函数
browserEventLoop.runMain(main);

// 模拟主函数（类似script），业务代码这里面
function main(window) {
  window.setTimeout(() => {
    console.log('time out');
  });
  
  window.requestAnimationFrame(() => {
    console.log('requestAnimationFrame');
  });
  
  window.requestMicroTask(() => {
    console.log('requestMicroTask');
  });
  
  console.log('start');
}

// start
// requestMicroTask
// requestAnimationFrame
// time out
```

### 例二
```js
// 开启浏览器调度工作
browserEventLoop.start();
// 执行主函数
browserEventLoop.runMain(main);

// 模拟主函数（类似script），业务代码这里面
function main(window) {
  const $btn = document.querySelector('button')

  $btn.onclick = window.proxyEvent((e) => {
    window.setTimeout(() => {
      console.log('click - time out');
    });
    
    window.requestAnimationFrame(() => {
      console.log('click - requestAnimationFrame');
    });
    
    window.requestMicroTask(() => {
      console.log('click - requestMicroTask');
    });
    
    console.log('click');
  })
}

// click
// click - requestMicroTask
// click - requestAnimationFrame
// click - time out
```

### 其他示例可自己编写代码测试
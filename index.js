window.onload = () => {
    // #region RxJs imports
    const Rx = rxjs;
    const {
        Observable,
        Subject,
        ReplaySubject,
        BehaviorSubject,
    } = rxjs;
    const {
        buffer,
        bufferCount,
        bufferTime,
        combineLatest,
        concat,
        concatAll,
        connect,
        count,
        debounce,
        debounceTime,
        delay,
        distinct,
        distinctUntilChanged,
        filter,
        flatMap,
        forkJoin,
        map,
        mapTo,
        max,
        merge,
        min,
        pairwise,
        publish,
        reduce,
        refCount,
        scan,
        share,
        skip,
        startWith,
        switchMap,
        take,
        takeUntil,
        takeWhile,
        tap,
        throttle,
        throttleTime,
        withLatestFrom,
    } = rxjs.operators;
    const {
        DrawingSymbol
    } = RxJsVisualizer;
    const {
        draw
    } = RxJsVisualizer.operators;
    // #endregion

    // #region ------------------------------------------------------------------ RxJsVisualizer
    const symbols = {};
    symbols['[object MouseEvent]'] = new DrawingSymbol({
        imageUrl: 'images/flash.png'
    });
    RxJsVisualizer.init({
        canvasId: 'canvas',
        logDivId: 'logs',
        blockHeight: 50,
        shapeSize: 20,
        maxPeriod: 10000,
        tickPeriod: 1000,
        centerShapes: false,
        symbolMap: symbols,
        addNavigationButtons: true,
        DEBUG: false
    });
    RxJsVisualizer.useRandomSymbolsForNumbers(100);
    // #endregion

    // #region ------------------------------------------------------------------ register
    function registerClick(id, handler) {
        $(`#${id}`).on('click', ev => handler());
    }

    registerClick('btnMouseDistance', btnMouseDistance);
    registerClick('btnMovingAverage', btnMovingAverage);
    registerClick('btnMultipleClicks', btnMultipleClicks);
    registerClick('btnFixShare', btnFixShare);
    registerClick('btnWebSequentialList', btnWebSequentialList);
    registerClick('btnBmi', btnBmi);
    registerClick('btnWebCascading', btnWebCascading);
    registerClick('btnWebParallel', btnWebParallel);
    // #endregion

    // #region ------------------------------------------------------------------ global observers
    const observer = {
        next: value => console.log(`next: ${value}`),
        error: error => console.error(error),
        complete: () => console.log('Completed')
    };
    // #endregion


    // #region ------------------------------------------------------------------ mouse distance
    function btnMouseDistance() {
        RxJsVisualizer.prepareCanvas(['single', 'sum']);
        let totalDistance = 0;

        const event = Rx.fromEvent(document, 'mousemove')

        event.pipe(
            throttleTime(500),
            pairwise(),
            map(pair => {
                const xDistance = Math.abs(pair[0].clientX - pair[1].clientX);
                const yDistance = Math.abs(pair[0].clientY - pair[1].clientY);
                const distance = +Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2)).toFixed(1);

                totalDistance += distance;
                return distance;
            }),
            tap(x => console.log(x))
        ).subscribe(RxJsVisualizer.observerForLine(0));

        event.pipe(
            debounceTime(1000),
            map(_ => +totalDistance.toFixed(1))
        ).subscribe(RxJsVisualizer.observerForLine(1));
    }

    // #endregion

    // #region
    function btnBmi() {
        RxJsVisualizer.prepareCanvas(['weight', 'height', 'BMI']);
        const lblWeight = document.getElementById('lblWeight');
        const lblHeight = document.getElementById('lblHeight');
        const lblBmi = document.getElementById('lblBmi');

        const weightObs = Rx.fromEvent(document.getElementById('sldWeight'), 'input').pipe(
            map(x => x.target.value),
            startWith(70),
            tap(x => lblWeight.textContent = x)
        );
        weightObs.subscribe(RxJsVisualizer.observerForLine(0));

        const heightObs = Rx.fromEvent(document.getElementById('sldHeight'), 'input').pipe(
            map(x => x.target.value),
            startWith(180),
            tap(x => lblHeight.textContent = x)
        );
        heightObs.subscribe(RxJsVisualizer.observerForLine(1));

        Rx.combineLatest(weightObs, heightObs).pipe(
            map(([weight, height]) => {
                const bmi = (weight / Math.pow(height / 100, 2));
                lblBmi.textContent = bmi;
                return bmi;
            })
        ).subscribe(RxJsVisualizer.observerForLine(2));
    }

    // #endregion

    // #region
    function btnWebCascading() {
        RxJsVisualizer.prepareCanvas(['commentId', 'postId', 'userId', 'username']);
        const lblCommentId = document.getElementById('lblCommentId');
        const lblUser = document.getElementById('lblUser');

        Rx.fromEvent(document.getElementById('sldCommentId'), 'input').pipe(
            map(x => x.target.value),
            tap(x => lblCommentId.textContent = x),
            draw(0),
            switchMap(async x => (await fetch(`https://jsonplaceholder.typicode.com/comments/${x}`)).json()),
            map(x => x.postId),
            draw(1),
            switchMap(async x => (await fetch(`https://jsonplaceholder.typicode.com/posts/${x}`)).json()),
            map(x => x.userId),
            draw(2),
            switchMap(async x => (await fetch(`https://jsonplaceholder.typicode.com/users/${x}`)).json()),
            map(x => `${x.username} [${x.name}]`),
            tap(x => lblUser.textContent = x)
        ).subscribe(RxJsVisualizer.observerForLine(3));
    }

    // #endregion

    // #region
    function btnWebParallel() {
        RxJsVisualizer.prepareCanvas(['album', 'todo']);

        const lblUserId = document.getElementById('lblParallelUserId');

        Rx.fromEvent(document.getElementById('sldUserId'), 'input').pipe(
            map(x => x.target.value),
            tap(x => lblUserId.textContent = x),
            switchMap(id => {
                return Rx.forkJoin(
                    Rx.from(fetch(`https://jsonplaceholder.typicode.com/albums?userId=${id}`).then(x => x.json())).pipe(
                        map(a => a.slice(0, 5))
                    ),
                    Rx.from(fetch(`https://jsonplaceholder.typicode.com/todos?userId=${id}`).then(x => x.json())).pipe(
                        map(t => t.slice(0, 5))
                    )
                );
            })
        ).subscribe(([albums, todos]) => {
            for (const album of albums.map(a => 'album ' + a.title)) RxJsVisualizer.writeToLine(0, album);
            for (const todo of todos.map(t => 'todo ' + t.title)) RxJsVisualizer.writeToLine(1, todo);
        });

    }

    // #endregion

    // #region ------------------------------------------------------------------ moving average
    function btnMovingAverage() {

    }

    // #endregion

    // #region ------------------------------------------------------------------ multiple clicks
    function btnMultipleClicks() {

    }

    // #endregion

    // #region ------------------------------------------------------------------ fix share
    function btnFixShare() {
        console.log('Fix this code so that a and b log the same events at the same time');
        const clock = Rx.interval(1000)
            .pipe(
                take(5),
                map(x => x + 1),
                share(),
                map(x => `${x} -> ${Math.random()}`),
            );
        clock.subscribe(x => console.log(`a: ${x}`));
        setTimeout(() => clock.subscribe(x => console.log(`b: ${x}`)), 2500);
    }

    // #endregion


    // #region ------------------------------------------------------------------ web sequential
    function btnWebSequentialList() {
        // https://jsonplaceholder.typicode.com/posts?userId=7 ==> postId 61-70
        // https://jsonplaceholder.typicode.com/comments?postId=61 ==> commentId 301-350
    }

    // #endregion

};

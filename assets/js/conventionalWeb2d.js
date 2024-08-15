if (!localStorage.getItem('categoryStartTime')) {
    localStorage.setItem('categoryStartTime', performance.now());
}

let userStudyTasks = {
    numberOfClicks: parseInt(localStorage.getItem('numberOfClicks')) || 0,
    numberOfInteractions: parseInt(localStorage.getItem('numberOfInteractions')) || 0,
    numberOfLikesInOneMinute: parseInt(localStorage.getItem('numberOfLikesInOneMinute')) || 0,
    timeSpentForJuramentada: parseFloat(localStorage.getItem('timeSpentForJuramentada')) || 0,
    timeSpentForSixgon: parseFloat(localStorage.getItem('timeSpentForSixgon')) || 0,
    timeSpentForTostadora: parseFloat(localStorage.getItem('timeSpentForTostadora')) || 0,
};

function saveMetrics() {
    localStorage.setItem('numberOfClicks', userStudyTasks.numberOfClicks);
    localStorage.setItem('numberOfInteractions', userStudyTasks.numberOfInteractions);
    localStorage.setItem('numberOfLikesInOneMinute', userStudyTasks.numberOfLikesInOneMinute);
    localStorage.setItem('timeSpentForJuramentada', userStudyTasks.timeSpentForJuramentada);
    localStorage.setItem('timeSpentForSixgon', userStudyTasks.timeSpentForSixgon);
    localStorage.setItem('timeSpentForTostadora', userStudyTasks.timeSpentForTostadora);
}

document.addEventListener('click', function() {
    userStudyTasks.numberOfClicks++;
    saveMetrics();
});

document.addEventListener('click', function(event) {
    if (event.target.tagName === 'BUTTON' && (event.target.textContent === 'Like' || event.target.textContent === 'Comprar')) {
        userStudyTasks.numberOfInteractions++;
        saveMetrics();
    }
});

document.addEventListener('click', function(event) {
    if (event.target.tagName === 'BUTTON' && event.target.textContent === 'Comprar') {
        let startTime = parseFloat(localStorage.getItem('categoryStartTime')) || performance.now();
        let endTime = performance.now();
        let timeSpent = (endTime - startTime) / 1000;

        let postTitle = document.querySelector('h1').textContent;

        if (postTitle.includes('Juramentada')) {
            userStudyTasks.timeSpentForJuramentada += timeSpent;
        } else if (postTitle.includes('Sixgon')) {
            userStudyTasks.timeSpentForSixgon += timeSpent;
        } else if (postTitle.includes('Tostadora')) {
            userStudyTasks.timeSpentForTostadora += timeSpent;
        }

        saveMetrics();
    }
});

let likeCounter = 0;
let categoryStartTime = parseFloat(localStorage.getItem('categoryStartTime')) || performance.now();

document.addEventListener('click', function(event) {
    if (event.target.tagName === 'BUTTON' && event.target.textContent === 'Like') {
        let currentTime = performance.now();
        if ((currentTime - categoryStartTime) <= 60000) {
            likeCounter++;
        }
    }
});

setTimeout(function() {
    if (likeCounter > 0) {
        userStudyTasks.numberOfLikesInOneMinute = likeCounter;
        saveMetrics();
    }
}, Math.max(0, 60000 - (performance.now() - categoryStartTime)));


window.addEventListener('beforeunload', function(event) {
    const currentURL = window.location.href;
    let isNavigatingAway = false;

    if (document.referrer && document.referrer.startsWith(window.location.origin)) {
        isNavigatingAway = true;
    }

    if (!isNavigatingAway) {
        sendData();
    }
});

function sendData() {
    if (navigator.sendBeacon) {
        navigator.sendBeacon('../../tasks.php', JSON.stringify({ userStudyTasks }));
    } else {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '../../tasks.php', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({ userStudyTasks }));
    }
}
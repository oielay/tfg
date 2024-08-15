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

document.addEventListener('click', function(event) {
    userStudyTasks.numberOfClicks++;

    if (event.target.classList.contains('wp-block-button__link') && (event.target.textContent === 'Like')) {
        userStudyTasks.numberOfInteractions++;
    }

    if (event.target.classList.contains('wp-block-button__link') && event.target.textContent === 'Comprar') {
        userStudyTasks.numberOfInteractions++;

        let startTime = parseFloat(localStorage.getItem('categoryStartTime')) || performance.now();
        let endTime = performance.now();
        let timeSpent = (endTime - startTime) / 1000;

        let postTitle = document.querySelector('.wp-block-post-title').textContent;

        if (postTitle.includes('Juramentada') && userStudyTasks.timeSpentForJuramentada === 0)
                userStudyTasks.timeSpentForJuramentada = timeSpent;
        else if (postTitle.includes('Sixgon') && userStudyTasks.timeSpentForSixgon === 0)
            userStudyTasks.timeSpentForSixgon = timeSpent;
        else if (postTitle.includes('Tostadora') && userStudyTasks.timeSpentForTostadora === 0)
            userStudyTasks.timeSpentForTostadora = timeSpent;
    }

    saveMetrics();
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
    let currentOrigin = window.location.origin;
    let referrerOrigin = document.referrer ? new URL(document.referrer).origin : '';

    if (referrerOrigin !== currentOrigin)
        sendData();
});

function sendData() {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '../../tasks.php', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({ userStudyTasks }));

    localStorage.removeItem('categoryStartTime');
    localStorage.removeItem('numberOfClicks');
    localStorage.removeItem('numberOfInteractions');
    localStorage.removeItem('numberOfLikesInOneMinute');
    localStorage.removeItem('timeSpentForJuramentada');
    localStorage.removeItem('timeSpentForSixgon');
    localStorage.removeItem('timeSpentForTostadora');
}
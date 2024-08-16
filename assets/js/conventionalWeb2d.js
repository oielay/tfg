if (!localStorage.getItem('categoryStartTime')) {
    localStorage.setItem('categoryStartTime', performance.now() / 1000);
}

let userStudyTasks = {
    numberOfClicks: parseInt(localStorage.getItem('numberOfClicks')) || 0,
    numberOfInteractions: parseInt(localStorage.getItem('numberOfInteractions')) || 0,
    numberOfLikesInOneMinute: parseInt(localStorage.getItem('numberOfLikesInOneMinute')) || 0,
    timeSpentForJuramentada: parseFloat(localStorage.getItem('timeSpentForJuramentada')) || 0,
    timeSpentForSixgon: parseFloat(localStorage.getItem('timeSpentForSixgon')) || 0,
    timeSpentForTostadora: parseFloat(localStorage.getItem('timeSpentForTostadora')) || 0,
    timeSpentTotal: parseFloat(localStorage.getItem('timeSpentTotal')) || 0
};

function saveMetrics() {
    localStorage.setItem('numberOfClicks', userStudyTasks.numberOfClicks);
    localStorage.setItem('numberOfInteractions', userStudyTasks.numberOfInteractions);
    localStorage.setItem('numberOfLikesInOneMinute', userStudyTasks.numberOfLikesInOneMinute);
    localStorage.setItem('timeSpentForJuramentada', userStudyTasks.timeSpentForJuramentada);
    localStorage.setItem('timeSpentForSixgon', userStudyTasks.timeSpentForSixgon);
    localStorage.setItem('timeSpentForTostadora', userStudyTasks.timeSpentForTostadora);
    localStorage.setItem('timeSpentTotal', userStudyTasks.timeSpentTotal);
}

document.addEventListener('click', function(event) {
    userStudyTasks.numberOfClicks++;

    if (event.target.classList.contains('wp-block-button__link') && (event.target.textContent === 'Like')) {
        userStudyTasks.numberOfInteractions++;
    }

    if (event.target.classList.contains('wp-block-button__link') && event.target.textContent === 'Comprar') {
        userStudyTasks.numberOfInteractions++;

        let elapsedTime = parseFloat(localStorage.getItem('timeSpentTotal'));
        userStudyTasks.timeSpentTotal = elapsedTime + performance.now() / 1000;

        let postTitle = document.querySelector('.wp-block-post-title').textContent;

        if (postTitle.includes('Juramentada') && userStudyTasks.timeSpentForJuramentada === 0)
            userStudyTasks.timeSpentForJuramentada = userStudyTasks.timeSpentTotal;
        else if (postTitle.includes('Sixgon') && userStudyTasks.timeSpentForSixgon === 0)
            userStudyTasks.timeSpentForSixgon = userStudyTasks.timeSpentTotal;
        else if (postTitle.includes('Tostadora') && userStudyTasks.timeSpentForTostadora === 0)
            userStudyTasks.timeSpentForTostadora = userStudyTasks.timeSpentTotal;
    }

    saveMetrics();
});

let likeCounter = 0;
let categoryStartTime = parseFloat(localStorage.getItem('categoryStartTime')) || performance.now();

document.addEventListener('click', function(event) {
    if (event.target.classList.contains('wp-block-button__link') && event.target.textContent === 'Like') {
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


var link_was_clicked = false;
document.addEventListener("click", function(e) {
    const hasClass = Array.from(e.target.classList).some(className => className.includes('post-navigation-link__'));

    if (e.target.nodeName.toLowerCase() === 'a' && e.target.href || hasClass)
        link_was_clicked = true;
}, true);

window.onbeforeunload = function() {
    if (link_was_clicked) {
        userStudyTasks.timeSpentTotal += userStudyTasks.timeSpentTotal == 0 ? (performance.now() - categoryStartTime) / 1000 : performance.now() / 1000;
        saveMetrics();
        
        link_was_clicked = false;
        return;
    }

    sendData();
}

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
    localStorage.removeItem('timeSpentTotal');
}
const titleScreen = document.getElementById("titleScreen");
const difficultyScreen = document.getElementById("difficultyScreen");
const gameScreen = document.getElementById("gameScreen");
const playBtn = document.getElementById("playBtn");
const difficultyButtons = document.querySelectorAll("[data-difficulty]");

const timerText = document.getElementById("timer");
const waterText = document.getElementById("waterCount");
const bacteriaText = document.getElementById("bacteriaCount");
const healthText = document.getElementById("health");

const gameOverScreen = document.getElementById("gameOver");
const resultText = document.getElementById("resultText");
const collectButton = document.getElementById("collectButton");
const confettiContainer = document.getElementById("confettiContainer");

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let collecting = false;
let gameRunning = false;

let waterCollected = 0;
let bacteriaCollected = 0;

let health = 100;
let timeLeft = 60;
let gameTimer;
let currentDifficulty = "normal";

const difficultySettings = {
    easy: { time: 90, virusSpeed: 0.7, virusSpawnChance: 0.01 },
    normal: { time: 60, virusSpeed: 1, virusSpawnChance: 0.02 },
    hard: { time: 45, virusSpeed: 1.5, virusSpawnChance: 0.04 }
};

const particles = [];

/* ------------------------- */
/* START GAME */
/* ------------------------- */

playBtn.addEventListener("click", () => {

    titleScreen.classList.add("hidden");
    difficultyScreen.classList.remove("hidden");

});

difficultyButtons.forEach((button) => {

    button.addEventListener("click", () => {

        currentDifficulty = button.dataset.difficulty;
        difficultyScreen.classList.add("hidden");
        gameScreen.classList.remove("hidden");

        startGame();

    });

});


/* ------------------------- */
/* BUCKET */
/* ------------------------- */

const bucket = {

    x: canvas.width / 2,

    y: canvas.height - 100,

    radius: 50,

    currentY: canvas.height - 100

};


/* ------------------------- */
/* PARTICLES */
/* ------------------------- */

function createParticle(type){

    const speed = type === "virus"
        ? 5 * difficultySettings[currentDifficulty].virusSpeed
        : type === "bacteria" ? 1.4 : 1;

    particles.push({

        x: Math.random() * canvas.width,

        y: Math.random() * (canvas.height - 150),

        vx: (Math.random() - 0.5) * 2 * speed,

        vy: (Math.random() - 0.5) * 2 * speed,

        radius: type === "water" ? 7 : type === "virus" ? 8 : 6,

        type: type
    });

}

for(let i = 0; i < 70; i++){

    createParticle("water");

}

for(let i = 0; i < 30; i++){

    createParticle("bacteria");

}


/* ------------------------- */
/* CONTROLS */
/* ------------------------- */

document.addEventListener("keydown", (e)=>{

    if(e.key.toLowerCase() === "e"){

        collecting = true;

    }

});

document.addEventListener("keyup", (e)=>{

    if(e.key.toLowerCase() === "e"){

        collecting = false;

    }

});

collectButton.addEventListener("pointerdown", (e)=>{
    e.preventDefault();
    collecting = true;
});

collectButton.addEventListener("pointerup", ()=>{
    collecting = false;
});

collectButton.addEventListener("pointercancel", ()=>{
    collecting = false;
});

collectButton.addEventListener("pointerleave", ()=>{
    collecting = false;
});

window.addEventListener("blur", ()=>{
    collecting = false;
});


/* ------------------------- */
/* TIMER */
/* ------------------------- */

function startGame(){

    gameRunning = true;
    timeLeft = difficultySettings[currentDifficulty].time;
    timerText.textContent = timeLeft;
    updateCollectionPercentages();

    gameTimer = setInterval(()=>{

        timeLeft--;

        timerText.textContent = timeLeft;

        if(timeLeft <= 0){
            endGame();
        }
        else if(!particles.some((particle) => particle.type === "virus") && Math.random() < difficultySettings[currentDifficulty].virusSpawnChance){
            createParticle("virus");
        }

    },1000);

    animate();
}


/* ------------------------- */
/* END GAME */
/* ------------------------- */

function endGame(message = ""){

    if(!gameRunning) return;

    gameRunning = false;
    clearInterval(gameTimer);

    gameScreen.classList.add("hidden");

    gameOverScreen.classList.remove("hidden");

    if(message){
        resultText.textContent = message;
    }
    else if(waterCollected >= 100){

        resultText.textContent =
            "You collected 100% water!";
        launchConfetti();

    }
    else{

        resultText.textContent =
            "Time ran out! Try again to collect 100% water.";
    }
}

function launchConfetti(){

    const colors = ["#ffc907", "#2e9df7", "#4fcb53", "#ff902a", "#f16061"];

    for(let i = 0; i < 180; i++){

        const confetti = document.createElement("span");

        confetti.classList.add("confetti-piece");
        confetti.style.left = `${Math.random() * 100}%`;
        confetti.style.backgroundColor =
            colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = `${Math.random() * 0.8}s`;
        confetti.style.setProperty(
            "--confetti-size",
            `${6 + Math.random() * 8}px`
        );

        confetti.addEventListener("animationend", ()=>{
            confetti.remove();
        });

        confettiContainer.appendChild(confetti);
    }
}


/* ------------------------- */
/* DRAW BUCKET */
/* ------------------------- */

function drawBucket(){

    const targetY = collecting
        ? canvas.height - 250
        : canvas.height - 100;

    bucket.currentY +=
        (targetY - bucket.currentY) * 0.08;

    ctx.beginPath();

    ctx.arc(
        bucket.x,
        bucket.currentY,
        bucket.radius,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "#d2d2d2";

    ctx.fill();

    ctx.strokeStyle = "#555";
    ctx.lineWidth = 6;
    ctx.stroke();

}


/* ------------------------- */
/* PARTICLES */
/* ------------------------- */

function updateParticles(){

    particles.forEach((p,index)=>{

        if(!gameRunning) return;

        p.x += p.vx;
        p.y += p.vy;

        /* bounce */

        if(p.x <= 0 || p.x >= canvas.width){

            p.vx *= -1;

        }

        if(p.y <= 0 || p.y >= canvas.height){

            p.vy *= -1;

        }

        /* suction */

        if(collecting){

            const dx = bucket.x - p.x;
            const dy = bucket.currentY - p.y;

            const dist =
                Math.sqrt(dx*dx + dy*dy);

            if(dist < 180){

                p.vx += (dx / dist) * 0.04;
                p.vy += (dy / dist) * 0.04;
            }

            if(dist < bucket.radius){

                if(p.type === "virus"){
                    endGame("You collected a virus! Game over.");
                    return;
                }

                if(p.type === "water"){

                    waterCollected = Math.min(100, waterCollected + 1);

                }
                else{

                    bacteriaCollected++;

                }

                updateCollectionPercentages();

                particles.splice(index,1);

                createParticle(p.type);

                updateHealth();

                if(waterCollected >= 100){
                    endGame();
                }
            }
        }

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            p.radius,
            0,
            Math.PI*2
        );

        if(p.type === "water"){

            ctx.fillStyle = "#006eff";

        }else if(p.type === "virus"){

            ctx.fillStyle = "#e32636";

        }else{

            ctx.fillStyle = "#ffd900";
        }

        ctx.fill();

    });

}


function updateCollectionPercentages(){

    const totalCollected =
        waterCollected + bacteriaCollected;

    const waterPercent = waterCollected;

    const bacteriaPercent = totalCollected > 0
        ? Math.round((bacteriaCollected / totalCollected) * 100)
        : 0;

    waterText.textContent = `${waterPercent}%`;
    bacteriaText.textContent = `${bacteriaPercent}%`;
}


/* ------------------------- */
/* HEALTH */
/* ------------------------- */

function updateHealth(){

    const total =
        waterCollected +
        bacteriaCollected;

    if(total <= 0) return;

    const bacteriaPercent =
        (bacteriaCollected / total) * 100;

    health = Math.max(
        0,
        100 - bacteriaPercent
    );

    healthText.textContent =
        Math.floor(health);

    const darkness =
        (100 - health) / 100;

    canvas.style.filter =
        `brightness(${1 - darkness * 0.5})`;
}


/* ------------------------- */
/* ANIMATION */
/* ------------------------- */

function animate(){

    if(!gameRunning) return;

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    updateParticles();

    drawBucket();

    requestAnimationFrame(animate);

}
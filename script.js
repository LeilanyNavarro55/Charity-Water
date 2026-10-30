const titleScreen = document.getElementById("titleScreen");
const difficultyScreen = document.getElementById("difficultyScreen");
const gameScreen = document.getElementById("gameScreen");
const playBtn = document.getElementById("playBtn");
const difficultyButtons = document.querySelectorAll("[data-difficulty]");

const timerText = document.getElementById("timer");
const levelText = document.getElementById("levelCount");
const waterText = document.getElementById("waterCount");
const bacteriaText = document.getElementById("bacteriaCount");
const healthText = document.getElementById("health");

const gameOverScreen = document.getElementById("gameOver");
const resultText = document.getElementById("resultText");
const endingArtwork = document.getElementById("endingArtwork");
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
let currentLevel = 1;

const difficultySettings = {
    easy: { time: 90, virusSpeed: 0.7, virusSpawnChance: 0.01, initialViruses: 0, maxViruses: 1, virusErraticness: 0 },
    normal: { time: 60, virusSpeed: 1, virusSpawnChance: 0.02, initialViruses: 0, maxViruses: 1, virusErraticness: 0 },
    hard: { time: 45, virusSpeed: 2, virusSpawnChance: 0.4, initialViruses: 4, maxViruses: 5, virusErraticness: 0.5 }
};

const levelSettings = [
    { waterTarget: 100, bacteriaCount: 30 },
    { waterTarget: 100, bacteriaCount: 60 },
    { waterTarget: 100, bacteriaCount: 150 }
];

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

    if(gameRunning) return;

    waterCollected = 0;
    bacteriaCollected = 0;
    health = 100;
    currentLevel = 1;
    particles.length = 0;

    for(let i = 0; i < 70; i++){
        createParticle("water");
    }

    setLevel(1);

    for(let i = 0; i < difficultySettings[currentDifficulty].initialViruses; i++){
        createParticle("virus");
    }

    gameRunning = true;
    timeLeft = difficultySettings[currentDifficulty].time;
    timerText.textContent = timeLeft;
    healthText.textContent = health;
    canvas.style.filter = "";
    gameScreen.style.setProperty("--illness-intensity", "0");
    updateCollectionPercentages();

    gameTimer = setInterval(()=>{

        timeLeft--;

        timerText.textContent = timeLeft;

        if(timeLeft <= 0){
            endGame();
        }
        else if(particles.filter((particle) => particle.type === "virus").length
            < difficultySettings[currentDifficulty].maxViruses
            && Math.random() < difficultySettings[currentDifficulty].virusSpawnChance){
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

    const won = !message && waterCollected >= 100;
    endingArtwork.src = won
        ? "img./good ending.png"
        : "img./sick ending.png";
    endingArtwork.alt = won
        ? "Illustration of a person outdoors after recovering"
        : "Illustration of a sick person lying in bed";

    if(message){
        resultText.textContent = message;
    }
    else if(won){

        resultText.textContent =
            "You completed all 3 levels and collected 100% water!";
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

function setLevel(level){

    currentLevel = level;
    waterCollected = 0;
    levelText.textContent = `${currentLevel} / ${levelSettings.length}`;

    updateCollectionPercentages();

    if(currentLevel >= 2){
        updateHealth();
        if(!gameRunning) return;
    }

    const bacteriaCount = particles.filter(
        (particle) => particle.type === "bacteria"
    ).length;

    for(let i = bacteriaCount; i < levelSettings[level - 1].bacteriaCount; i++){
        createParticle("bacteria");
    }
}

/* ------------------------- */
/* DRAW BUCKET */
/* ------------------------- */

function drawBucket(){

    const targetY = collecting
        ? canvas.height - 250
        : canvas.height - 100;
    let controlResponsiveness = 0.08;

    if(currentLevel >= 2){
        controlResponsiveness = bacteriaCollected <= 30 ? 0.055 : 0.025;
    }

    bucket.currentY +=
        (targetY - bucket.currentY) * controlResponsiveness;

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

        if(p.type === "virus" && difficultySettings[currentDifficulty].virusErraticness > 0){
            const turn = (Math.random() - 0.5)
                * difficultySettings[currentDifficulty].virusErraticness;
            const cosTurn = Math.cos(turn);
            const sinTurn = Math.sin(turn);
            const vx = p.vx;

            p.vx = vx * cosTurn - p.vy * sinTurn;
            p.vy = vx * sinTurn + p.vy * cosTurn;
        }

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

                    waterCollected = Math.min(100, waterCollected + 2);

                    if(currentLevel < levelSettings.length
                        && waterCollected >= levelSettings[currentLevel - 1].waterTarget){
                        setLevel(currentLevel + 1);
                        if(!gameRunning) return;
                    }
                }
                else{

                    bacteriaCollected = Math.min(100, bacteriaCollected + 3);

                }

                updateHealth();
                if(!gameRunning) return;

                updateCollectionPercentages();

                particles.splice(index,1);

                createParticle(p.type);

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

    const waterPercent = waterCollected;

    waterText.textContent = `${waterPercent}%`;
    bacteriaText.textContent = `${bacteriaCollected}%`;
}


/* ------------------------- */
/* HEALTH */
/* ------------------------- */

function updateHealth(){

    if(currentLevel < 2){
        health = 100;
        healthText.textContent = health;
        canvas.style.filter = "";
        gameScreen.style.setProperty("--illness-intensity", "0");
        return;
    }

    if(bacteriaCollected > 50){
        endGame("Oh no! You got sick and will not be able to collect anymore water for your family.");
        return;
    }

    health = Math.max(
        0,
        100 - bacteriaCollected
    );

    healthText.textContent =
        Math.floor(health);

    const healthLost = (100 - health) / 100;
    const illnessIntensity = Math.min(1, ((100 - health) / 50) ** 2);

    canvas.style.filter =
        `brightness(${1 - healthLost * 0.7})`;
    gameScreen.style.setProperty(
        "--illness-intensity",
        illnessIntensity.toFixed(2)
    );
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
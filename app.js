document.addEventListener('DOMContentLoaded', () => {
    const grid = document.querySelector('.grid');
    const gameText = document.querySelector("#game-text")
    const buttonText = document.querySelector("#button")
    const width = 10;
    const numSquares = width * width;
    let numBombs = 15;
    let squareElements = [];
    let isGameOver = false;
    let flags = 0;
    let isFirstClick = true;

    gameText.innerHTML = "Flags Remaining"

    // Function using Fisher-Yates shuffle algorithm
    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }

        return array;
    }


    function createGrid() {
        gameText.innerHTML = `${numBombs} Flags Remaining`;

        for (let i = 0; i < numSquares; i++) {
            const square = document.createElement('div');
            square.id = i;
            square.classList.add('safe');
            grid.appendChild(square);
            squareElements.push(square);

            square.addEventListener('click', () => click(square));
            square.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                addFlag(square);
            });
        }
    }


    function placeBombs(firstClickId) {
        const safeArea = getSafeArea(firstClickId);
        const gameArray = Array(numSquares).fill('safe');
        const availableSpots = gameArray.map((_, index) => index).filter(index => !safeArea.includes(index));
        const bombIndices = shuffle(availableSpots).slice(0, numBombs);

        bombIndices.forEach(index => {
            gameArray[index] = 'bomb';
            squareElements[index].classList.remove('safe');
            squareElements[index].classList.add('bomb');
        });

        calculateNumbers();
    }

    
    function getSafeArea(centerIndex) {
        const safeArea = [centerIndex];
        const isLeftEdge = centerIndex % width === 0;
        const isRightEdge = (centerIndex % width === width - 1);

        if (centerIndex > 0 && !isLeftEdge) safeArea.push(centerIndex - 1);
        if (centerIndex > 9 && !isRightEdge) safeArea.push(centerIndex + 1 - width);
        if (centerIndex > 10) safeArea.push(centerIndex - width);
        if (centerIndex > 11 && !isLeftEdge) safeArea.push(centerIndex - 1 - width);
        if (centerIndex < 98 && !isRightEdge) safeArea.push(centerIndex + 1);
        if (centerIndex < 90 && !isLeftEdge) safeArea.push(centerIndex - 1 + width);
        if (centerIndex < 88 && !isRightEdge) safeArea.push(centerIndex + 1 + width);
        if (centerIndex < 89) safeArea.push(centerIndex + width);

        return safeArea;
    }

    // Calculates and assigns the number of adjacent bombs for each safe square in the grid
    function calculateNumbers() {
        for (let i = 0; i < squareElements.length; i++) {
            if (!squareElements[i].classList.contains('bomb')) {
                const total = getAdjacentBombs(i);
                squareElements[i].setAttribute('data', total);
            }
        }
    }

    // Counts the bombs surrounding a specific square index in the grid
    function getAdjacentBombs(index) {
        const isLeftEdge = index % width === 0;
        const isRightEdge = index % width === width - 1;
        let total = 0;

        const neighbors = [
            -1, 1, -width, width,
            -width-1, -width+1, width-1, width+1
        ];

        for (let offset of neighbors) {
            const neighborIndex = index + offset;
            if (neighborIndex < 0 || neighborIndex >= numSquares) continue;
            if (isLeftEdge && (offset === -1 || offset === -width-1 || offset === width-1)) continue;
            if (isRightEdge && (offset === 1 || offset === -width+1 || offset === width+1)) continue;
            if (squareElements[neighborIndex].classList.contains('bomb')) total++;
        }

        return total;
    }

    // Handling click event
    function click(square) {
        if (isGameOver || square.classList.contains('checked') || square.classList.contains('flag')) return;

        if (isFirstClick) {
            isFirstClick = false;
            placeBombs(parseInt(square.id));
        }

        if (square.classList.contains('bomb')) {
            gameOver(false);
        } else {
            let total = square.getAttribute('data');
            // Reveal number of visited safe square
            if (total != 0) {
                square.classList.add('checked');
                if (total == 1) square.classList.add('one')
                if (total == 2) square.classList.add('two')
                if (total == 3) square.classList.add('three')
                if (total == 4) square.classList.add('four')    
                square.innerHTML = total;
            } else {
                checkSquare(square);
            }
        }
        checkForWin();
    }

    // Reveals neighbouring squares that are empty and unvisited
    function checkSquare(square) {
        const currentId = parseInt(square.id);
        const isLeftEdge = currentId % width === 0;
        const isRightEdge = currentId % width === width - 1;

        setTimeout(() => {
            const neighbors = [
                -1, 1, -width, width,
                -width-1, -width+1, width-1, width+1
            ];

            for (let offset of neighbors) {
                const neighborId = currentId + offset;
                if (neighborId < 0 || neighborId >= numSquares) continue;
                if (isLeftEdge && (offset === -1 || offset === -width-1 || offset === width-1)) continue;
                if (isRightEdge && (offset === 1 || offset === -width+1 || offset === width+1)) continue;

                const neighborSquare = document.getElementById(neighborId);
                if (!neighborSquare.classList.contains('checked') && !neighborSquare.classList.contains('flag')) {
                    click(neighborSquare);
                }
            }
        }, 10);

        square.classList.add('checked');
    }


    function addFlag(square) {
        if (isGameOver) return;
        if (!square.classList.contains('checked') && flags <= numBombs) {
            if (!square.classList.contains('flag') && flags != numBombs) {
                square.classList.add('flag');
                square.innerHTML = '🚩';
                flags++;
                checkForWin();
            } 
            else if (square.classList.contains('flag')) {
                square.classList.remove('flag');
                square.innerHTML = '';
                flags--;
            }
        }

        
        gameText.innerHTML = gameText.innerHTML = `${numBombs - flags} Flags Remaining`;
    }


    function gameOver(isWin) {
        isGameOver = true;
        gameText.innerHTML = isWin ? 'You Win!' : 'Game Over';

        squareElements.forEach(square => {
            if (square.classList.contains('bomb')) {
                square.innerHTML = '💣';
                square.classList.remove('bomb');
                square.classList.add('checked');
            }
        });

        buttonText.innerHTML = 'Play Again';
    }


    function checkForWin() {
        let matches = 0;

        for (let i = 0; i < squareElements.length; i++) {
            if (squareElements[i].classList.contains('flag') && squareElements[i].classList.contains('bomb')) {
                matches++;
            }
            if (squareElements[i].classList.contains('checked')) {
                matches++;
            }
        }

        if (matches === numSquares) {
            gameOver(true);
        }
    }


    // Reset game state variables, and reset the grid
    function restartGame() {
        isGameOver = false;
        flags = 0;
        isFirstClick = true;
        gameText.innerHTML = `${numBombs} Flags Remaining`;
        buttonText.innerHTML = 'Restart';

        grid.innerHTML = '';
        squareElements = [];

        createGrid();
    }

    // Add event listener for the restart button
    buttonText.addEventListener('click', restartGame);

    createGrid();
});
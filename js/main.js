document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const moneyDisplay = document.getElementById('money-display');
    const activeIncomeDisplay = document.getElementById('active-income-display');
    const passiveIncomeDisplay = document.getElementById('passive-income-display');
    const careerTitleDisplay = document.getElementById('career-title-display');
    const grindProgressDisplay = document.getElementById('grind-progress-display');
    const grindButton = document.getElementById('grind-button');
    const storyDisplay = document.getElementById('story-display');
    const eventLog = document.getElementById('event-log');
    const passiveOptionsDisplay = document.getElementById('passive-options-display');

    // --- Game State Variables ---
    let money = 0;
    let activeIncome = 1; // Salary per 10 grinds
    let passiveIncomeRate = 0; // Money per second
    let grindClicks = 0;
    let careerStage = 0; // Index for story progression

    // --- Game Data ---
    const storySegments = [
        // Stage 0
        { title: "Unemployed", text: "The city is vast, your wallet is empty. Time to find any work.", events: [] },
        // Stage 1 (after 10 clicks)
        { title: "Intern - Data Entry", text: "You landed an internship at a small tech firm, 'ByteSize Solutions'. Tedious data entry, but it's a start.", events: [
            { type: 'UNLOCK_PASSIVE', passiveId: 'coffeeFund', delay: 0 }
        ]},
        // Stage 2
        { title: "Junior Analyst - ByteSize", text: "Your persistence paid off. You're now a Junior Analyst. More responsibility, slightly better pay.", events: [
            { type: 'NEGATIVE_MONEY', message: "Your old laptop died! Cost: $50", value: -50, delay: 2000 }
        ]},
        // Stage 3
        { title: "Analyst - Synapse Project", text: "ByteSize tasks you with a new project: 'Synapse'. It's a revolutionary neural interface concept. You see its potential.", events: [
            { type: 'UNLOCK_PASSIVE', passiveId: 'onlineCourses', delay: 0 }
        ]},
        // Stage 4
        { title: "Lead Analyst - Synapse", text: "Your insights on Synapse are invaluable. You're leading the initial research team!", events: [
             { type: 'POSITIVE_MONEY', message: "Small bonus for your groundbreaking work on Synapse! +$100", value: 100, delay: 1000}
        ]},
        // Stage 5
        { title: "Project Manager - Synapse Launch", text: "Synapse is ready for its first B2B launch. The pressure is immense, but the excitement is palpable.", events: [
            { type: 'NEGATIVE_MONEY', message: "A competitor tried to poach a key team member! Counter-offer cost you $200.", value: -200, delay: 1500},
            { type: 'UNLOCK_PASSIVE', passiveId: 'stockOptions', delay: 0 }
        ]},
        // Stage 6
        { title: "VP of Innovation - Synapse Inc.", text: "The Synapse launch was a success! ByteSize spun it off into 'Synapse Inc.' and you're a VP! You meet Marcus Thorne, an angel investor.", events: [
             { type: 'POSITIVE_MONEY', message: "Marcus Thorne invests! Huge cash influx! +$1000", value: 1000, delay: 1000}
        ]},
        // Stage 7
        { title: "CEO - Synapse Inc.", text: "With Thorne's backing, you've taken the helm as CEO. Synapse Inc. is growing, but Helios Corp. and Augustus Sterling are watching.", events: [
            { type: 'UNLOCK_PASSIVE', passiveId: 'realEstate', delay: 0 },
            { type: 'NEGATIVE_MONEY', message: "Helios Corp initiates a patent lawsuit! Legal fees: $500", value: -500, delay: 3000 }
        ]},
        // Add more stages based on the "Apex Predator" storyline
        { title: "Tycoon", text: "You've built an empire... but the game never ends.", events: [] }
    ];

    const passiveIncomeSources = [
        { id: 'coffeeFund', name: "Personal Coffee Fund", cost: 20, income: 0.1, unlocked: false, purchased: false, description: "Keeps you awake. +$0.1/sec" },
        { id: 'onlineCourses', name: "Invest in Online Courses", cost: 100, income: 0.5, unlocked: false, purchased: false, description: "Skill up! +$0.5/sec" },
        { id: 'stockOptions', name: "Early Synapse Stock Options", cost: 500, income: 2.5, unlocked: false, purchased: false, description: "High risk, high reward. +$2.5/sec" },
        { id: 'realEstate', name: "Small Office Rental", cost: 2000, income: 10, unlocked: false, purchased: false, description: "Property is power. +$10/sec" },
    ];

    // --- Functions ---

    function updateDisplays() {
        moneyDisplay.textContent = money.toFixed(2);
        activeIncomeDisplay.textContent = activeIncome.toFixed(2);
        passiveIncomeDisplay.textContent = passiveIncomeRate.toFixed(2);
        careerTitleDisplay.textContent = storySegments[careerStage].title;
        grindProgressDisplay.textContent = grindClicks;

        // Update passive income buttons
        passiveOptionsDisplay.innerHTML = ''; // Clear old options
        passiveIncomeSources.forEach(source => {
            if (source.unlocked) {
                const itemDiv = document.createElement('div');
                itemDiv.classList.add('passive-item');
                itemDiv.innerHTML = `
                    <span>${source.name} (${source.description}) - Cost: $${source.cost.toFixed(2)}</span>
                    <button data-id="${source.id}" ${source.purchased || money < source.cost ? 'disabled' : ''}>
                        ${source.purchased ? 'Owned' : 'Buy'}
                    </button>
                `;
                passiveOptionsDisplay.appendChild(itemDiv);
                if (!source.purchased) {
                    itemDiv.querySelector('button').addEventListener('click', () => purchasePassiveIncome(source.id));
                }
            }
        });
    }

    function logEvent(message, type = '') {
        const p = document.createElement('p');
        p.textContent = message;
        if (type) {
            p.classList.add(type);
        }
        eventLog.insertBefore(p, eventLog.firstChild); // Add new events to the top
        if (eventLog.children.length > 10) { // Keep log size manageable
            eventLog.removeChild(eventLog.lastChild);
        }
    }

    function handleGameEvent(eventData) {
        logEvent(eventData.message, eventData.value > 0 ? 'positive' : (eventData.value < 0 ? 'negative' : 'neutral'));
        
        if (eventData.type === 'POSITIVE_MONEY' || eventData.type === 'NEGATIVE_MONEY') {
            money += eventData.value;
            if (money < 0 && careerStage > 0) { // Prevent debt early on, allow it later
                 // Optional: Add bankruptcy condition or more severe penalty later
                logEvent("Warning: Your finances are critically low!", "negative");
            }
        } else if (eventData.type === 'UNLOCK_PASSIVE') {
            const sourceToUnlock = passiveIncomeSources.find(s => s.id === eventData.passiveId);
            if (sourceToUnlock) {
                sourceToUnlock.unlocked = true;
                logEvent(`New Investment Opportunity: ${sourceToUnlock.name}!`, 'positive');
            }
        }
        updateDisplays();
    }

    function triggerStoryProgression() {
        storyDisplay.textContent = storySegments[careerStage].text;
        logEvent(`Promoted to: ${storySegments[careerStage].title}`, 'neutral');

        // Trigger scripted events for this stage
        if (storySegments[careerStage].events && storySegments[careerStage].events.length > 0) {
            storySegments[careerStage].events.forEach(event => {
                // Allow for a slight delay in event triggering for dramatic effect
                setTimeout(() => handleGameEvent(event), event.delay || 0);
            });
        }
        updateDisplays();
    }

    function handleGrindClick() {
        grindClicks++;
        if (grindClicks >= 10) {
            money += activeIncome;
            grindClicks = 0;
            activeIncome += 1; // Simple income progression

            if (careerStage < storySegments.length - 1) {
                careerStage++;
                triggerStoryProgression();
            } else {
                // Game End or Loop? For now, just stay at the last stage.
                storyDisplay.textContent = storySegments[careerStage].text + " You've reached the current peak of your career.";
            }
        }
        updateDisplays();
    }

    function purchasePassiveIncome(sourceId) {
        const source = passiveIncomeSources.find(s => s.id === sourceId);
        if (source && !source.purchased && money >= source.cost) {
            money -= source.cost;
            passiveIncomeRate += source.income;
            source.purchased = true;
            logEvent(`Purchased ${source.name}. Passive income increased!`, 'positive');
            updateDisplays();
        } else if (source && money < source.cost) {
            logEvent(`Not enough money to purchase ${source.name}.`, 'negative');
        }
    }

    function applyPassiveIncome() {
        money += passiveIncomeRate;
        updateDisplays();
    }

    // --- Initialization ---
    function initializeGame() {
        triggerStoryProgression(); // Display initial story
        updateDisplays();
        grindButton.addEventListener('click', handleGrindClick);
        setInterval(applyPassiveIncome, 1000); // Apply passive income every second
    }

    initializeGame();
});
